export interface AgencySettings {
  agencyName: string; whatsapp: string; phone: string; email: string
  logoUrl: string; bookingFlightsUrl: string; bookingHotelsUrl: string
  bookingActivitiesUrl: string; markupFlights: number; markupHotels: number; markupActivities: number
}

const DEFAULTS: AgencySettings = {
  agencyName:           process.env.NEXT_PUBLIC_AGENCY_NAME           || 'Mesquita Turismo',
  whatsapp:             process.env.NEXT_PUBLIC_WHATSAPP               || '5511953967095',
  phone:                process.env.NEXT_PUBLIC_AGENCY_PHONE           || '(11) 95396-7095',
  email:                process.env.NEXT_PUBLIC_AGENCY_EMAIL           || 'contato@mesquitaturismo.com.br',
  logoUrl:              process.env.NEXT_PUBLIC_AGENCY_LOGO            || '',
  bookingFlightsUrl:    process.env.NEXT_PUBLIC_BOOKING_FLIGHTS_URL    || 'https://www.comprarviagem.com.br/mesquitaturismo',
  bookingHotelsUrl:     process.env.NEXT_PUBLIC_BOOKING_HOTELS_URL     || 'https://www.comprarviagem.com.br/mesquitaturismo/hotel-list',
  bookingActivitiesUrl: process.env.NEXT_PUBLIC_BOOKING_ACTIVITIES_URL || 'https://www.civitatis.com/br/?ag_aid=63335',
  markupFlights:        Number(process.env.NEXT_PUBLIC_MARKUP_FLIGHTS    || '0'),
  markupHotels:         Number(process.env.NEXT_PUBLIC_MARKUP_HOTELS     || '0'),
  markupActivities:     Number(process.env.NEXT_PUBLIC_MARKUP_ACTIVITIES || '0'),
}

export function getAgencySettings(): AgencySettings {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('iv_agency_settings')
      if (saved) return { ...DEFAULTS, ...JSON.parse(saved) }
    } catch { /* ignore */ }
  }
  return DEFAULTS
}

export const DEFAULT_BOOKING_CONFIG = DEFAULTS

function toISO00Z(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toISOString()
}

function qs(p: Record<string, string | number | boolean | null | undefined>) {
  return Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&')
}

export function generateFlightBookingUrl(params: {
  origin: string; destination: string; outbound_date: string
  return_date?: string | null; adults?: number; children?: number
}): string {
  const cfg = getAgencySettings()
  const isRoundTrip = !!params.return_date
  const query = qs({
    departureDate: params.outbound_date ? toISO00Z(params.outbound_date) : '',
    ...(isRoundTrip && params.return_date ? { returnDate: toISO00Z(params.return_date) } : {}),
    isRoundTrip: String(isRoundTrip),
    adultsCount: params.adults || 1,
    childCount: params.children || 0,
    infantCount: 0,
    departureIata: (params.origin || '').toUpperCase(),
    arrivalIata: (params.destination || '').toUpperCase(),
  })
  return `${cfg.bookingFlightsUrl}/flight-list?${query}`
}

export function generateHotelBookingUrl(): string { return getAgencySettings().bookingHotelsUrl }
export function generateActivitiesUrl(): string { return getAgencySettings().bookingActivitiesUrl }

export function generateWhatsAppUrl(message: string): string {
  const cfg = getAgencySettings()
  return `https://wa.me/${cfg.whatsapp}?text=${encodeURIComponent(message)}`
}

export function applyMarkup(price: number, type: 'flights' | 'hotels' | 'activities' = 'flights'): number {
  const cfg = getAgencySettings()
  const pct = type === 'flights' ? cfg.markupFlights : type === 'hotels' ? cfg.markupHotels : cfg.markupActivities
  if (!pct || pct <= 0) return price
  return Math.ceil(price * (1 + pct / 100))
}

export function flightWhatsAppMessage(p: {
  origin: string; destination: string; outbound_date: string
  return_date?: string; adults: number; airline?: string; price?: number; currency?: string
}): string {
  const cfg = getAgencySettings()
  return [`Olá ${cfg.agencyName}! Tenho interesse em uma passagem:`,
    `✈️ ${p.origin} → ${p.destination}`,
    `📅 Ida: ${p.outbound_date}${p.return_date ? `  |  Volta: ${p.return_date}` : ''}`,
    `👥 ${p.adults} adulto${p.adults !== 1 ? 's' : ''}`,
    p.airline ? `🏷️ Companhia: ${p.airline}` : '',
    `\nPoderia me ajudar com a reserva?`,
  ].filter(Boolean).join('\n')
}
