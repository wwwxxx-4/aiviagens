'use client'

import { useRef, useState } from 'react'
import { Send, Plane, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { MessageBubble } from './MessageBubble'
import { SearchPanel } from './SearchPanel'
import { cn } from '@/lib/utils'

// Provider fixo — para trocar edite estas duas constantes
const DEFAULT_PROVIDER = 'openai' as const
const DEFAULT_MODEL = 'gpt-4o'

const SUGGESTIONS = [
  'Quero viajar para Lisboa em julho, 2 pessoas, 7 dias',
  'Voos de São Paulo para Miami em dezembro',
  'Hotéis em Paris para lua de mel',
  'O que fazer em Tokyo por 5 dias?',
  'Pacote completo para Cancún em agosto, família com 2 filhos',
  'Viagem romântica para Buenos Aires este mês',
]

interface ChatWindowProps { conversationId?: string }

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const { messages, isLoading, sendMessage, clearMessages } = useChat(conversationId)
  const [input, setInput] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isNew = messages.length === 0

  const prevLen = useRef(0)
  if (messages.length !== prevLen.current) {
    prevLen.current = messages.length
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

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
    <div className="flex flex-col h-screen bg-[#F5F8FF]">
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
        {messages.length > 0 && (
          <button onClick={clearMessages} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <RotateCcw size={11} /> Nova conversa
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
        {isNew && (
          <div className="max-w-lg mx-auto text-center pt-8 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center mx-auto mb-5">
              <Plane size={24} className="text-white" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Para onde vamos?</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Diga o destino, datas e pessoas — busco voos, hotéis e atividades em tempo real.
            </p>
            <div className="grid grid-cols-1 gap-2 text-left">
              {SUGGESTIONS.map((s, i) => (
                <button key={i}
                  onClick={() => sendMessage(s, DEFAULT_PROVIDER, DEFAULT_MODEL)}
                  className="text-left text-sm text-gray-600 bg-white hover:bg-brand-50 hover:text-brand-700 border border-black/5 hover:border-brand-200 px-4 py-2.5 rounded-xl transition-all"
                >{s}</button>
              ))}
            </div>
          </div>
        )}
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
          'flex items-end gap-2 bg-[#F5F8FF] rounded-2xl border transition-all',
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
            ref={inputRef}
            value={input}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px'
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Quero viajar para Cancún em agosto, 2 pessoas, 5 dias..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent px-2 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:opacity-50 max-h-36 leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className={cn(
              'w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 mr-1.5 transition-all flex-shrink-0',
              input.trim() && !isLoading
                ? 'bg-brand-500 text-white hover:bg-brand-600 active:scale-95'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}
          >
            <Send size={14} />
          </button>
        </div>
        <p className="text-xs text-gray-300 text-right mt-2">
          <span className="inline-flex items-center gap-1"><SlidersHorizontal size={9} /> Clique em "Buscar" para pesquisar voos e hotéis</span>
          {' · '}Enter para enviar
        </p>
      </div>
    </div>
  )
}
