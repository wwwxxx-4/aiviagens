'use client'

import { useState } from 'react'
import { Star, MapPin, MessageCircle, ExternalLink, Bookmark, Check, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { applyMarkup, generateActivitiesUrl, generateWhatsAppUrl, getAgencySettings } from '@/lib/booking'
import { useSaveToPackage } from '@/hooks/useSaveToPackage'
import type { HotelResult, ActivityResult } from '@/types'

function calcNights(checkIn?: string, checkOut?: string): number | null {
  if (!checkIn || !checkOut) return null
  const d1 = new Date(checkIn)
  const d2 = new Date(checkOut)
  const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
}

// ─── Hotel Card ────────────────────────────────────────────────────────────────

export function HotelCard({ hotel, nights: nightsProp, adults = 1, children = 0 }: { hotel: HotelResult; nights?: number; adults?: number; children?: number }) {
  const cfg = getAgencySettings()
  const displayPricePerNight = applyMarkup(hotel.price_per_night, 'hotels')
  const nights = nightsProp ?? calcNights(hotel.check_in, hotel.check_out) ?? 1
  const totalPrice = displayPricePerNight * nights
  const paxStr = `${adults} adulto${adults !== 1 ? 's' : ''}${children > 0 ? ` + ${children} criança${children !== 1 ? 's' : ''}` : ''}`
  const datesStr = hotel.check_in && hotel.check_out ? `, ${hotel.check_in} a ${hotel.check_out}` : ''
  const waMsg = `Olá ${cfg.agencyName}! Tenho interesse no hotel:\n🏨 ${hotel.name}\n👥 ${paxStr}${datesStr}\n💰 ${formatCurrency(displayPricePerNight, hotel.currency)}/noite × ${nights} noites = ${formatCurrency(totalPrice, hotel.currency)}\n\nPoderia me ajudar com a reserva?`

  const [saved, setSaved] = useState(false)
  const { saving, saveHotel } = useSaveToPackage()
  const isSaving = saving === hotel.id

  async function handleSave() {
    const id = await saveHotel(hotel, adults, nights, children)
    if (id) setSaved(true)
  }

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

        {/* Passengers + nights */}
        {(adults > 0 || children > 0) && (
          <div className="flex items-center gap-1 text-xs text-brand-700 bg-brand-50 rounded-lg px-2.5 py-1.5 mb-2 border border-brand-100">
            <span>👥</span>
            <span className="font-medium">{adults} adulto{adults !== 1 ? 's' : ''}{children > 0 ? ` + ${children} criança${children !== 1 ? 's' : ''}` : ''}</span>
            {nights && nights > 1 && <span className="text-gray-400 ml-1">· {nights} noites</span>}
          </div>
        )}

        {/* Preço total + disclaimer */}
        <div className="bg-brand-50 rounded-lg px-2.5 py-2 mb-2.5">
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-base font-bold text-brand-600">{formatCurrency(totalPrice, hotel.currency)}</span>
            <span className="text-xs text-gray-500">total</span>
            {nights > 1 && (
              <span className="text-xs text-gray-400">
                ({formatCurrency(displayPricePerNight, hotel.currency)}/noite × {nights} noites)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-start gap-1 mb-2.5">
          <AlertCircle size={9} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-gray-400 italic">Podem haver taxas adicionais. Valores sujeitos a alteração.</p>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={handleSave}
            disabled={isSaving || saved}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              saved
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-50 hover:bg-brand-50 text-gray-500 hover:text-brand-600 border-gray-100 hover:border-brand-200'
            }`}
          >
            {saved ? <Check size={10} /> : <Bookmark size={10} />}
            {saved ? 'Salvo!' : isSaving ? '...' : 'Salvar'}
          </button>
          {/* Apenas WhatsApp da agência — sem links externos de reserva */}
          <a href={generateWhatsAppUrl(waMsg)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors">
            <MessageCircle size={10} /> Reservar via WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}

export function HotelResults({ hotels, checkIn, checkOut, adults, children }: { hotels: HotelResult[]; checkIn?: string; checkOut?: string; adults?: number; children?: number }) {
  const nights = calcNights(checkIn, checkOut) ?? undefined
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
        🏨 {hotels.length} hotéis encontrados{nights ? ` · ${nights} noites` : ''}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {hotels.slice(0, 4).map(h => <HotelCard key={h.id} hotel={h} nights={nights} adults={adults} children={children} />)}
      </div>
    </div>
  )
}

// ─── Activity Card ─────────────────────────────────────────────────────────────

export function ActivityCard({ activity }: { activity: ActivityResult }) {
  const cfg = getAgencySettings()
  const activitiesUrl = generateActivitiesUrl()
  const waMsg = `Olá ${cfg.agencyName}! Tenho interesse na atividade:\n🗺️ ${activity.name}${activity.address ? `\n📍 ${activity.address}` : ''}\n\nPoderia me ajudar?`

  const [saved, setSaved] = useState(false)
  const { saving, saveActivity } = useSaveToPackage()
  const isSaving = saving === activity.id

  async function handleSave() {
    const id = await saveActivity(activity)
    if (id) setSaved(true)
  }

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
        <div className="flex gap-1.5 mt-2 flex-wrap">
          <button
            onClick={handleSave}
            disabled={isSaving || saved}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs border transition-all ${
              saved
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-50 hover:bg-brand-50 text-gray-500 hover:text-brand-600 border-gray-100 hover:border-brand-200'
            }`}
          >
            {saved ? <Check size={9} /> : <Bookmark size={9} />}
            {saved ? 'Salvo!' : isSaving ? '...' : 'Salvar'}
          </button>
          <a href={generateWhatsAppUrl(waMsg)} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 hover:bg-green-100 text-green-700 text-xs border border-green-100 transition-colors">
            <MessageCircle size={9} /> WhatsApp
          </a>
          <a href={activitiesUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-md bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs border border-brand-100 transition-colors">
            <ExternalLink size={9} /> Ver passeio
          </a>
        </div>
      </div>
    </div>
  )
}

export function ActivityResults({ activities }: { activities: ActivityResult[] }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">🗺️ {activities.length} atividades e atrações</p>
      <div className="space-y-2">
        {activities.slice(0, 4).map(a => <ActivityCard key={a.id} activity={a} />)}
      </div>
    </div>
  )
}
