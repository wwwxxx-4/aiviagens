import type {
  LLMProvider, LLMModel, LLMMessage,
  LLMResponse, LLMStreamOptions, LLMToolCall, LLMTool,
} from './types'

// ─── Groq Provider (LLaMA via OpenAI-compatible API) ─────────────────────────
// Groq usa a mesma API do OpenAI — só muda o baseURL e os modelos

export const GROQ_MODELS: LLMModel[] = [
  {
    id: 'llama-3.3-70b-versatile',
    name: 'LLaMA 3.3 70B',
    contextWindow: 128000,
    supportsTools: true,
    costPer1kInput: 0.00059,
    costPer1kOutput: 0.00079,
    recommended: true,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'LLaMA 3.1 8B (ultra-rápido)',
    contextWindow: 128000,
    supportsTools: true,
    costPer1kInput: 0.00005,
    costPer1kOutput: 0.00008,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    contextWindow: 32768,
    supportsTools: true,
    costPer1kInput: 0.00027,
    costPer1kOutput: 0.00027,
  },
]

export class GroqProvider implements LLMProvider {
  readonly id = 'groq' as const
  readonly name = 'Groq (LLaMA)'
  readonly models = GROQ_MODELS
  readonly supportsTools = true
  readonly supportsStreaming = true

  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'llama-3.3-70b-versatile') {
    this.apiKey = apiKey
    this.model = model
  }

  private async callGroq(messages: LLMMessage[], tools?: LLMTool[], stream = false): Promise<Response> {
    const body: Record<string, unknown> = {
      model: this.model,
      max_tokens: 2048,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream,
    }
    if (tools?.length) {
      body.tools = tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      }))
      body.tool_choice = 'auto'
    }

    return fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    })
  }

  async complete(options: LLMStreamOptions): Promise<LLMResponse> {
    const res = await this.callGroq(options.messages, options.tools)
    if (!res.ok) throw new Error(`Groq error: ${res.statusText}`)
    const data = await res.json()
    const choice = data.choices[0]
    const msg = choice.message

    const toolCalls: LLMToolCall[] = (msg.tool_calls || []).map((tc: {
      id: string; function: { name: string; arguments: string }
    }) => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments || '{}'),
    }))

    return {
      content: msg.content || '',
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: { input_tokens: data.usage?.prompt_tokens || 0, output_tokens: data.usage?.completion_tokens || 0 },
      stop_reason: choice.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn',
    }
  }

  async stream(options: LLMStreamOptions): Promise<LLMResponse> {
    const first = await this.complete(options)
    if (first.tool_calls?.length) { options.onToolCalls?.(first.tool_calls); return first }

    const res = await this.callGroq(options.messages, undefined, true)
    if (!res.ok || !res.body) throw new Error('Groq stream error')

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n'); buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6)
        if (payload === '[DONE]') break
        try {
          const delta = JSON.parse(payload).choices?.[0]?.delta?.content
          if (delta) { fullText += delta; options.onText?.(delta) }
        } catch { /* skip */ }
      }
    }

    return { content: fullText, stop_reason: 'end_turn' }
  }
}

// ─── Gemini Provider ──────────────────────────────────────────────────────────

export const GEMINI_MODELS: LLMModel[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    contextWindow: 1000000,
    supportsTools: true,
    costPer1kInput: 0.000075,
    costPer1kOutput: 0.0003,
    recommended: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    contextWindow: 2000000,
    supportsTools: true,
    costPer1kInput: 0.00125,
    costPer1kOutput: 0.005,
  },
]

export class GeminiProvider implements LLMProvider {
  readonly id = 'gemini' as const
  readonly name = 'Google Gemini'
  readonly models = GEMINI_MODELS
  readonly supportsTools = true
  readonly supportsStreaming = true

  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.apiKey = apiKey
    this.model = model
  }

  private toGeminiMessages(messages: LLMMessage[]) {
    const system = messages.find(m => m.role === 'system')?.content
    const history = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
    return { system, history }
  }

  async complete(options: LLMStreamOptions): Promise<LLMResponse> {
    const { system, history } = this.toGeminiMessages(options.messages)
    const lastMsg = history.pop()

    const body: Record<string, unknown> = {
      contents: [...history, lastMsg],
      generationConfig: { maxOutputTokens: options.maxTokens || 2048, temperature: options.temperature ?? 0.7 },
    }
    if (system) body.systemInstruction = { parts: [{ text: system }] }

    if (options.tools?.length) {
      body.tools = [{
        functionDeclarations: options.tools.map(t => ({
          name: t.name, description: t.description, parameters: t.parameters,
        })),
      }]
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    )

    if (!res.ok) throw new Error(`Gemini error: ${res.statusText}`)
    const data = await res.json()
    const candidate = data.candidates?.[0]
    const parts = candidate?.content?.parts || []

    let textContent = ''
    const toolCalls: LLMToolCall[] = []

    for (const part of parts) {
      if (part.text) textContent += part.text
      if (part.functionCall) {
        toolCalls.push({ id: `gemini_${Date.now()}`, name: part.functionCall.name, input: part.functionCall.args || {} })
      }
    }

    return {
      content: textContent,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      stop_reason: toolCalls.length > 0 ? 'tool_use' : 'end_turn',
    }
  }

  async stream(options: LLMStreamOptions): Promise<LLMResponse> {
    const first = await this.complete(options)
    if (first.tool_calls?.length) { options.onToolCalls?.(first.tool_calls); return first }

    // Simulate streaming by calling onText with chunks
    const words = first.content.split(' ')
    for (const word of words) {
      options.onText?.(word + ' ')
      await new Promise(r => setTimeout(r, 10))
    }

    return first
  }
}
