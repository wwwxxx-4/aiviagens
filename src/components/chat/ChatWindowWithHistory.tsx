'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Plane, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useChat, type ChatMessage } from '@/hooks/useChat'
import { MessageBubble } from './MessageBubble'
import { SearchPanel } from './SearchPanel'
import { ProviderSelector } from './ProviderSelector'
import { cn } from '@/lib/utils'
import type { ProviderID } from '@/lib/llm/types'

const DEFAULT_PROVIDER = 'openai' as const
const DEFAULT_MODEL = 'gpt-4o'

interface HistoryMessage {
  id: string
  role: string
  content: string
  metadata?: Record<string, unknown>
  created_at: string
}

interface ChatWindowWithHistoryProps {
  conversationId: string
  initialMessages: HistoryMessage[]
}

export function ChatWindowWithHistory({ conversationId, initialMessages }: ChatWindowWithHistoryProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderID | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const { messages, isLoading, sendMessage, setInitialMessages } = useChat(conversationId)
  const [input, setInput] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (!initialized.current && initialMessages.length > 0) {
      // Convert DB messages to ChatMessage format
      const converted: ChatMessage[] = initialMessages.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        status: 'done' as const,
        flights: m.metadata?.flights as ChatMessage['flights'],
        flight_adults: m.metadata?.flight_adults as number | undefined,
        flight_children: m.metadata?.flight_children as number | undefined,
        hotels: m.metadata?.hotels as ChatMessage['hotels'],
        hotel_check_in: m.metadata?.hotel_check_in as string | undefined,
        hotel_check_out: m.metadata?.hotel_check_out as string | undefined,
        hotel_adults: m.metadata?.hotel_adults as number | undefined,
        hotel_children: m.metadata?.hotel_children as number | undefined,
        activities: m.metadata?.activities as ChatMessage['activities'],
        weather: m.metadata?.weather,
        tools_running: [],
      }))
      setInitialMessages(converted)
      initialized.current = true
    }
  }, [])

  useEffect(() => {
    fetch('/api/providers')
      .then(r => r.json())
      .then(data => {
        if (data.default && !selectedProvider) {
          setSelectedProvider(data.default)
          const defaultModels = data.providers?.find((p: { id: string }) => p.id === data.default)?.models
          const recommended = defaultModels?.find((m: { recommended: boolean }) => m.recommended)
          if (recommended) setSelectedModel(recommended.id)
        }
      }).catch(() => {})
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    inputRef.current?.focus()
    await sendMessage(text, DEFAULT_PROVIDER, DEFAULT_MODEL)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="flex flex-col h-screen bg-[#F0F9FD]">
      <div className="flex items-center justify-between px-6 py-3 border-b border-black/5 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
            <Plane size={14} className="text-brand-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">Assistente de Viagens</p>
            <p className="text-xs text-brand-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 inline-block animate-pulse-soft" />
              Online · Dados em tempo real
            </p>
          </div>
        </div>
        <a href="/chat/new" className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
          <RotateCcw size={11} /> Nova conversa
        </a>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
        <div ref={messagesEndRef} />
      </div>

      <div className="px-6 py-4 border-t border-black/5 bg-white">
        {/* Search Panel */}
        {showSearch && (
          <div className="mb-3 animate-fade-in">
            <SearchPanel
              onClose={() => setShowSearch(false)}
              onSearch={msg => {
                setShowSearch(false)
                sendMessage(msg, DEFAULT_PROVIDER, DEFAULT_MODEL)
              }}
            />
          </div>
        )}
        <div className={cn(
          'flex items-end gap-2 bg-[#F0F9FD] rounded-2xl border transition-all',
          'border-black/8 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100'
        )}>
          {/* Search toggle button */}
          <button
            onClick={() => setShowSearch(s => !s)}
            title="Buscar voos e hotéis"
            className={cn(
              'flex items-center gap-1.5 px-3 h-9 rounded-xl mb-1.5 ml-1.5 transition-all flex-shrink-0 text-xs font-semibold whitespace-nowrap',
              showSearch
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-brand-50 hover:text-brand-600'
            )}
          >
            <SlidersHorizontal size={13} />
            <span className="hidden sm:inline">Buscar</span>
          </button>
          <textarea
            ref={inputRef} value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px' }}
            onKeyDown={handleKeyDown}
            placeholder="Continue a conversa..."
            rows={1} disabled={isLoading}
            className="flex-1 resize-none bg-transparent px-2 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-50 max-h-36 leading-relaxed"
          />
          <button onClick={handleSend} disabled={!input.trim() || isLoading}
            className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 mr-1.5 transition-all flex-shrink-0',
              input.trim() && !isLoading ? 'bg-brand-500 text-white hover:bg-brand-600 active:scale-95' : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}>
            <Send size={14} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <ProviderSelector
            selectedProvider={selectedProvider}
            selectedModel={selectedModel}
            onSelect={(p, m) => { setSelectedProvider(p); setSelectedModel(m) }}
          />
          <p className="text-xs text-gray-300">Enter para enviar</p>
        </div>
      </div>
    </div>
  )
}
