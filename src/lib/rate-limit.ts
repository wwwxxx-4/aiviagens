/**
 * Rate limiting simples usando a tabela search_cache do Supabase.
 * Sem dependências externas (sem Redis/Upstash).
 *
 * Limites:
 *   - /api/chat: 30 requisições por hora por usuário
 *   - Burst protection: máx 5 requisições por minuto
 */

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number // segundos
  reason?: string
}

/**
 * Verifica e incrementa o contador de rate limit para um usuário.
 * @param userId  ID do usuário autenticado
 * @param action  Identificador da ação (ex: 'chat', 'export')
 * @param maxPerHour  Máximo de requisições por hora (padrão: 30)
 * @param maxPerMinute  Máximo de requisições por minuto - burst (padrão: 5)
 */
export async function checkRateLimit(
  userId: string,
  action: string = 'chat',
  maxPerHour: number = 30,
  maxPerMinute: number = 5,
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowHour = Math.floor(now / (60 * 60 * 1000))   // janela de 1 hora
  const windowMinute = Math.floor(now / (60 * 1000))       // janela de 1 minuto

  const keyHour = `ratelimit:${userId}:${action}:h:${windowHour}`
  const keyMinute = `ratelimit:${userId}:${action}:m:${windowMinute}`

  try {
    // Buscar contadores atuais (hora e minuto) em paralelo
    const [hourRow, minuteRow] = await Promise.all([
      supabaseAdmin
        .from('search_cache')
        .select('data')
        .eq('cache_key', keyHour)
        .single()
        .then(r => r.data),
      supabaseAdmin
        .from('search_cache')
        .select('data')
        .eq('cache_key', keyMinute)
        .single()
        .then(r => r.data),
    ])

    const countHour: number = (hourRow?.data as { count: number } | null)?.count ?? 0
    const countMinute: number = (minuteRow?.data as { count: number } | null)?.count ?? 0

    // Verificar limites
    if (countMinute >= maxPerMinute) {
      const resetIn = 60 - (Math.floor(now / 1000) % 60)
      return { allowed: false, remaining: 0, resetIn, reason: 'burst' }
    }

    if (countHour >= maxPerHour) {
      const resetIn = 3600 - (Math.floor(now / 1000) % 3600)
      return { allowed: false, remaining: 0, resetIn, reason: 'hourly' }
    }

    // Incrementar contadores
    const expiresHour = new Date(now + 2 * 60 * 60 * 1000).toISOString()   // 2h para segurança
    const expiresMinute = new Date(now + 2 * 60 * 1000).toISOString()       // 2min

    await Promise.all([
      supabaseAdmin.from('search_cache').upsert({
        cache_key: keyHour,
        data: { count: countHour + 1 },
        search_type: 'ratelimit',
        expires_at: expiresHour,
      }),
      supabaseAdmin.from('search_cache').upsert({
        cache_key: keyMinute,
        data: { count: countMinute + 1 },
        search_type: 'ratelimit',
        expires_at: expiresMinute,
      }),
    ])

    return {
      allowed: true,
      remaining: Math.min(maxPerHour - countHour - 1, maxPerMinute - countMinute - 1),
      resetIn: 3600 - (Math.floor(now / 1000) % 3600),
    }
  } catch {
    // Em caso de erro no rate limit, permitir a requisição (fail-open)
    // para não bloquear usuários legítimos por falha de infra
    return { allowed: true, remaining: 1, resetIn: 3600 }
  }
}
