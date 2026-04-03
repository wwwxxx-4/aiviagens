'use client'

import { Plane, Hotel, MapPin, Calendar, Users, Save, ExternalLink } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { TravelPackage } from '@/types'

interface PackageSummaryCardProps {
  pkg: Partial<TravelPackage>
  onSave?: () => void
  onView?: () => void
}

export function PackageSummaryCard({ pkg, onSave, onView }: PackageSummaryCardProps) {
  return (
    <div className="mt-3 bg-white border border-brand-100 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-brand-500 px-4 py-3 text-white">
        <p className="font-display font-semibold text-sm">{pkg.title || 'Pacote de viagem'}</p>
        <p className="text-brand-200 text-xs mt-0.5">
          {pkg.destination}{pkg.destination_country ? `, ${pkg.destination_country}` : ''}
        </p>
      </div>

      {/* Details */}
      <div className="p-4 space-y-2">
        {pkg.check_in && pkg.check_out && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar size={13} className="text-brand-400 shrink-0" />
            <span>{formatDate(pkg.check_in, 'dd/MM/yyyy')} → {formatDate(pkg.check_out, 'dd/MM/yyyy')}</span>
          </div>
        )}
        {(pkg.adults || 0) > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users size={13} className="text-brand-400 shrink-0" />
            <span>
              {pkg.adults} adulto{pkg.adults !== 1 ? 's' : ''}
              {(pkg.children || 0) > 0 && ` + ${pkg.children} criança${pkg.children !== 1 ? 's' : ''}`}
            </span>
          </div>
        )}
        {pkg.flight && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Plane size={13} className="text-brand-400 shrink-0" />
            <span>{pkg.flight.airline} · {pkg.flight.origin} → {pkg.flight.destination}</span>
          </div>
        )}
        {pkg.hotel && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Hotel size={13} className="text-brand-400 shrink-0" />
            <span>{pkg.hotel.name}</span>
          </div>
        )}
        {pkg.activities && pkg.activities.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={13} className="text-brand-400 shrink-0" />
            <span>{pkg.activities.length} atividade{pkg.activities.length !== 1 ? 's' : ''} incluída{pkg.activities.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Total */}
      {pkg.total_price && (
        <div className="px-4 py-3 bg-brand-50 border-t border-brand-100 flex items-center justify-between">
          <span className="text-xs text-brand-600">Estimativa total</span>
          <span className="font-semibold text-brand-700">
            {formatCurrency(pkg.total_price, pkg.currency || 'BRL')}
          </span>
        </div>
      )}

      {/* Actions */}
      {(onSave || onView) && (
        <div className="px-4 py-3 border-t border-black/5 flex gap-2">
          {onSave && (
            <button
              onClick={onSave}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 py-2 rounded-lg transition-colors"
            >
              <Save size={11} /> Salvar pacote
            </button>
          )}
          {onView && (
            <button
              onClick={onView}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg transition-colors"
            >
              <ExternalLink size={11} /> Ver detalhes
            </button>
          )}
        </div>
      )}
    </div>
  )
}
