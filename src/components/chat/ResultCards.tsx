'use client'

import { Hotel, Star, MapPin, MessageCircle, ExternalLink, Bookmark } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { applyMarkup, generateHotelBookingUrl, generateActivitiesUrl, generateWhatsAppUrl, getAgencySettings } from '@/lib/booking'
import type { HotelResult, ActivityResult } from '@/types'

// ─── Save to package helper ───────────────────────────────────────────────────

async function saveItem(type: 'hotel' | 'activity', name: string) {
  // Store in sessionStorage to be picked up by ChatWindow's "save package" flow
  const existing = JSON.parse(sessionStorage.getItem('iv_selected_items') || '{}')
  if (type === 'hotel') existing.hotel = name
  else { existing.activities = [...(existing.activities || []), name] }
  sessionStorage.setItem('iv_selected_items', JSON.stringify(existing))

  // Visual feedback
  return true
}

// ─── Hotel Card ───────────────────────────────────────────────────────────────

export function HotelCard({ hotel, onSave }: { hotel: HotelResult; onSave?: () => void }) {
  const cfg = getAgencySettings()
  const displayPrice = applyMarkup(hotel.price_per_night, 'hotels')
  const bookingUrl = generateHotelBookingUrl()
  const waMsg = `Olá ${cfg.agencyName}! Tenho interesse no hotel:\n🏨 ${hotel.name}\n💰 A partir de ${formatCurrency(displayPrice, hotel.currency)}/noite\n\nPoderia me ajudar com a reserva?`

  return (
    <div className="bg-white rounded-xl border border-black/5 overflow-hidden hover:border-brand-200 transition-all">
      {hotel.thumbnail && (
        <img src={hotel.thumbnail} alt={hotel.name} className="w-full h-28 object-cover"
          onError={e => (e.currentTarget.style.display = 'none')} />
      )}
      <div className="p-3">
        <p className="font-semibold text-sm text-gray-900 leading-tight mb-1">{hotel.name}</p>
        {hotel.stars && (
          <div className="flex gap-0.5 mb-1">
            {Array.from({ length: hotel.stars }).map((_, i) => <Star key={i} size={9} className="text-amber-400 fill-amber-400" />)}
          </div>
        )}
        {hotel.address && <p className="text-xs text-gray-400 flex items-center gap-1 mb-1.5"><MapPin size={9} />{hotel.address}</p>}
        {hotel.rating && (
          <p className="text-xs text-gray-500 mb-2">
            ⭐ {hotel.rating.toFixed(1)}
            {hotel.reviews_count && <span className="text-gray-400"> ({hotel.reviews_count.toLocaleString()})</span>}
          </p>
        )}
        {hotel.amenities && hotel.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2.5">
            {hotel.amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded border border-gray-100">{a}</span>
            ))}
          </div>
        )}

        {/* Price note */}
        <p className="text-xs text-gray-400 mb-2 italic">Consulte disponibilidade e preencha os dados no site da reserva.</p>

        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="text-base font-bold text-brand-600">{formatCurrency(displayPrice, hotel.currency)}</span>
            <span className="text-xs text-gray-400 ml-1">/noite</span>
          </div>
          <div className="flex gap-1">
            {onSave && (
              <button onClick={onSave}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-gray-50 hover:bg-brand-50 text-gray-500 hover:text-brand-600 text-xs font-medium border border-gray-100 hover:border-brand-200 transition-all">
                <Bookmark size={10} /> Salvar
              </button>
            )}
            <a href={generateWhatsAppUrl(waMsg)} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors">
              <MessageCircle size={10} /> WhatsApp
            </a>
            <a href={bookingUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition-colors">
              <ExternalLink size={10} /> Reservar
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HotelResults({ hotels, onSave }: { hotels: HotelResult[]; onSave?: (hotel: HotelResult) => void }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">🏨 {hotels.length} hotéis encontrados</p>
      <div className="grid grid-cols-2 gap-2">
        {hotels.slice(0, 4).map(h => <HotelCard key={h.id} hotel={h} onSave={onSave ? () => onSave(h) : undefined} />)}
      </div>
    </div>
  )
}

// ─── Activity Card ────────────────────────────────────────────────────────────

export function ActivityCard({ activity, onSave }: { activity: ActivityResult; onSave?: () => void }) {
  const cfg = getAgencySettings()
  const activitiesUrl = generateActivitiesUrl()
  const waMsg = `Olá ${cfg.agencyName}! Tenho interesse na atividade:\n🗺️ ${activity.name}${activity.address ? `\n📍 ${activity.address}` : ''}\n\nPoderia me ajudar?`

  return (
    <div className="bg-white rounded-xl border border-black/5 p-3 hover:border-brand-200 transition-all flex gap-3">
      {activity.thumbnail ? (
        <img src={activity.thumbnail} alt={activity.name}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          onError={e => (e.currentTarget.style.display = 'none')} />
      ) : (
        <div className="w-14 h-14 rounded-lg bg-sand-50 flex items-center justify-center flex-shrink-0">
          <MapPin size={18} className="text-sand-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 leading-tight">{activity.name}</p>
        {activity.address && <p className="text-xs text-gray-400 mt-0.5 truncate">{activity.address}</p>}
        {activity.rating && (
          <p className="text-xs text-gray-500 mt-0.5">
            ⭐ {activity.rating.toFixed(1)}
            {activity.reviews_count && <span className="text-gray-400"> ({activity.reviews_count.toLocaleString()})</span>}
          </p>
        )}
        <div className="flex gap-1 mt-2 flex-wrap">
          {onSave && (
            <button onClick={onSave}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 hover:bg-brand-50 text-gray-500 hover:text-brand-600 text-xs border border-gray-100 hover:border-brand-200 transition-all">
              <Bookmark size={9} /> Salvar
            </button>
          )}
          <a href={generateWhatsAppUrl(waMsg)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 hover:bg-green-100 text-green-700 text-xs border border-green-100 transition-colors">
            <MessageCircle size={9} /> WhatsApp
          </a>
          <a href={activitiesUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs border border-brand-100 transition-colors">
            <ExternalLink size={9} /> Ver no Civitatis
          </a>
        </div>
      </div>
    </div>
  )
}

export function ActivityResults({ activities, onSave }: { activities: ActivityResult[]; onSave?: (a: ActivityResult) => void }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">🗺️ {activities.length} atividades e atrações</p>
      <div className="space-y-2">
        {activities.slice(0, 4).map(a => <ActivityCard key={a.id} activity={a} onSave={onSave ? () => onSave(a) : undefined} />)}
      </div>
    </div>
  )
}
