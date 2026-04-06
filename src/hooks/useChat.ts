'use client'

import { useState, useCallback, useRef } from 'react'
import type { FlightResult, HotelResult, ActivityResult } from '@/types'
import type { ProviderID } from '@/lib/llm/types'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'streaming' | 'done' | 'error'
  agency_packages?: unknown[]
  flights?: FlightResult[]
  flight_adults?: number
  flight_children?: number
  hotels?: HotelResult[]
  hotel_check_in?: string
  hotel_check_out?: string
  hotel_adults?: number
  hotel_children?: number
  activities?: ActivityResult[]
  weather?: unknown
  tools_running?: string[]
  provider?: string
  model?: string
}

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  conversationId: string | null
  sendMessage: (text: string, providerId?: ProviderID, modelId?: string) => Promise<void>
  clearMessages: () => void
  setInitialMessages: (msgs: ChatMessage[]) => void
}

export function useChat(initialConversationId?: string): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)
  const abortRef = useRef<AbortController | null>(null)

  function genId() { return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }

  function updateLast(updater: (msg: ChatMessage) => ChatMessage) {
    setMessages(prev => {
      const arr = [...prev]
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].role === 'assistant') { arr[i] = updater(arr[i]); break }
      }
      return arr
    })
  }

  const sendMessage = useCallback(async (
    text: string,
    providerId?: ProviderID,
    modelId?: string
  ) => {
    if (!text.trim() || isLoading) return
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const userMsg: ChatMessage = { id: genId(), role: 'user', content: text, status: 'done' }
    const assistantMsg: ChatMessage = { id: genId(), role: 'assistant', content: '', status: 'streaming', tools_running: [] }

    setMessages(prev => [...prev, userMsg, assistantMsg])
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversation_id: conversationId,
          provider_id: providerId,
          model_id: modelId,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            switch (event.type) {
              case 'provider':
                updateLast(m => ({ ...m, provider: event.provider, model: event.model }))
                break
              case 'text':
                updateLast(m => ({ ...m, content: m.content + event.content }))
                break
              case 'tool_running':
                updateLast(m => ({ ...m, tools_running: [...(m.tools_running || []), event.tool] }))
                break
              case 'agency_packages_found':
              updateLast(m => ({ ...m, agency_packages: event.packages }))
              break
            case 'flights_found':
                updateLast(m => ({ ...m, flights: event.flights, flight_adults: event.adults, flight_children: event.children, tools_running: (m.tools_running || []).filter((t: string) => t !== 'search_flights') }))
                break
              case 'hotels_found':
                updateLast(m => ({ ...m, hotels: event.hotels, hotel_check_in: event.check_in, hotel_check_out: event.check_out, hotel_adults: event.adults, hotel_children: event.children, tools_running: (m.tools_running || []).filter((t: string) => t !== 'search_hotels') }))
                break
              case 'activities_found':
                updateLast(m => ({ ...m, activities: event.activities, tools_running: (m.tools_running || []).filter((t: string) => t !== 'search_activities') }))
                break
              case 'weather_found':
                updateLast(m => ({ ...m, weather: event.weather }))
                break
              case 'done':
                if (event.conversation_id) setConversationId(event.conversation_id)
                updateLast(m => ({ ...m, status: 'done', tools_running: [] }))
                break
              case 'error':
                updateLast(m => ({ ...m, content: m.content || 'Ocorreu um erro. Tente novamente.', status: 'error', tools_running: [] }))
                break
            }
          } catch { /* skip */ }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      updateLast(m => ({ ...m, content: 'Conexão perdida. Verifique sua internet e tente novamente.', status: 'error', tools_running: [] }))
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, conversationId])

  function clearMessages() { setMessages([]); setConversationId(null) }
  function setInitialMessages(msgs: ChatMessage[]) { setMessages(msgs) }

  return { messages, isLoading, conversationId, sendMessage, clearMessages, setInitialMessages }
}
