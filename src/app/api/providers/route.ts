import { getAvailableProviders, ALL_MODELS, PROVIDER_INFO } from '@/lib/llm'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  // Requer autenticação — não expor providers disponíveis publicamente
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const available = getAvailableProviders()

  const providers = available.map(id => ({
    id,
    ...PROVIDER_INFO[id],
    models: ALL_MODELS[id],
    available: true,
  }))

  return Response.json({ providers, default: available[0] || null })
}
