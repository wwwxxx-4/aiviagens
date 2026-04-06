'use client'

import { MessageCircle, Tag, Coffee, Star, Plane } from 'lucide-react'
import type { AgencyPackage } from '@/lib/agency-packages'

function applyMarkup(price: number): number {
  if (typeof window === 'undefined') return price
  try {
    const s = localStorage.getItem('iv_agency_settings')
    if (s) {
      const cfg = JSON.parse(s)
      const pct = cfg.markupFlights || 0
      if (pct > 0) return Math.ceil(price * (1 + pct / 100))
    }
  } catch { /* ignore */ }
  return price
}

// Background color per type (matching index3.html)
const TYPE_BG: Record<string, string> = {
  praia: '#0077B6',
  montanha: '#2D6A4F',
  natureza: '#386641',
  cidade: '#1A4F8A',
}
const TYPE_EMOJI: Record<string, string> = {
  praia: '🏖️',
  montanha: '🏔️',
  natureza: '🌿',
  cidade: '🌆',
}

export function AgencyPackageCard({ pkg }: { pkg: AgencyPackage }) {
  const displayPrice = applyMarkup(pkg.preco)
  const bg = TYPE_BG[pkg.tipo] || '#001A3D'
  const em = TYPE_EMOJI[pkg.tipo] || '✈️'

  return (
    <div className="rounded-xl overflow-hidden border border-brand-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-white">
      {/* Image / color header */}
      <div className="relative h-28 overflow-hidden">
        {pkg.imagem ? (
          <img
            src={pkg.imagem}
            alt={pkg.destino}
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: bg }}>
            {em}
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,26,61,.85) 0%, rgba(0,26,61,.2) 55%, transparent 100%)' }} />

        {/* Destination label at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2">
          <p className="text-white font-bold text-sm leading-tight drop-shadow-sm truncate">{pkg.destino}</p>
          {pkg.regiao && (
            <p className="text-white/70 text-xs mt-0.5 truncate">{pkg.regiao}</p>
          )}
        </div>

        {/* Badges top-right */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {pkg.all_inclusive && (
            <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5 whitespace-nowrap">
              <Tag size={8} /> All Inc.
            </span>
          )}
          {pkg.luxo && (
            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold flex items-center gap-0.5">
              <Star size={8} /> Luxo
            </span>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        {/* Hotel */}
        <p className="text-xs text-gray-600 leading-tight mb-1.5 flex items-center gap-1 truncate">
          🏨 <span className="truncate">{pkg.hotel}</span>
          {pkg.cafe_manha && <span className="text-brand-500 shrink-0 flex items-center gap-0.5"><Coffee size={9} /></span>}
        </p>

        {/* Chips: origem + datas */}
        <div className="flex flex-wrap gap-1 mb-1.5">
          <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-100 flex items-center gap-0.5 whitespace-nowrap">
            <Plane size={8} /> {pkg.origem}
          </span>
          <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100 whitespace-nowrap">
            📅 {pkg.ida} → {pkg.volta}
          </span>
        </div>

        {/* Voo info */}
        {pkg.voo_ida && (
          <p className="text-xs text-gray-400 truncate leading-tight">🛫 {pkg.voo_ida}</p>
        )}
        {pkg.voo_volta && (
          <p className="text-xs text-gray-400 truncate leading-tight mb-1">🛬 {pkg.voo_volta}</p>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-50">
          <div>
            <span className="text-base font-bold text-brand-600">
              R$ {displayPrice.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-gray-400 ml-1">/ 2 pax</span>
          </div>
          <a
            href={pkg.wa_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition-colors"
          >
            <MessageCircle size={11} /> Quero!
          </a>
        </div>
      </div>
    </div>
  )
}

export function AgencyPackageResults({ packages }: { packages: AgencyPackage[] }) {
  if (!packages?.length) return null

  return (
    <div className="mt-3">
      {/* Header bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-brand-100" />
        <p className="text-xs font-bold text-brand-600 uppercase tracking-wider px-2 flex items-center gap-1.5">
          🏷️ {packages.length} pacote{packages.length !== 1 ? 's' : ''} exclusivo{packages.length !== 1 ? 's' : ''} Mesquita Turismo
        </p>
        <div className="h-px flex-1 bg-brand-100" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-2">
        {packages.slice(0, 4).map(p => (
          <AgencyPackageCard key={p.id} pkg={p} />
        ))}
      </div>

      {packages.length > 4 && (
        <p className="text-xs text-center text-gray-400 mt-2 bg-brand-50 rounded-lg py-1.5 border border-brand-100">
          +{packages.length - 4} pacotes disponíveis — pergunte ao assistente!
        </p>
      )}
    </div>
  )
}
