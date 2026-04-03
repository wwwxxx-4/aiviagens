import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency
export function formatCurrency(
  value: number,
  currency: string = 'BRL',
  locale: string = 'pt-BR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// Format date for display
export function formatDate(date: string | Date, formatStr: string = "dd 'de' MMMM, yyyy"): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr, { locale: ptBR })
}

// Format date for API (YYYY-MM-DD)
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

// Calculate trip duration
export function tripDuration(checkIn: string, checkOut: string): number {
  return differenceInDays(parseISO(checkOut), parseISO(checkIn))
}

// Format flight duration (minutes → "2h 30min")
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

// Format stops
export function formatStops(stops: number): string {
  if (stops === 0) return 'Direto'
  if (stops === 1) return '1 parada'
  return `${stops} paradas`
}

// Truncate text
export function truncate(text: string, length: number = 100): string {
  if (text.length <= length) return text
  return text.slice(0, length).trim() + '...'
}

// Generate cache key for SerpApi searches
export function generateCacheKey(type: string, params: Record<string, string | number | undefined>): string {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}:${params[k]}`)
    .join('|')
  return `${type}::${sorted}`
}

// Extract IATA codes from text (e.g. "GRU", "LIS")
export function extractIataCode(text: string): string | null {
  const match = text.match(/\b([A-Z]{3})\b/)
  return match ? match[1] : null
}

// Sleep utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Check if string is a valid date
export function isValidDate(dateStr: string): boolean {
  const d = new Date(dateStr)
  return !isNaN(d.getTime())
}
