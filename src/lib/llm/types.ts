// ============================================================
// LLM PROVIDER INTERFACE — Inteligência Viagens
// Todos os provedores implementam esta interface comum.
// Trocar de Claude para OpenAI = mudar 1 linha de config.
// ============================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMTool {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export interface LLMToolCall {
  id: string
  name: string
  input: Record<string, unknown>
}

export interface LLMStreamChunk {
  type: 'text' | 'tool_calls' | 'done' | 'error'
  text?: string
  tool_calls?: LLMToolCall[]
  error?: string
}

export interface LLMUsage {
  input_tokens: number
  output_tokens: number
}

export interface LLMResponse {
  content: string
  tool_calls?: LLMToolCall[]
  usage?: LLMUsage
  stop_reason: 'end_turn' | 'tool_use' | 'max_tokens' | 'stop'
}

export interface LLMStreamOptions {
  messages: LLMMessage[]
  tools?: LLMTool[]
  maxTokens?: number
  temperature?: number
  systemPrompt?: string
  onText?: (text: string) => void
  onToolCalls?: (calls: LLMToolCall[]) => void
}

// ─── Provider interface ────────────────────────────────────────────────────

export interface LLMProvider {
  readonly id: ProviderID
  readonly name: string
  readonly models: LLMModel[]
  readonly supportsTools: boolean
  readonly supportsStreaming: boolean

  /**
   * Chama o LLM e retorna resposta completa (com ou sem tool calls)
   */
  complete(options: LLMStreamOptions): Promise<LLMResponse>

  /**
   * Chama o LLM com streaming de texto
   */
  stream(options: LLMStreamOptions): Promise<LLMResponse>
}

// ─── Provider registry types ──────────────────────────────────────────────

export type ProviderID = 'anthropic' | 'openai' | 'gemini' | 'groq'

export interface LLMModel {
  id: string
  name: string
  contextWindow: number
  supportsTools: boolean
  costPer1kInput: number   // USD
  costPer1kOutput: number  // USD
  recommended?: boolean
}

export const PROVIDER_INFO: Record<ProviderID, {
  name: string
  description: string
  website: string
  envKey: string
  logo: string
}> = {
  anthropic: {
    name: 'Anthropic Claude',
    description: 'Excelente em raciocínio e seguir instruções complexas.',
    website: 'https://console.anthropic.com',
    envKey: 'ANTHROPIC_API_KEY',
    logo: '🟠',
  },
  openai: {
    name: 'OpenAI GPT',
    description: 'O mais popular. Ótimo ecossistema e suporte a ferramentas.',
    website: 'https://platform.openai.com',
    envKey: 'OPENAI_API_KEY',
    logo: '🟢',
  },
  gemini: {
    name: 'Google Gemini',
    description: 'Forte integração com dados do Google. Multimodal.',
    website: 'https://aistudio.google.com',
    envKey: 'GEMINI_API_KEY',
    logo: '🔵',
  },
  groq: {
    name: 'Groq (LLaMA)',
    description: 'Ultra-rápido e gratuito. Ideal para desenvolvimento.',
    website: 'https://console.groq.com',
    envKey: 'GROQ_API_KEY',
    logo: '🟣',
  },
}
