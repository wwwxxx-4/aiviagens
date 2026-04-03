'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plane, Hotel, MapPin, Calendar, Users, Download,
  ArrowLeft, Star, Trash2, Edit3, CheckCircle
} from 'lucide-react'
import { formatDate, formatCurrency, tripDuration } from '@/lib/utils'
import { FlightCard } from '@/components/chat/FlightCard'
import { HotelCard } from '@/components/chat/ResultCards'
import { ActivityCard } from '@/components/chat/ResultCards'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import type { TravelPackage } from '@/types'

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [pkg, setPkg] = useState<TravelPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('travel_packages')
        .select('*')
        .eq('id', id)
        .single()
      setPkg(data)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch(`/api/export?id=${id}`)
      if (!res.ok) throw new Error('Erro ao gerar exportação')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `viagem-${pkg?.destination?.toLowerCase().replace(/\s+/g, '-') || 'pacote'}.html`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Arquivo baixado! Abra no navegador e use Ctrl+P para salvar como PDF.')
    } catch {
      toast.error('Erro ao exportar. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este pacote?')) return
    setDeleting(true)
    const { error } = await supabase.from('travel_packages').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir.'); setDeleting(false); return }
    toast.success('Pacote excluído.')
    router.push('/dashboard/packages')
  }

  async function handleStatusChange(status: 'draft' | 'saved' | 'booked') {
    const { error } = await supabase
      .from('travel_packages')
      .update({ status })
      .eq('id', id)
    if (!error) {
      setPkg(p => p ? { ...p, status } : p)
      toast.success(status === 'booked' ? 'Viagem marcada como reservada! 🎉' : 'Status atualizado.')
    }
  }

  if (loading) {
    return (
      <div className="p-8 max-w-4xl animate-pulse">
        <div className="h-8 w-64 bg-gray-100 rounded-lg mb-8" />
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-50 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 mb-4">Pacote não encontrado.</p>
        <Button variant="ghost" onClick={() => router.push('/dashboard/packages')}>
          <ArrowLeft size={14} /> Voltar
        </Button>
      </div>
    )
  }

  const flights = pkg.flight_data?.flights || (Array.isArray(pkg.flight_data) ? pkg.flight_data : [])
  const hotels = pkg.hotel_data?.hotels || (Array.isArray(pkg.hotel_data) ? pkg.hotel_data : [])
  const activities = Array.isArray(pkg.activities_data) ? pkg.activities_data : []
  const duration = pkg.check_in && pkg.check_out ? tripDuration(pkg.check_in, pkg.check_out) : null

  const statusConfig = {
    draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-600' },
    saved: { label: 'Salvo', color: 'bg-brand-50 text-brand-700' },
    booked: { label: 'Reservado ✓', color: 'bg-green-50 text-green-700' },
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push('/dashboard/packages')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={14} /> Minhas viagens
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusConfig[pkg.status]?.color}`}>
            {statusConfig[pkg.status]?.label}
          </span>
          {pkg.status !== 'booked' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusChange('booked')}
            >
              <CheckCircle size={13} /> Marcar como reservado
            </Button>
          )}
          <Button variant="secondary" size="sm" loading={exporting} onClick={handleExport}>
            <Download size={13} /> Exportar PDF
          </Button>
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* Hero card */}
      <div className="bg-brand-500 rounded-2xl p-6 text-white mb-6">
        <h1 className="font-display text-2xl font-bold mb-1">{pkg.title}</h1>
        <p className="text-brand-100 mb-5">{pkg.destination}{pkg.destination_country ? `, ${pkg.destination_country}` : ''}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {pkg.check_in && (
            <div className="bg-white/15 rounded-xl p-3">
              <div className="text-xs text-brand-200 mb-1 flex items-center gap-1"><Calendar size={10}/> Check-in</div>
              <div className="font-semibold text-sm">{formatDate(pkg.check_in, 'dd/MM/yyyy')}</div>
            </div>
          )}
          {pkg.check_out && (
            <div className="bg-white/15 rounded-xl p-3">
              <div className="text-xs text-brand-200 mb-1 flex items-center gap-1"><Calendar size={10}/> Check-out</div>
              <div className="font-semibold text-sm">{formatDate(pkg.check_out, 'dd/MM/yyyy')}</div>
            </div>
          )}
          <div className="bg-white/15 rounded-xl p-3">
            <div className="text-xs text-brand-200 mb-1 flex items-center gap-1"><Users size={10}/> Viajantes</div>
            <div className="font-semibold text-sm">
              {pkg.adults} adulto{pkg.adults !== 1 ? 's' : ''}
              {pkg.children > 0 && ` + ${pkg.children} criança${pkg.children !== 1 ? 's' : ''}`}
            </div>
          </div>
          {duration && (
            <div className="bg-white/15 rounded-xl p-3">
              <div className="text-xs text-brand-200 mb-1 flex items-center gap-1"><Plane size={10}/> Duração</div>
              <div className="font-semibold text-sm">{duration} dia{duration !== 1 ? 's' : ''}</div>
            </div>
          )}
        </div>
        {pkg.total_price && (
          <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
            <span className="text-brand-200 text-sm">Investimento total estimado</span>
            <span className="text-2xl font-bold font-display">
              {formatCurrency(pkg.total_price, pkg.currency || 'BRL')}
            </span>
          </div>
        )}
      </div>

      {/* Flights */}
      {flights.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Plane size={16} className="text-brand-500" /> Voos
          </h2>
          <div className="space-y-2">
            {flights.map((f: any, i: number) => (
              <FlightCard key={i} flight={f} />
            ))}
          </div>
        </section>
      )}

      {/* Hotels */}
      {hotels.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Hotel size={16} className="text-brand-500" /> Hospedagem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hotels.map((h: any, i: number) => (
              <HotelCard key={i} hotel={h} />
            ))}
          </div>
        </section>
      )}

      {/* Activities */}
      {activities.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-brand-500" /> Atividades e atrações
          </h2>
          <div className="space-y-2">
            {activities.map((a: any, i: number) => (
              <ActivityCard key={i} activity={a} />
            ))}
          </div>
        </section>
      )}

      {/* Notes */}
      {pkg.notes && (
        <section className="bg-sand-50 rounded-2xl p-5 border border-sand-100">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-2 text-sm">
            <Edit3 size={14} /> Observações
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">{pkg.notes}</p>
        </section>
      )}
    </div>
  )
}
