import type {
  LLMProvider,
  LLMModel,
  LLMMessage,
  LLMTool,
  LLMResponse,
  LLMStreamOptions,
  LLMToolCall,
} from './types'

export const OPENAI_MODELS: LLMModel[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    contextWindow: 128000,
    supportsTools: true,
    costPer1kInput: 0.005,
    costPer1kOutput: 0.015,
    recommended: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    contextWindow: 128000,
    supportsTools: true,
    costPer1kInput: 0.00015,
    costPer1kOutput: 0.0006,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    contextWindow: 128000,
    supportsTools: true,
    costPer1kInput: 0.01,
    costPer1kOutput: 0.03,
  },
]

interface OpenAIMessage {
  role: string
  content: string
  tool_calls?: unknown[]
  tool_call_id?: string
}

interface OpenAITool {
  type: 'function'
  function: { name: string; description: string; parameters: Record<string, unknown> }
}

export class OpenAIProvider implements LLMProvider {
  readonly id = 'openai' as const
  readonly name = 'OpenAI GPT'
  readonly models = OPENAI_MODELS
  readonly supportsTools = true
  readonly supportsStreaming = true

  private apiKey: string
  private model: string
  private baseURL: string

  constructor(apiKey: string, model: string = 'gpt-4o', baseURL = 'https://api.openai.com/v1') {
    this.apiKey = apiKey
    this.model = model
    this.baseURL = baseURL
  }

  private toOpenAIMessages(messages: LLMMessage[]): OpenAIMessage[] {
    return messages.map(m => ({ role: m.role, content: m.content }))
  }

  private toOpenAITools(tools: LLMTool[]): OpenAITool[] {
    return tools.map(t => ({
      type: 'function' as const,
      function: { name: t.name, description: t.description, parameters: t.parameters },
    }))
  }

  async complete(options: LLMStreamOptions): Promise<LLMResponse> {
    const messages = this.toOpenAIMessages(options.messages)

    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.7,
      messages,
    }

    if (options.tools && options.tools.length > 0) {
      body.tools = this.toOpenAITools(options.tools)
      body.tool_choice = 'auto'
    }

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`OpenAI error: ${err.error?.message || res.statusText}`)
    }

    const data = await res.json()
    const choice = data.choices[0]
    const msg = choice.message

    const toolCalls: LLMToolCall[] = (msg.tool_calls || []).map((tc: {
      id: string
      function: { name: string; arguments: string }
    }) => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments || '{}'),
    }))

    return {
      content: msg.content || '',
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        input_tokens: data.usage?.prompt_tokens || 0,
        output_tokens: data.usage?.completion_tokens || 0,
      },
      stop_reason: choice.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn',
    }
  }

  async stream(options: LLMStreamOptions): Promise<LLMResponse> {
    // Detect tool calls first (non-streaming)
    const firstResponse = await this.complete(options)

    if (firstResponse.tool_calls && firstResponse.tool_calls.length > 0) {
      options.onToolCalls?.(firstResponse.tool_calls)
      return firstResponse
    }

    // Stream text response
    const messages = this.toOpenAIMessages(options.messages)

    const res = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: options.maxTokens || 2048,
        temperature: options.temperature ?? 0.7,
        stream: true,
        messages,
      }),
    })

    if (!res.ok || !res.body) throw new Error('OpenAI stream error')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6)
        if (payload === '[DONE]') break
        try {
          const json = JSON.parse(payload)
          const delta = json.choices?.[0]?.delta?.content
          if (delta) {
            fullText += delta
            options.onText?.(delta)
          }
        } catch { /* skip */ }
      }
    }

    return { content: fullText, stop_reason: 'end_turn' }
  }
}
