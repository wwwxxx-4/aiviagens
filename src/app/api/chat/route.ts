import { createClient } from '@/lib/supabase/server'
import { createLLMProvider, getDefaultProvider } from '@/lib/llm'
import { searchFlights, searchHotels, searchActivities, getWeather } from '@/lib/serpapi'
import { fetchAgencyPackages, filterPackages, formatPackagesForAgent } from '@/lib/agency-packages'
import { getTravelSystemPrompt, TRAVEL_TOOLS } from '@/lib/claude'
import { checkRateLimit } from '@/lib/rate-limit'
import type { NextRequest } from 'next/server'
import type { LLMMessage, LLMTool, ProviderID } from '@/lib/llm'

export const runtime = 'nodejs'
export const maxDuration = 60

// ── E-mail de notificação para a agência quando passageiro fornece dados ──────
async function sendPassengerEmailNotification(
  passenger: Record<string, unknown>,
  context: Record<string, unknown>,
  conversationId: string
) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurado — notificação por e-mail ignorada')
    return
  }

  const flights = context.flights as Array<Record<string, unknown>> | undefined
  const hotels = context.hotels as Array<Record<string, unknown>> | undefined
  const adults = Number(context.flight_adults || context.hotel_adults || 1)
  const children = Number(context.flight_children || context.hotel_children || 0)

  const flightInfo = flights && flights.length > 0
    ? flights.map(f => `✈️ ${f.origin} → ${f.destination} | ${f.airline} | ${f.departure_time || ''} | R$ ${f.price || '-'}`).join('<br/>')
    : null

  const hotelInfo = hotels && hotels.length > 0
    ? hotels.map(h => `🏨 ${h.name} | ${h.address || ''} | R$ ${h.price_per_night || '-'}/noite`).join('<br/>')
    : null

  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#177CBC;padding:20px 24px;border-radius:8px 8px 0 0">
        <h1 style="color:white;margin:0;font-size:20px">🔔 Nova Solicitação de Reserva</h1>
        <p style="color:#BDE2F4;margin:4px 0 0;font-size:14px">AI Mesquita Turismo</p>
      </div>
      <div style="background:#f9f9f9;padding:24px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px">
        <h2 style="color:#1a1a1a;font-size:16px;margin-top:0">👤 Dados do Passageiro</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:6px 0;color:#6b7280;width:140px">Nome completo:</td><td style="padding:6px 0;font-weight:600">${passenger.full_name || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">CPF:</td><td style="padding:6px 0;font-weight:600">${passenger.cpf || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Data de nascimento:</td><td style="padding:6px 0;font-weight:600">${passenger.birth_date || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">E-mail:</td><td style="padding:6px 0;font-weight:600">${passenger.email || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">WhatsApp:</td><td style="padding:6px 0;font-weight:600">${passenger.phone || '—'}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Passageiros:</td><td style="padding:6px 0;font-weight:600">${adults} adulto${adults !== 1 ? 's' : ''}${children > 0 ? ` + ${children} criança${children !== 1 ? 's' : ''}` : ''}</td></tr>
        </table>
        ${flightInfo ? `<h2 style="color:#1a1a1a;font-size:16px;margin-top:20px">✈️ Voo de interesse</h2><p style="line-height:1.8">${flightInfo}</p>` : ''}
        ${hotelInfo ? `<h2 style="color:#1a1a1a;font-size:16px;margin-top:20px">🏨 Hotel de interesse</h2><p style="line-height:1.8">${hotelInfo}</p>` : ''}
        <div style="margin-top:24px;padding:12px 16px;background:#EBF8FD;border-left:4px solid #177CBC;border-radius:4px">
          <p style="margin:0;font-size:13px;color:#177CBC"><strong>ID da conversa:</strong> ${conversationId}</p>
        </div>
        <p style="margin-top:20px;font-size:13px;color:#9ca3af">Enviado automaticamente pelo sistema AI Mesquita Turismo.</p>
      </div>
    </div>
  `

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'AI Mesquita Turismo <onboarding@resend.dev>',
      to: ['westermesquita@gmail.com'],
      subject: `🔔 Nova reserva: ${passenger.full_name || 'Passageiro'} — AI Mesquita Turismo`,
      html,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Resend API error: ${response.status} — ${errText}`)
  }

  console.log('Email de notificação enviado para westermesquita@gmail.com')
}

const LLMTOOLS: LLMTool[] = TRAVEL_TOOLS.map(t => ({
  name: t.name,
  description: t.description ?? '',
  parameters: t.input_schema as Record<string, unknown>,
}))

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // ── Rate limiting: 30 req/hora, 5 req/minuto por usuário ──────────────────
    const rateLimit = await checkRateLimit(user.id, 'chat', 30, 5)
    if (!rateLimit.allowed) {
      const msg = rateLimit.reason === 'burst'
        ? `Muitas mensagens em pouco tempo. Aguarde ${rateLimit.resetIn}s.`
        : `Limite de mensagens por hora atingido. Tente novamente em ${Math.ceil(rateLimit.resetIn / 60)} minutos.`
      return new Response(JSON.stringify({ error: msg }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.resetIn),
          'X-RateLimit-Remaining': '0',
        },
      })
    }

    const body = await request.json()
    const { message, conversation_id, provider_id, model_id } = body as {
      message: string
      conversation_id?: string
      provider_id?: string
      model_id?: string
    }

    // Provider fixo: OpenAI GPT-4o
    const FORCED_PROVIDER: ProviderID = 'openai'
    const FORCED_MODEL = 'gpt-4o'
    let providerId: ProviderID = FORCED_PROVIDER
    let llm
    try {
      llm = createLLMProvider(FORCED_PROVIDER, FORCED_MODEL)
      console.log('Provider:', FORCED_PROVIDER, FORCED_MODEL)
    } catch (e) {
      console.error('Provider error:', e)
      try { providerId = getDefaultProvider(); llm = createLLMProvider(providerId) }
      catch (e2) { return new Response(JSON.stringify({ error: 'Verifique OPENAI_API_KEY no .env.local: ' + String(e2) }), { status: 500 }) }
    }

    // Create or use conversation
    let convId = conversation_id
    if (!convId) {
      const title = message.length > 60 ? message.slice(0, 57) + '...' : message
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({ user_id: user.id, title })
        .select('id')
        .single()

      if (convError) {
        console.error('Conversation create error:', convError)
        return new Response(JSON.stringify({ error: 'Error creating conversation: ' + convError.message }), { status: 500 })
      }
      convId = conv.id
    } else {
      // Verificar que a conversa pertence ao usuário autenticado (isolamento de dados)
      const { data: conv, error: convCheckError } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', convId)
        .eq('user_id', user.id)
        .single()

      if (convCheckError || !conv) {
        return new Response(JSON.stringify({ error: 'Conversation not found or access denied' }), { status: 403 })
      }
    }

    // Save user message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, role: 'user', content: message })

    if (msgError) {
      console.error('Message insert error:', msgError)
    }

    // Load history — mensagens apenas da conversa verificada acima
    const { data: history } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(20)

    const llmMessages: LLMMessage[] = [
      { role: 'system', content: getTravelSystemPrompt() },
      ...(history || []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ]

    const encoder = new TextEncoder()
    let fullAssistantText = ''
    let toolResultsMetadata: Record<string, unknown> = {}

    const stream = new ReadableStream({
      async start(controller) {
        function send(chunk: object) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
          } catch (e) {
            console.error('Stream send error:', e)
          }
        }

        try {
          send({ type: 'provider', provider: providerId, model: model_id || llm.models.find(m => m.recommended)?.id })

          console.log('Calling LLM with provider:', providerId)
          const firstResponse = await llm.complete({
            messages: llmMessages,
            tools: LLMTOOLS,
            maxTokens: 2048,
            systemPrompt: getTravelSystemPrompt(),
          })
          console.log('LLM response received, stop_reason:', firstResponse.stop_reason)

          if (firstResponse.tool_calls && firstResponse.tool_calls.length > 0) {
            send({ type: 'tools_start', count: firstResponse.tool_calls.length })
            const toolResults: LLMMessage[] = []

            for (const call of firstResponse.tool_calls) {
              send({ type: 'tool_running', tool: call.name })
              let result: unknown = null

              try {
                const inp = call.input
                switch (call.name) {
                  case 'search_agency_packages':
                    try {
                      const allPkgs = await fetchAgencyPackages()
                      const filtered = filterPackages(allPkgs, {
                        destination: inp.destination as string | undefined,
                        tipo: inp.tipo as string | undefined,
                        month: inp.month as string | undefined,
                        max_price: inp.max_price as number | undefined,
                        origin: inp.origin as string | undefined,
                        all_inclusive: inp.all_inclusive as boolean | undefined,
                        luxo: inp.luxo as boolean | undefined,
                      })
                      const formatted = formatPackagesForAgent(filtered)
                      result = { packages: filtered.slice(0, 6), count: filtered.length, formatted }
                      toolResultsMetadata.agency_packages = filtered.slice(0, 6)
                      send({ type: 'agency_packages_found', packages: filtered.slice(0, 6) })
                    } catch (pkgsErr) {
                      result = { error: 'Não foi possível buscar pacotes da agência', packages: [] }
                    }
                    break
                  case 'extract_travel_intent':
                    result = { intent: inp, extracted: true }
                    toolResultsMetadata.travel_intent = inp
                    break
                  case 'search_flights': {
                    // ── Validação de inputs ──────────────────────────────────
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
                    const iataRegex = /^[A-Z]{3}(,[A-Z]{3})*$/i  // ex: GRU ou GRU,CGH,VCP
                    const flightOrigin = String(inp.origin || '').trim().toUpperCase()
                    const flightDest = String(inp.destination || '').trim().toUpperCase()
                    const flightDate = String(inp.outbound_date || '').trim()
                    const flightReturn = inp.return_date ? String(inp.return_date).trim() : undefined
                    const flightAdults = Math.min(Math.max(Number(inp.adults) || 1, 1), 9)
                    const flightChildren = Math.min(Math.max(Number(inp.children) || 0, 0), 8)

                    if (!iataRegex.test(flightOrigin) || !iataRegex.test(flightDest)) {
                      result = { error: 'Código de aeroporto inválido. Use código IATA (ex: GRU, SAO, RIO).' }
                      break
                    }
                    if (!dateRegex.test(flightDate) || new Date(flightDate) < new Date()) {
                      result = { error: 'Data de ida inválida ou no passado. Use formato YYYY-MM-DD com data futura.' }
                      break
                    }
                    if (flightReturn && (!dateRegex.test(flightReturn) || new Date(flightReturn) <= new Date(flightDate))) {
                      result = { error: 'Data de volta inválida. Deve ser posterior à data de ida.' }
                      break
                    }
                    // ────────────────────────────────────────────────────────
                    const flights = await searchFlights({
                      origin: flightOrigin,
                      destination: flightDest,
                      outbound_date: flightDate,
                      return_date: flightReturn,
                      adults: flightAdults,
                      children: flightChildren,
                      currency: inp.currency as string | undefined,
                    })
                    result = { flights, count: flights.length }
                    toolResultsMetadata.flights = flights
                    toolResultsMetadata.flight_adults = flightAdults
                    toolResultsMetadata.flight_children = flightChildren
                    send({ type: 'flights_found', flights, adults: flightAdults, children: flightChildren })
                    break
                  }
                  case 'search_hotels': {
                    // ── Validação de inputs ──────────────────────────────────
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
                    const hotelDest = String(inp.destination || '').trim()
                    const hotelIn = String(inp.check_in || '').trim()
                    const hotelOut = String(inp.check_out || '').trim()
                    const hotelAdults = Math.min(Math.max(Number(inp.adults) || 1, 1), 9)
                    const hotelChildren = Math.min(Math.max(Number(inp.children) || 0, 0), 8)

                    if (!hotelDest) {
                      result = { error: 'Destino não informado para busca de hotéis.' }
                      break
                    }
                    if (!dateRegex.test(hotelIn) || !dateRegex.test(hotelOut)) {
                      result = { error: 'Datas de check-in/check-out inválidas. Use formato YYYY-MM-DD.' }
                      break
                    }
                    if (new Date(hotelOut) <= new Date(hotelIn)) {
                      result = { error: 'Check-out deve ser posterior ao check-in.' }
                      break
                    }
                    // ────────────────────────────────────────────────────────
                    const hotels = await searchHotels({
                      destination: hotelDest,
                      check_in: hotelIn,
                      check_out: hotelOut,
                      adults: hotelAdults,
                      currency: inp.currency as string | undefined,
                    })
                    result = { hotels, count: hotels.length }
                    toolResultsMetadata.hotels = hotels
                    toolResultsMetadata.hotel_adults = hotelAdults
                    toolResultsMetadata.hotel_children = hotelChildren
                    toolResultsMetadata.hotel_check_in = hotelIn
                    toolResultsMetadata.hotel_check_out = hotelOut
                    send({ type: 'hotels_found', hotels, check_in: hotelIn, check_out: hotelOut, adults: hotelAdults, children: hotelChildren })
                    break
                  }
                  case 'search_activities':
                    const activities = await searchActivities(inp.destination as string, inp.category as string)
                    result = { activities, count: activities.length }
                    toolResultsMetadata.activities = activities
                    send({ type: 'activities_found', activities })
                    break
                  case 'get_weather':
                    const weather = await getWeather(inp.destination as string)
                    result = weather || { error: 'Clima não disponível' }
                    toolResultsMetadata.weather = weather
                    send({ type: 'weather_found', weather })
                    break
                  case 'save_travel_package':
                    const { error: pkgErr } = await supabase.from('travel_packages').insert({
                      user_id: user.id, conversation_id: convId,
                      title: inp.title as string, destination: inp.destination as string,
                      destination_country: inp.destination_country as string,
                      check_in: inp.check_in as string, check_out: inp.check_out as string,
                      adults: Number(inp.adults) || Number(toolResultsMetadata.flight_adults) || 1,
                      children: Number(inp.children) || Number(toolResultsMetadata.flight_children) || 0,
                      total_price: inp.total_price as number, currency: (inp.currency as string) || 'BRL',
                      notes: inp.notes as string,
                      flight_data: toolResultsMetadata.flights || {},
                      hotel_data: toolResultsMetadata.hotels || {},
                      activities_data: toolResultsMetadata.activities || [],
                    })
                    result = { saved: !pkgErr }
                    send({ type: 'package_saved', success: !pkgErr })
                    break
                  case 'collect_passenger_data': {
                    result = { collected: true, ...inp }
                    const lead = inp as Record<string, unknown>

                    // ── Salvar lead no banco (backup sempre funciona) ────────
                    try {
                      await supabase.from('passenger_leads').insert({
                        user_id: user.id,
                        conversation_id: convId,
                        full_name: lead.full_name ?? null,
                        birth_date: lead.birth_date ?? null,
                        cpf: lead.cpf ?? null,
                        email: lead.email ?? null,
                        phone: lead.phone ?? null,
                        flight_info: toolResultsMetadata.flights ?? null,
                        hotel_info: toolResultsMetadata.hotels ?? null,
                        adults: Number(toolResultsMetadata.flight_adults ?? toolResultsMetadata.hotel_adults ?? 1),
                        children: Number(toolResultsMetadata.flight_children ?? toolResultsMetadata.hotel_children ?? 0),
                      })
                      console.log('Lead salvo no banco:', lead.full_name)
                    } catch (dbErr) {
                      console.error('Lead DB error:', dbErr)
                    }

                    // ── Notificação por e-mail para a agência ────────────────
                    try {
                      await sendPassengerEmailNotification(
                        lead,
                        toolResultsMetadata,
                        convId!
                      )
                    } catch (emailErr) {
                      console.error('Email notification error:', emailErr)
                    }
                    break
                  }
                  default:
                    result = { error: 'Ferramenta desconhecida' }
                }
              } catch (toolErr) {
                console.error('Tool error:', call.name, toolErr)
                result = { error: String(toolErr) }
                send({ type: 'tool_error', tool: call.name, error: String(toolErr) })
              }

              toolResults.push({
                role: 'user',
                content: `[Tool result for ${call.name}]: ${JSON.stringify(result)}`,
              })
            }

            send({ type: 'generating' })
            const finalMessages: LLMMessage[] = [
              ...llmMessages,
              { role: 'assistant', content: firstResponse.content || '[tools executed]' },
              ...toolResults,
            ]

            await llm.stream({
              messages: finalMessages,
              maxTokens: 2048,
              systemPrompt: getTravelSystemPrompt(),
              onText: (text) => { fullAssistantText += text; send({ type: 'text', content: text }) },
            })

          } else {
            send({ type: 'generating' })
            await llm.stream({
              messages: llmMessages,
              maxTokens: 2048,
              systemPrompt: getTravelSystemPrompt(),
              onText: (text) => { fullAssistantText += text; send({ type: 'text', content: text }) },
            })
          }

          // Save assistant response
          await supabase.from('messages').insert({
            conversation_id: convId, role: 'assistant',
            content: fullAssistantText.trim() || '...',
            metadata: { ...toolResultsMetadata, provider: providerId },
          })
          await supabase.from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', convId)

          send({ type: 'done', conversation_id: convId })
          controller.close()

        } catch (err) {
          console.error('Stream error:', err)
          send({ type: 'error', content: String(err) })
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (outerErr) {
    console.error('Outer error:', outerErr)
    return new Response(JSON.stringify({ error: String(outerErr) }), { status: 500 })
  }
}
