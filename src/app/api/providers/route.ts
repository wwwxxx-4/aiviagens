import { getAvailableProviders, ALL_MODELS, PROVIDER_INFO } from '@/lib/llm'

export async function GET() {
  const available = getAvailableProviders()

  const providers = available.map(id => ({
    id,
    ...PROVIDER_INFO[id],
    models: ALL_MODELS[id],
    available: true,
  }))

  return Response.json({ providers, default: available[0] || null })
}
