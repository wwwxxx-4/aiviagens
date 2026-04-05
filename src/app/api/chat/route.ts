import { createClient } from '@/lib/supabase/server'
import { createLLMProvider, getDefaultProvider } from '@/lib/llm'
import { searchFlights, searchHotels, searchActivities, getWeather } from '@/lib/serpapi'
import { fetchAgencyPackages, filterPackages, formatPackagesForAgent } from '@/lib/agency-packages'
import { getTravelSystemPrompt, TRAVEL_TOOLS } from '@/lib/claude'
import type { NextRequest } from 'next/server'
import type { LLMMessage, LLMTool, ProviderID } from '@/lib/llm'

export const runtime = 'nodejs'
export const maxDuration = 60

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
    }

    // Save user message
    const { error: msgError } = await supabase
      .from('messages')
      .insert({ conversation_id: convId, role: 'user', content: message })

    if (msgError) {
      console.error('Message insert error:', msgError)
    }

    // Load history
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
                  case 'search_flights':
                    const flights = await searchFlights({
                      origin: inp.origin as string,
                      destination: inp.destination as string,
                      outbound_date: inp.outbound_date as string,
                      return_date: inp.return_date as string | undefined,
                      adults: inp.adults as number | undefined,
                      currency: inp.currency as string | undefined,
                    })
                    result = { flights, count: flights.length }
                    toolResultsMetadata.flights = flights
                    send({ type: 'flights_found', flights, adults: (inp.adults as number) || 1 })
                    break
                  case 'search_hotels':
                    const hotels = await searchHotels({
                      destination: inp.destination as string,
                      check_in: inp.check_in as string,
                      check_out: inp.check_out as string,
                      adults: inp.adults as number | undefined,
                      currency: inp.currency as string | undefined,
                    })
                    result = { hotels, count: hotels.length }
                    toolResultsMetadata.hotels = hotels
                    send({ type: 'hotels_found', hotels, check_in: inp.check_in as string, check_out: inp.check_out as string })
                    break
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
                      adults: (inp.adults as number) || 1, children: (inp.children as number) || 0,
                      total_price: inp.total_price as number, currency: (inp.currency as string) || 'BRL',
                      notes: inp.notes as string,
                      flight_data: toolResultsMetadata.flights || {},
                      hotel_data: toolResultsMetadata.hotels || {},
                      activities_data: toolResultsMetadata.activities || [],
                    })
                    result = { saved: !pkgErr }
                    send({ type: 'package_saved', success: !pkgErr })
                    break
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
