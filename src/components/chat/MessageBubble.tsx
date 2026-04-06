'use client'

import { Loader2, AlertCircle } from 'lucide-react'
import { FlightResults } from './FlightCard'
import { HotelResults, ActivityResults } from './ResultCards'
import { AgencyPackageResults } from './AgencyPackageCard'
import type { ChatMessage } from '@/hooks/useChat'
import type { AgencyPackage } from '@/lib/agency-packages'

const TOOL_LABELS: Record<string, string> = {
  extract_travel_intent: 'Interpretando sua viagem...',
  search_agency_packages: '🏷️ Buscando pacotes exclusivos da agência...',
  search_flights: '✈️ Buscando voos em tempo real...',
  search_hotels: '🏨 Buscando hotéis disponíveis...',
  search_activities: '🗺️ Buscando atividades e atrações...',
  get_weather: '☀️ Consultando previsão do tempo...',
  save_travel_package: '💾 Salvando seu pacote...',
  collect_passenger_data: '📋 Registrando dados do passageiro...',
}

function ToolIndicator({ tools }: { tools: string[] }) {
  if (!tools.length) return null
  return (
    <div className="flex flex-col gap-1.5 mb-3">
      {tools.map(tool => (
        <div key={tool} className="flex items-center gap-2 text-xs text-brand-600 bg-brand-50 px-3 py-1.5 rounded-lg w-fit">
          <Loader2 size={11} className="animate-spin" />
          {TOOL_LABELS[tool] || tool}
        </div>
      ))}
    </div>
  )
}

function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^## (.*$)/gm, '<h2 class="font-display text-base font-semibold text-gray-900 mt-3 mb-1">$1</h2>')
    .replace(/^### (.*$)/gm, '<h3 class="font-semibold text-sm text-gray-800 mt-2 mb-0.5">$1</h3>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 list-disc text-sm">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 list-decimal text-sm">$1</li>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-brand-600 underline hover:text-brand-800">$1</a>')
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br />')
}

type ExtendedMessage = ChatMessage & { agency_packages?: AgencyPackage[] }

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const msg = message as ExtendedMessage

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[80%] bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  const hasCards = (
    (msg.agency_packages && msg.agency_packages.length > 0) ||
    (message.flights && message.flights.length > 0) ||
    (message.hotels && message.hotels.length > 0) ||
    (message.activities && message.activities.length > 0)
  )

  return (
    <div className="flex gap-3 animate-slide-up">
      {/* AI avatar */}
      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs font-semibold text-brand-700">IA</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Tool running indicators */}
        {message.tools_running && message.tools_running.length > 0 && (
          <ToolIndicator tools={message.tools_running} />
        )}

        {/* ─── CARDS PRIMEIRO ─────────────────────────────── */}
        {hasCards && (
          <div className="mb-3">
            {/* Agency packages */}
            {msg.agency_packages && msg.agency_packages.length > 0 && (
              <AgencyPackageResults packages={msg.agency_packages} />
            )}

            {/* Flight results */}
            {message.flights && message.flights.length > 0 && (
              <FlightResults flights={message.flights} adults={message.flight_adults} children={message.flight_children} />
            )}

            {/* Hotel results */}
            {message.hotels && message.hotels.length > 0 && (
              <HotelResults
                hotels={message.hotels}
                checkIn={message.hotel_check_in}
                checkOut={message.hotel_check_out}
                adults={message.hotel_adults}
                children={message.hotel_children}
              />
            )}

            {/* Activity results */}
            {message.activities && message.activities.length > 0 && (
              <ActivityResults activities={message.activities} />
            )}
          </div>
        )}

        {/* ─── TEXTO DEPOIS DOS CARDS ──────────────────────── */}
        {message.content && (
          <div
            className="prose-chat text-sm text-gray-800 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}

        {/* Streaming cursor */}
        {message.status === 'streaming' && !message.content && !hasCards && (
          <div className="flex gap-1 mt-1 items-center">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 typing-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 typing-dot" />
            <div className="w-1.5 h-1.5 rounded-full bg-brand-400 typing-dot" />
          </div>
        )}

        {/* Error state */}
        {message.status === 'error' && (
          <div className="flex items-center gap-2 text-xs text-red-500 mt-1">
            <AlertCircle size={12} />
            {message.content || 'Ocorreu um erro. Tente novamente.'}
          </div>
        )}
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-brand-700">IA</span>
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 typing-dot" />
        </div>
      </div>
    </div>
  )
}
