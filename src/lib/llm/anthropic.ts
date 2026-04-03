import Anthropic from '@anthropic-ai/sdk'
import type {
  LLMProvider,
  LLMModel,
  LLMMessage,
  LLMTool,
  LLMResponse,
  LLMStreamOptions,
  LLMToolCall,
} from './types'

export const ANTHROPIC_MODELS: LLMModel[] = [
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    contextWindow: 200000,
    supportsTools: true,
    costPer1kInput: 0.003,
    costPer1kOutput: 0.015,
    recommended: true,
  },
  {
    id: 'claude-opus-4-5',
    name: 'Claude Opus 4.5',
    contextWindow: 200000,
    supportsTools: true,
    costPer1kInput: 0.015,
    costPer1kOutput: 0.075,
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    contextWindow: 200000,
    supportsTools: true,
    costPer1kInput: 0.00025,
    costPer1kOutput: 0.00125,
  },
]

function toAnthropicMessages(messages: LLMMessage[]): Anthropic.MessageParam[] {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
}

function toAnthropicTools(tools: LLMTool[]): Anthropic.Tool[] {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.parameters as Anthropic.Tool['input_schema'],
  }))
}

export class AnthropicProvider implements LLMProvider {
  readonly id = 'anthropic' as const
  readonly name = 'Anthropic Claude'
  readonly models = ANTHROPIC_MODELS
  readonly supportsTools = true
  readonly supportsStreaming = true

  private client: Anthropic
  private model: string

  constructor(apiKey: string, model: string = 'claude-sonnet-4-20250514') {
    this.client = new Anthropic({ apiKey })
    this.model = model
  }

  async complete(options: LLMStreamOptions): Promise<LLMResponse> {
    const systemMsg = options.systemPrompt ||
      options.messages.find(m => m.role === 'system')?.content

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens || 2048,
      system: systemMsg,
      tools: options.tools ? toAnthropicTools(options.tools) : undefined,
      messages: toAnthropicMessages(options.messages),
    })

    const textContent = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as Anthropic.TextBlock).text)
      .join('')

    const toolCalls: LLMToolCall[] = response.content
      .filter(b => b.type === 'tool_use')
      .map(b => {
        const tb = b as Anthropic.ToolUseBlock
        return { id: tb.id, name: tb.name, input: tb.input as Record<string, unknown> }
      })

    return {
      content: textContent,
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        input_tokens: response.usage.input_tokens,
        output_tokens: response.usage.output_tokens,
      },
      stop_reason: response.stop_reason === 'tool_use' ? 'tool_use' : 'end_turn',
    }
  }

  async stream(options: LLMStreamOptions): Promise<LLMResponse> {
    // First call to detect tool use (non-streaming for tool detection)
    const firstResponse = await this.complete(options)

    if (firstResponse.tool_calls && firstResponse.tool_calls.length > 0) {
      options.onToolCalls?.(firstResponse.tool_calls)
      return firstResponse
    }

    // No tools — stream the text response
    const systemMsg = options.systemPrompt ||
      options.messages.find(m => m.role === 'system')?.content

    let fullText = ''
    const streamResponse = await this.client.messages.stream({
      model: this.model,
      max_tokens: options.maxTokens || 2048,
      system: systemMsg,
      messages: toAnthropicMessages(options.messages),
    })

    for await (const chunk of streamResponse) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        fullText += chunk.delta.text
        options.onText?.(chunk.delta.text)
      }
    }

    return { content: fullText, stop_reason: 'end_turn' }
  }
}
