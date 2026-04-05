'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Plane, Hotel, MapPin, Calendar, Users, Download,
  ArrowLeft, Trash2, CheckCircle, Edit3, Save, X, Copy
} from 'lucide-react'
import { formatDate, formatCurrency, tripDuration } from '@/lib/utils'
import { FlightCard } from '@/components/chat/FlightCard'
import { HotelCard } from '@/components/chat/ResultCards'
import { ActivityCard } from '@/components/chat/ResultCards'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import type { TravelPackage } from '@/types'

interface EditFields {
  title: string
  destination: string
  check_in: string
  check_out: string
  adults: number
  children: number
  total_price: number
  currency: string
  notes: string
}

export default function PackageDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [pkg, setPkg] = useState<TravelPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState<EditFields>({
    title: '', destination: '', check_in: '', check_out: '',
    adults: 1, children: 0, total_price: 0, currency: 'BRL', notes: '',
  })
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('travel_packages')
        .select('*')
        .eq('id', id)
        .single()
      setPkg(data)
      if (data) {
        setFields({
          title: data.title || '',
          destination: data.destination || '',
          check_in: data.check_in || '',
          check_out: data.check_out || '',
          adults: data.adults || 1,
          children: data.children || 0,
          total_price: data.total_price || 0,
          currency: data.currency || 'BRL',
          notes: data.notes || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSaveEdit() {
    setSaving(true)
    const { error } = await supabase
      .from('travel_packages')
      .update({
        title: fields.title,
        destination: fields.destination,
        check_in: fields.check_in,
        check_out: fields.check_out,
        adults: fields.adults,
        children: fields.children,
        total_price: fields.total_price,
        currency: fields.currency,
        notes: fields.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar.'); return }
    setPkg(p => p ? { ...p, ...fields } : p)
    setEditing(false)
    toast.success('Orçamento atualizado! ✅')
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch(`/api/export?id=${id}`)
      if (!res.ok) throw new Error('Erro ao gerar exportação')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orcamento-${pkg?.destination?.toLowerCase().replace(/\s+/g, '-') || 'viagem'}.html`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Arquivo baixado! Abra no navegador e use Ctrl+P para imprimir como PDF.')
    } catch {
      toast.error('Erro ao exportar. Tente novamente.')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return
    setDeleting(true)
    const { error } = await supabase.from('travel_packages').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir.'); setDeleting(false); return }
    toast.success('Orçamento excluído.')
    router.push('/dashboard/packages')
  }

  async function handleDuplicate() {
    if (!pkg) return
    setDuplicating(true)
    try {
      // Detectar versão atual do título e incrementar
      const versionMatch = pkg.title.match(/\(v(\d+)\)$/)
      const nextVersion = versionMatch ? parseInt(versionMatch[1]) + 1 : 2
      const baseTitle = versionMatch ? pkg.title.replace(/\s*\(v\d+\)$/, '') : pkg.title
      const newTitle = `${baseTitle} (v${nextVersion})`

      const { data, error } = await supabase.from('travel_packages').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        title: newTitle,
        destination: pkg.destination,
        destination_country: pkg.destination_country,
        check_in: pkg.check_in,
        check_out: pkg.check_out,
        adults: pkg.adults,
        children: pkg.children,
        total_price: pkg.total_price,
        currency: pkg.currency,
        notes: pkg.notes,
        flight_data: pkg.flight_data || {},
        hotel_data: pkg.hotel_data || {},
        activities_data: pkg.activities_data || [],
        status: 'draft',
      }).select('id').single()

      if (error) throw error
      toast.success(`Nova versão criada: "${newTitle}"`)
      router.push(`/dashboard/packages/${data.id}`)
    } catch {
      toast.error('Erro ao criar nova versão.')
    } finally {
      setDuplicating(false)
    }
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
      <div className="p-6 md:p-8 max-w-4xl animate-pulse">
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
        <p className="text-gray-400 mb-4">Orçamento não encontrado.</p>
        <Button variant="ghost" onClick={() => router.push('/dashboard/packages')}>
          <ArrowLeft size={14} /> Voltar
        </Button>
      </div>
    )
  }

  const flights = pkg.flight_data?.flights || []
  const hotels = pkg.hotel_data?.hotels || []
  const activities = Array.isArray(pkg.activities_data) ? pkg.activities_data : []
  const duration = pkg.check_in && pkg.check_out ? tripDuration(pkg.check_in, pkg.check_out) : null

  const statusConfig = {
    draft:  { label: 'Rascunho',    color: 'bg-gray-100 text-gray-600' },
    saved:  { label: 'Salvo',       color: 'bg-brand-50 text-brand-700' },
    booked: { label: '✓ Reservado', color: 'bg-green-50 text-green-700' },
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">

      {/* ─── Top bar ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <button
          onClick={() => router.push('/dashboard/packages')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={14} /> Minhas viagens
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusConfig[pkg.status]?.color}`}>
            {statusConfig[pkg.status]?.label}
          </span>

          {pkg.status !== 'booked' && (
            <Button variant="ghost" size="sm" onClick={() => handleStatusChange('booked')}>
              <CheckCircle size={13} /> Marcar como reservado
            </Button>
          )}

          {/* Editar */}
          {!editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Edit3 size={13} /> Editar
            </Button>
          ) : (
            <>
              <Button variant="primary" size="sm" loading={saving} onClick={handleSaveEdit}>
                <Save size={13} /> Salvar edição
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setEditing(false); setFields({ title: pkg.title, destination: pkg.destination, check_in: pkg.check_in, check_out: pkg.check_out, adults: pkg.adults, children: pkg.children, total_price: pkg.total_price, currency: pkg.currency, notes: pkg.notes || '' }) }}>
                <X size={13} /> Cancelar
              </Button>
            </>
          )}

          {/* Novo orçamento (nova versão) */}
          <Button variant="secondary" size="sm" loading={duplicating} onClick={handleDuplicate}>
            <Copy size={13} /> Novo orçamento
          </Button>

          {/* Exportar PDF */}
          <Button variant="secondary" size="sm" loading={exporting} onClick={handleExport}>
            <Download size={13} /> Exportar PDF
          </Button>

          {/* Excluir */}
          <Button variant="danger" size="sm" loading={deleting} onClick={handleDelete}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {/* ─── Hero card ──────────────────────────────────── */}
      <div className="bg-brand-500 rounded-2xl p-5 md:p-6 text-white mb-6">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-brand-200 text-xs mb-1 block">Título</label>
              <input value={fields.title} onChange={e => setFields(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-white/20 text-white placeholder-brand-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40"
                placeholder="Ex: Lisboa 7 dias - Julho 2025" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-brand-200 text-xs mb-1 block">Destino</label>
                <input value={fields.destination} onChange={e => setFields(p => ({ ...p, destination: e.target.value }))}
                  className="w-full bg-white/20 text-white placeholder-brand-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="Lisboa" />
              </div>
              <div>
                <label className="text-brand-200 text-xs mb-1 block">Moeda</label>
                <select value={fields.currency} onChange={e => setFields(p => ({ ...p, currency: e.target.value }))}
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none">
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="text-brand-200 text-xs mb-1 block">Check-in</label>
                <input type="date" value={fields.check_in} onChange={e => setFields(p => ({ ...p, check_in: e.target.value }))}
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-brand-200 text-xs mb-1 block">Check-out</label>
                <input type="date" value={fields.check_out} onChange={e => setFields(p => ({ ...p, check_out: e.target.value }))}
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-brand-200 text-xs mb-1 block">Adultos</label>
                <input type="number" min={1} value={fields.adults} onChange={e => setFields(p => ({ ...p, adults: +e.target.value }))}
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div>
                <label className="text-brand-200 text-xs mb-1 block">Crianças</label>
                <input type="number" min={0} value={fields.children} onChange={e => setFields(p => ({ ...p, children: +e.target.value }))}
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
              <div className="col-span-2">
                <label className="text-brand-200 text-xs mb-1 block">Valor total estimado</label>
                <input type="number" value={fields.total_price} onChange={e => setFields(p => ({ ...p, total_price: +e.target.value }))}
                  className="w-full bg-white/20 text-white rounded-lg px-3 py-2 text-sm focus:outline-none" />
              </div>
            </div>
          </div>
        ) : (
          <>
            <h1 className="font-display text-xl md:text-2xl font-bold mb-1">{pkg.title}</h1>
            <p className="text-brand-100 mb-4">{pkg.destination}{pkg.destination_country ? `, ${pkg.destination_country}` : ''}</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
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
            {pkg.total_price > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between">
                <span className="text-brand-200 text-sm">Investimento total estimado</span>
                <span className="text-2xl font-bold font-display">
                  {formatCurrency(pkg.total_price, pkg.currency || 'BRL')}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Voos ──────────────────────────────────────────── */}
      {flights.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Plane size={16} className="text-brand-500" /> Voos
          </h2>
          <div className="space-y-2">
            {flights.map((f: any, i: number) => (
              <FlightCard key={i} flight={f} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Hotéis ──────────────────────────────────────── */}
      {hotels.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <Hotel size={16} className="text-brand-500" /> Hospedagem
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {hotels.map((h: any, i: number) => {
              const nights = h.check_in && h.check_out
                ? Math.round((new Date(h.check_out).getTime() - new Date(h.check_in).getTime()) / 86400000)
                : (pkg.check_in && pkg.check_out ? tripDuration(pkg.check_in, pkg.check_out) : 1)
              return <HotelCard key={i} hotel={h} nights={nights || 1} />
            })}
          </div>
        </section>
      )}

      {/* ─── Atividades ──────────────────────────────────── */}
      {activities.length > 0 && (
        <section className="mb-6">
          <h2 className="font-display text-base md:text-lg font-semibold text-gray-900 flex items-center gap-2 mb-3">
            <MapPin size={16} className="text-brand-500" /> Atividades e atrações
          </h2>
          <div className="space-y-2">
            {activities.map((a: any, i: number) => (
              <ActivityCard key={i} activity={a} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Observações (editável) ───────────────────────── */}
      <section className="bg-sand-50 rounded-2xl p-5 border border-sand-100">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2 mb-2 text-sm">
          <Edit3 size={14} /> Observações
        </h2>
        {editing ? (
          <textarea
            value={fields.notes}
            onChange={e => setFields(p => ({ ...p, notes: e.target.value }))}
            rows={4}
            className="w-full text-sm text-gray-700 bg-white border border-sand-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            placeholder="Adicione observações, requisitos especiais, preferências do passageiro..."
          />
        ) : (
          <p className="text-sm text-gray-600 leading-relaxed">
            {pkg.notes || <span className="text-gray-400 italic">Sem observações. Clique em "Editar" para adicionar.</span>}
          </p>
        )}
      </section>
    </div>
  )
}
