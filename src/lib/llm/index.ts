import { AnthropicProvider } from './anthropic'
import { OpenAIProvider } from './openai'
import { GroqProvider, GeminiProvider } from './providers'
import type { LLMProvider, ProviderID, LLMModel } from './types'
export * from './types'

// ─── All available models per provider ───────────────────────────────────────

import { ANTHROPIC_MODELS } from './anthropic'
import { OPENAI_MODELS } from './openai'
import { GROQ_MODELS, GEMINI_MODELS } from './providers'

export const ALL_MODELS: Record<ProviderID, LLMModel[]> = {
  anthropic: ANTHROPIC_MODELS,
  openai: OPENAI_MODELS,
  groq: GROQ_MODELS,
  gemini: GEMINI_MODELS,
}

// ─── Factory function ─────────────────────────────────────────────────────────

export function createLLMProvider(
  providerId: ProviderID,
  modelId?: string
): LLMProvider {
  switch (providerId) {
    case 'anthropic': {
      const key = process.env.ANTHROPIC_API_KEY
      if (!key) throw new Error('ANTHROPIC_API_KEY não configurada no .env.local')
      return new AnthropicProvider(key, modelId || 'claude-sonnet-4-20250514')
    }

    case 'openai': {
      const key = process.env.OPENAI_API_KEY
      if (!key) throw new Error('OPENAI_API_KEY não configurada no .env.local')
      return new OpenAIProvider(key, modelId || 'gpt-4o')
    }

    case 'groq': {
      const key = process.env.GROQ_API_KEY
      if (!key) throw new Error('GROQ_API_KEY não configurada no .env.local')
      return new GroqProvider(key, modelId || 'llama-3.3-70b-versatile')
    }

    case 'gemini': {
      const key = process.env.GEMINI_API_KEY
      if (!key) throw new Error('GEMINI_API_KEY não configurada no .env.local')
      return new GeminiProvider(key, modelId || 'gemini-2.0-flash')
    }

    default:
      throw new Error(`Provider desconhecido: ${providerId}`)
  }
}

// ─── Get default provider from env ───────────────────────────────────────────

export function getDefaultProvider(): ProviderID {
  const envProvider = process.env.DEFAULT_LLM_PROVIDER as ProviderID
  if (envProvider && ['anthropic', 'openai', 'groq', 'gemini'].includes(envProvider)) {
    return envProvider
  }
  // Auto-detect based on which keys are set
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.GROQ_API_KEY) return 'groq'
  if (process.env.GEMINI_API_KEY) return 'gemini'
  throw new Error('Nenhuma chave de LLM configurada. Adicione pelo menos uma ao .env.local')
}

// ─── Check which providers are available ─────────────────────────────────────

export function getAvailableProviders(): ProviderID[] {
  const available: ProviderID[] = []
  if (process.env.ANTHROPIC_API_KEY) available.push('anthropic')
  if (process.env.OPENAI_API_KEY) available.push('openai')
  if (process.env.GROQ_API_KEY) available.push('groq')
  if (process.env.GEMINI_API_KEY) available.push('gemini')
  return available
}
