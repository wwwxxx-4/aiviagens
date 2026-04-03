'use client'

import { MessageCircle, Tag, Coffee, Star } from 'lucide-react'
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

export function AgencyPackageCard({ pkg }: { pkg: AgencyPackage }) {
  const displayPrice = applyMarkup(pkg.preco)

  return (
    <div className="bg-white rounded-xl border border-brand-100 overflow-hidden hover:border-brand-300 transition-all shadow-sm">
      {pkg.imagem && (
        <div className="relative">
          <img
            src={pkg.imagem}
            alt={pkg.destino}
            className="w-full h-28 object-cover"
            onError={e => (e.currentTarget.style.display = 'none')}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-2 left-3">
            <p className="text-white font-bold text-sm drop-shadow">{pkg.destino}</p>
          </div>
          {/* Badges */}
          <div className="absolute top-2 right-2 flex gap-1">
            {pkg.all_inclusive && (
              <span className="bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                <Tag size={8} /> All Inc.
              </span>
            )}
            {pkg.luxo && (
              <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                <Star size={8} /> Luxo
              </span>
            )}
          </div>
        </div>
      )}

      <div className="p-3">
        {!pkg.imagem && (
          <p className="font-bold text-sm text-gray-900 mb-1">{pkg.destino}</p>
        )}

        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          🏨 {pkg.hotel}
          {pkg.cafe_manha && <span className="text-brand-500 flex items-center gap-0.5"><Coffee size={9} /> Café</span>}
        </p>

        <div className="flex flex-wrap gap-1 mb-2">
          <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
            ✈️ {pkg.origem}
          </span>
          <span className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-full border border-gray-100">
            📅 {pkg.ida} → {pkg.volta}
          </span>
        </div>

        {pkg.voo_ida && (
          <p className="text-xs text-gray-400 mb-1">🛫 {pkg.voo_ida}</p>
        )}
        {pkg.voo_volta && (
          <p className="text-xs text-gray-400 mb-2">🛬 {pkg.voo_volta}</p>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-gray-50">
          <div>
            <span className="text-base font-bold text-brand-600">
              R$ {displayPrice.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-gray-400 ml-1">/ 2 pessoas</span>
          </div>
          <a
            href={pkg.wa_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-colors"
          >
            <MessageCircle size={11} /> Quero este!
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
      <div className="flex items-center gap-2 mb-2">
        <div className="h-px flex-1 bg-brand-100" />
        <p className="text-xs font-semibold text-brand-600 uppercase tracking-wide px-2">
          🏷️ {packages.length} pacotes exclusivos da agência
        </p>
        <div className="h-px flex-1 bg-brand-100" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {packages.slice(0, 4).map(p => (
          <AgencyPackageCard key={p.id} pkg={p} />
        ))}
      </div>
      {packages.length > 4 && (
        <p className="text-xs text-center text-gray-400 mt-2">
          +{packages.length - 4} outros pacotes disponíveis — pergunte ao assistente!
        </p>
      )}
    </div>
  )
}
