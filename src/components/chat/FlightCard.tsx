'use client'

import { useState } from 'react'
import { Plane, MessageCircle, ExternalLink, Bookmark, Check } from 'lucide-react'
import { formatCurrency, formatStops } from '@/lib/utils'
import { applyMarkup, generateFlightBookingUrl, generateWhatsAppUrl, flightWhatsAppMessage, DEFAULT_BOOKING_CONFIG } from '@/lib/booking'
import { useSaveToPackage } from '@/hooks/useSaveToPackage'
import type { FlightResult } from '@/types'

type FlightWithReturn = FlightResult & {
  return_flight?: {
    airline: string
    airline_logo?: string
    flight_number?: string
    origin: string
    destination: string
    departure_time: string
    arrival_time: string
    duration: string
    stops: number
    price?: number
  }
}

function getTime(datetime?: string) {
  if (!datetime) return '--:--'
  const parts = datetime.split(' ')
  return parts[parts.length - 1].slice(0, 5)
}

export function FlightCard({ flight }: { flight: FlightResult }) {
  const f = flight as FlightWithReturn
  const hasReturn = !!f.return_flight
  const displayPrice = applyMarkup(flight.price)
  const [saved, setSaved] = useState(false)
  const { saving, saveFlight } = useSaveToPackage()
  const isSaving = saving === flight.id

  const bookingUrl = generateFlightBookingUrl({
    origin: flight.origin,
    destination: flight.destination,
    outbound_date: (flight.departure_time || '').split(' ')[0] || '',
    return_date: hasReturn ? (f.return_flight!.departure_time || '').split(' ')[0] || undefined : undefined,
    adults: 1,
  })

  const waMessage = flightWhatsAppMessage({
    origin: flight.origin,
    destination: flight.destination,
    outbound_date: (flight.departure_time || '').split(' ')[0] || '',
    return_date: hasReturn ? (f.return_flight!.departure_time || '').split(' ')[0] : undefined,
    adults: 1,
    airline: flight.airline,
    price: displayPrice,
    currency: flight.currency,
  })
  const waUrl = generateWhatsAppUrl(waMessage)

  async function handleSave() {
    const id = await saveFlight(flight)
    if (id) setSaved(true)
  }

  return (
    <div className="bg-white rounded-xl border border-black/5 overflow-hidden hover:border-brand-200 transition-all">
      <div className="p-3">
        {/* Outbound leg */}
        <FlightLeg
          label={hasReturn ? 'IDA' : undefined}
          airline={flight.airline}
          logo={flight.airline_logo}
          origin={flight.origin}
          destination={flight.destination}
          depTime={getTime(flight.departure_time)}
          arrTime={getTime(flight.arrival_time)}
          duration={flight.duration}
          stops={flight.stops}
        />

        {/* Return leg */}
        {hasReturn && f.return_flight && (
          <>
            <div className="border-t border-dashed border-gray-100 my-2" />
            <FlightLeg
              label="VOLTA"
              airline={f.return_flight.airline}
              logo={f.return_flight.airline_logo}
              origin={f.return_flight.origin}
              destination={f.return_flight.destination}
              depTime={getTime(f.return_flight.departure_time)}
              arrTime={getTime(f.return_flight.arrival_time)}
              duration={f.return_flight.duration}
              stops={f.return_flight.stops}
            />
          </>
        )}
      </div>

      {/* Price + CTAs */}
      <div className="px-3 pb-3 pt-1 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-lg font-bold text-brand-600">
            {formatCurrency(displayPrice, flight.currency)}
          </span>
          <span className="text-xs text-gray-400 ml-1">
            {hasReturn ? 'ida e volta' : 'só ida'} / pessoa
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {/* Salvar */}
          <button
            onClick={handleSave}
            disabled={isSaving || saved}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              saved
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-gray-50 hover:bg-brand-50 text-gray-500 hover:text-brand-600 border-gray-100 hover:border-brand-200'
            }`}
          >
            {saved ? <Check size={11} /> : <Bookmark size={11} />}
            {saved ? 'Salvo!' : isSaving ? '...' : 'Salvar'}
          </button>
          {/* WhatsApp */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
          >
            <MessageCircle size={11} />
            WhatsApp
          </a>
          {/* Comprar */}
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium transition-colors"
          >
            <ExternalLink size={11} />
            Comprar
          </a>
        </div>
      </div>
    </div>
  )
}

function FlightLeg({ label, airline, logo, origin, destination, depTime, arrTime, duration, stops }: {
  label?: string
  airline: string
  logo?: string
  origin: string
  destination: string
  depTime: string
  arrTime: string
  duration: string
  stops: number
}) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs font-semibold text-gray-400 w-9 shrink-0">{label}</span>
      )}
      <div className="flex items-center gap-1 w-20 shrink-0">
        {logo ? (
          <img src={logo} alt={airline} className="w-4 h-4 object-contain" onError={e => (e.currentTarget.style.display = 'none')} />
        ) : (
          <div className="w-4 h-4 rounded bg-brand-50 flex items-center justify-center">
            <Plane size={8} className="text-brand-400" />
          </div>
        )}
        <span className="text-xs text-gray-500 truncate">{airline}</span>
      </div>
      <div className="flex-1 flex items-center gap-1.5">
        <div className="text-center">
          <p className="font-bold text-sm text-gray-900">{origin}</p>
          <p className="text-xs text-gray-400">{depTime}</p>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full flex items-center gap-0.5">
            <div className="flex-1 h-px bg-gray-200" />
            <Plane size={8} className="text-gray-300" />
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <span className="text-xs text-gray-400">{duration}</span>
          <span className={`text-xs font-medium ${stops === 0 ? 'text-brand-500' : 'text-orange-500'}`}>
            {formatStops(stops)}
          </span>
        </div>
        <div className="text-center">
          <p className="font-bold text-sm text-gray-900">{destination}</p>
          <p className="text-xs text-gray-400">{arrTime}</p>
        </div>
      </div>
    </div>
  )
}

export function FlightResults({ flights }: { flights: FlightResult[] }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
        ✈️ {flights.length} voos encontrados · {DEFAULT_BOOKING_CONFIG.agencyName}
      </p>
      <div className="space-y-2">
        {flights.slice(0, 4).map(f => (
          <FlightCard key={f.id} flight={f} />
        ))}
      </div>
    </div>
  )
}
