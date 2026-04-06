'use client'

import { useState, useCallback } from 'react'
import { X, Plane, Hotel, ChevronDown, ChevronUp, Plus, Minus, Search, Users, Calendar, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────
type Tab = 'flights' | 'hotels' | 'both'
type FlightType = 'roundtrip' | 'oneway'
type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first'

interface Child { age: number }

interface FlightForm {
  origin: string
  destination: string
  departDate: string
  returnDate: string
  flightType: FlightType
  cabinClass: CabinClass
  adults: number
  children: Child[]
  infants: number
  maxPrice: string
  stops: string
}

interface HotelForm {
  destination: string
  checkIn: string
  checkOut: string
  adults: number
  children: Child[]
  stars: string
  freeCancellation: boolean
  maxPrice: string
}

interface SearchPanelProps {
  onClose: () => void
  onSearch: (message: string) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CABIN_LABELS: Record<CabinClass, string> = {
  economy: 'Econômica',
  premium_economy: 'Econômica Premium',
  business: 'Executiva',
  first: 'Primeira Classe',
}

const STOPS_LABELS: Record<string, string> = {
  '': 'Qualquer',
  '0': 'Direto',
  '1': 'Até 1 parada',
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
function addDays(date: string, n: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function Counter({ value, min = 0, max = 9, onChange }: { value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-brand-400 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <Minus size={12} />
      </button>
      <span className="w-5 text-center text-sm font-semibold text-gray-800">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:border-brand-400 hover:text-brand-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-700 text-gray-400 uppercase tracking-wider mb-1">{children}</label>
}

function FieldInput({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      {...props}
      className={cn(
        'w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl',
        'placeholder:text-gray-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
        'transition-all',
        className
      )}
    />
  )
}

// ─── Children Ages Editor ─────────────────────────────────────────────────────
function ChildrenAges({ children, onChange }: { children: Child[]; onChange: (c: Child[]) => void }) {
  if (children.length === 0) return null
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {children.map((child, i) => (
        <div key={i} className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl px-3 py-1.5">
          <span className="text-xs text-gray-500 whitespace-nowrap">Criança {i + 1}:</span>
          <select
            value={child.age}
            onChange={e => {
              const updated = [...children]
              updated[i] = { age: Number(e.target.value) }
              onChange(updated)
            }}
            className="flex-1 text-xs text-gray-800 bg-transparent focus:outline-none font-semibold"
          >
            {Array.from({ length: 18 }, (_, a) => (
              <option key={a} value={a}>{a === 0 ? 'Menos de 1 ano' : `${a} ano${a !== 1 ? 's' : ''}`}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}

// ─── Passengers Row ───────────────────────────────────────────────────────────
function PassengersSection({
  adults, children, infants, showInfants = false,
  onAdults, onChildren, onInfants,
}: {
  adults: number; children: Child[]; infants?: number; showInfants?: boolean
  onAdults: (v: number) => void
  onChildren: (c: Child[]) => void
  onInfants?: (v: number) => void
}) {
  function changeChildren(n: number) {
    if (n > children.length) {
      onChildren([...children, { age: 5 }])
    } else {
      onChildren(children.slice(0, n))
    }
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-700">Adultos</p>
          <p className="text-[10px] text-gray-400">12+ anos</p>
        </div>
        <Counter value={adults} min={1} max={9} onChange={onAdults} />
      </div>
      <div className="border-t border-gray-100 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Crianças</p>
            <p className="text-[10px] text-gray-400">2–11 anos</p>
          </div>
          <Counter value={children.length} min={0} max={6} onChange={changeChildren} />
        </div>
        <ChildrenAges children={children} onChange={onChildren} />
      </div>
      {showInfants && onInfants && (
        <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-700">Bebês</p>
            <p className="text-[10px] text-gray-400">Menos de 2 anos (colo)</p>
          </div>
          <Counter value={infants || 0} min={0} max={adults} onChange={onInfants} />
        </div>
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SearchPanel({ onClose, onSearch }: SearchPanelProps) {
  const [tab, setTab] = useState<Tab>('both')
  const [showPassengers, setShowPassengers] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const [flight, setFlight] = useState<FlightForm>({
    origin: '', destination: '', departDate: addDays(today(), 7), returnDate: addDays(today(), 14),
    flightType: 'roundtrip', cabinClass: 'economy',
    adults: 2, children: [], infants: 0, maxPrice: '', stops: '',
  })

  const [hotel, setHotel] = useState<HotelForm>({
    destination: '', checkIn: addDays(today(), 7), checkOut: addDays(today(), 14),
    adults: 2, children: [],
    stars: '', freeCancellation: false, maxPrice: '',
  })

  // sync adults/children between tabs
  function setFlightField<K extends keyof FlightForm>(k: K, v: FlightForm[K]) {
    setFlight(f => ({ ...f, [k]: v }))
    if (k === 'adults') setHotel(h => ({ ...h, adults: v as number }))
    if (k === 'children') setHotel(h => ({ ...h, children: v as Child[] }))
    if (k === 'destination') setHotel(h => ({ ...h, destination: v as string }))
    if (k === 'departDate') setHotel(h => ({ ...h, checkIn: v as string }))
    if (k === 'returnDate') setHotel(h => ({ ...h, checkOut: v as string }))
  }

  function setHotelField<K extends keyof HotelForm>(k: K, v: HotelForm[K]) {
    setHotel(h => ({ ...h, [k]: v }))
    if (k === 'adults') setFlight(f => ({ ...f, adults: v as number }))
    if (k === 'children') setFlight(f => ({ ...f, children: v as Child[] }))
  }

  const paxSummary = useCallback(() => {
    const a = tab === 'hotels' ? hotel.adults : flight.adults
    const ch = tab === 'hotels' ? hotel.children : flight.children
    const inf = tab === 'hotels' ? 0 : flight.infants
    let s = `${a} adulto${a !== 1 ? 's' : ''}`
    if (ch.length > 0) s += ` + ${ch.length} criança${ch.length !== 1 ? 's' : ''}`
    if (inf > 0) s += ` + ${inf} bebê${inf !== 1 ? 's' : ''}`
    return s
  }, [tab, flight, hotel])

  function buildMessage(): string {
    const parts: string[] = []

    if (tab === 'flights' || tab === 'both') {
      const f = flight
      const dest = f.destination || 'destino'
      const orig = f.origin || 'origem'
      const pax = `${f.adults} adulto${f.adults !== 1 ? 's' : ''}${f.children.length > 0
        ? ' + ' + f.children.map((c, i) => `criança ${i + 1} de ${c.age} ano${c.age !== 1 ? 's' : ''}`).join(', ')
        : ''}${f.infants > 0 ? ` + ${f.infants} bebê${f.infants !== 1 ? 's' : ''}` : ''}`
      const tipo = f.flightType === 'roundtrip' ? 'ida e volta' : 'só ida'
      const cls = CABIN_LABELS[f.cabinClass] !== 'Econômica' ? `, classe ${CABIN_LABELS[f.cabinClass]}` : ''
      const stops = f.stops === '0' ? ', voo direto' : f.stops === '1' ? ', até 1 parada' : ''
      const price = f.maxPrice ? `, preço máximo R$${f.maxPrice}` : ''
      parts.push(`Buscar voos de ${orig} para ${dest}, ${tipo}, saída ${f.departDate}${f.flightType === 'roundtrip' ? `, retorno ${f.returnDate}` : ''}, ${pax}${cls}${stops}${price}`)
    }

    if (tab === 'hotels' || tab === 'both') {
      const h = hotel
      const dest = h.destination || flight.destination || 'destino'
      const pax = `${h.adults} adulto${h.adults !== 1 ? 's' : ''}${h.children.length > 0
        ? ' + ' + h.children.map((c, i) => `criança ${i + 1} de ${c.age} ano${c.age !== 1 ? 's' : ''}`).join(', ')
        : ''}`
      const stars = h.stars ? `, ${h.stars} estrelas` : ''
      const cancel = h.freeCancellation ? ', com cancelamento gratuito' : ''
      const price = h.maxPrice ? `, preço máximo R$${h.maxPrice}/noite` : ''
      parts.push(`Buscar hotéis em ${dest}, check-in ${h.checkIn}, check-out ${h.checkOut}, ${pax}${stars}${cancel}${price}`)
    }

    return parts.join('. ') + '.'
  }

  function handleSearch() {
    const msg = buildMessage()
    onSearch(msg)
    onClose()
  }

  const canSearch = () => {
    if (tab === 'flights' || tab === 'both') {
      if (!flight.origin || !flight.destination || !flight.departDate) return false
    }
    if (tab === 'hotels') {
      if (!hotel.destination || !hotel.checkIn || !hotel.checkOut) return false
    }
    return true
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-brand-500/10 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <Search size={13} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-800">Busca Rápida</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all">
          <X size={14} />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-1 px-5 pt-3">
        {([
          { id: 'both', icon: '✈️🏨', label: 'Voos + Hotel' },
          { id: 'flights', icon: '✈️', label: 'Só Voos' },
          { id: 'hotels', icon: '🏨', label: 'Só Hotel' },
        ] as { id: Tab; icon: string; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all',
              tab === t.id
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="px-5 pb-5 pt-4 space-y-4">

        {/* ── FLIGHT FIELDS ── */}
        {(tab === 'flights' || tab === 'both') && (
          <div className="space-y-3">
            {tab === 'flights' && (
              <div className="flex gap-2 mb-1">
                {(['roundtrip', 'oneway'] as FlightType[]).map(ft => (
                  <button key={ft} type="button"
                    onClick={() => setFlightField('flightType', ft)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-semibold transition-all border',
                      flight.flightType === ft
                        ? 'bg-brand-50 text-brand-700 border-brand-200'
                        : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                    )}
                  >
                    {ft === 'roundtrip' ? '↔ Ida e volta' : '→ Só ida'}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>📍 Origem</FieldLabel>
                <div className="relative">
                  <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <FieldInput
                    placeholder="São Paulo, GRU"
                    value={flight.origin}
                    onChange={e => setFlightField('origin', e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <FieldLabel>📍 Destino</FieldLabel>
                <div className="relative">
                  <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                  <FieldInput
                    placeholder="Fortaleza, FOR"
                    value={flight.destination}
                    onChange={e => setFlightField('destination', e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>

            <div className={cn('grid gap-3', flight.flightType === 'roundtrip' ? 'grid-cols-2' : 'grid-cols-1')}>
              <div>
                <FieldLabel>📅 Data de ida</FieldLabel>
                <FieldInput type="date" value={flight.departDate} min={today()}
                  onChange={e => setFlightField('departDate', e.target.value)} />
              </div>
              {flight.flightType === 'roundtrip' && (
                <div>
                  <FieldLabel>📅 Data de volta</FieldLabel>
                  <FieldInput type="date" value={flight.returnDate} min={flight.departDate || today()}
                    onChange={e => setFlightField('returnDate', e.target.value)} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── HOTEL FIELDS (only in hotel-only mode) ── */}
        {tab === 'hotels' && (
          <div className="space-y-3">
            <div>
              <FieldLabel>📍 Destino / Cidade</FieldLabel>
              <div className="relative">
                <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <FieldInput placeholder="Fortaleza, Rio de Janeiro..."
                  value={hotel.destination}
                  onChange={e => setHotelField('destination', e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>📅 Check-in</FieldLabel>
                <FieldInput type="date" value={hotel.checkIn} min={today()}
                  onChange={e => setHotelField('checkIn', e.target.value)} />
              </div>
              <div>
                <FieldLabel>📅 Check-out</FieldLabel>
                <FieldInput type="date" value={hotel.checkOut} min={hotel.checkIn || today()}
                  onChange={e => setHotelField('checkOut', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── PASSENGERS TOGGLE ── */}
        <button
          type="button"
          onClick={() => setShowPassengers(p => !p)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-all border border-gray-100"
        >
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users size={14} className="text-brand-500" />
            <span className="font-semibold">{paxSummary()}</span>
          </div>
          {showPassengers ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
        </button>

        {showPassengers && (
          <PassengersSection
            adults={tab === 'hotels' ? hotel.adults : flight.adults}
            children={tab === 'hotels' ? hotel.children : flight.children}
            infants={flight.infants}
            showInfants={tab !== 'hotels'}
            onAdults={v => tab === 'hotels' ? setHotelField('adults', v) : setFlightField('adults', v)}
            onChildren={c => tab === 'hotels' ? setHotelField('children', c) : setFlightField('children', c)}
            onInfants={v => setFlightField('infants', v)}
          />
        )}

        {/* ── ADVANCED FILTERS ── */}
        <button
          type="button"
          onClick={() => setShowAdvanced(p => !p)}
          className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-600 transition-all px-1"
        >
          <span className="font-semibold">Filtros avançados</span>
          {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showAdvanced && (
          <div className="space-y-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
            {(tab === 'flights' || tab === 'both') && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">✈️ Filtros de Voo</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Classe</FieldLabel>
                    <select
                      value={flight.cabinClass}
                      onChange={e => setFlightField('cabinClass', e.target.value as CabinClass)}
                      className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400"
                    >
                      {Object.entries(CABIN_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Paradas</FieldLabel>
                    <select
                      value={flight.stops}
                      onChange={e => setFlightField('stops', e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400"
                    >
                      {Object.entries(STOPS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <FieldLabel>Preço máximo por pessoa (R$)</FieldLabel>
                  <FieldInput type="number" placeholder="Ex: 1500" value={flight.maxPrice}
                    onChange={e => setFlightField('maxPrice', e.target.value)} />
                </div>
              </div>
            )}

            {(tab === 'hotels' || tab === 'both') && (
              <div className="space-y-3">
                {tab === 'both' && <div className="border-t border-gray-200 pt-3" />}
                <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">🏨 Filtros de Hotel</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Categoria mínima</FieldLabel>
                    <select
                      value={hotel.stars}
                      onChange={e => setHotelField('stars', e.target.value)}
                      className="w-full px-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-400"
                    >
                      <option value="">Qualquer</option>
                      <option value="3">3+ estrelas ★★★</option>
                      <option value="4">4+ estrelas ★★★★</option>
                      <option value="5">5 estrelas ★★★★★</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Preço máximo/noite (R$)</FieldLabel>
                    <FieldInput type="number" placeholder="Ex: 500" value={hotel.maxPrice}
                      onChange={e => setHotelField('maxPrice', e.target.value)} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div
                    onClick={() => setHotelField('freeCancellation', !hotel.freeCancellation)}
                    className={cn(
                      'w-9 h-5 rounded-full transition-all relative',
                      hotel.freeCancellation ? 'bg-brand-500' : 'bg-gray-300'
                    )}
                  >
                    <div className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
                      hotel.freeCancellation ? 'left-4' : 'left-0.5'
                    )} />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">Cancelamento gratuito</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* ── SEARCH BUTTON ── */}
        <button
          type="button"
          onClick={handleSearch}
          disabled={!canSearch()}
          className={cn(
            'w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all',
            canSearch()
              ? 'bg-gradient-to-r from-[#001A3D] to-[#0066FF] text-white hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-brand-500/30'
              : 'bg-gray-100 text-gray-300 cursor-not-allowed'
          )}
        >
          <Search size={15} />
          {tab === 'flights' ? 'Buscar Voos' : tab === 'hotels' ? 'Buscar Hotéis' : 'Buscar Voos + Hotéis'}
        </button>

        {!canSearch() && (
          <p className="text-center text-[10px] text-gray-300">
            {tab === 'hotels' ? 'Preencha destino e datas' : 'Preencha origem, destino e data de ida'}
          </p>
        )}
      </div>
    </div>
  )
}
