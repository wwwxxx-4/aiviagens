'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, MapPin, Calendar, ExternalLink, Download, Trash2, AlertCircle, CheckSquare, Square, FileDown, X } from 'lucide-react'
import { formatDate, formatCurrency, tripDuration } from '@/lib/utils'
import toast from 'react-hot-toast'

interface TravelPackage {
  id: string
  title: string
  destination: string
  destination_country?: string
  check_in?: string
  check_out?: string
  adults?: number
  children?: number
  total_price?: number
  currency?: string
  status?: string
  created_at?: string
}

interface PackagesClientProps {
  initialPackages: TravelPackage[]
}

const statusConfig: Record<string, { label: string; color: string }> = {
  draft:  { label: 'Rascunho',    color: 'bg-gray-100 text-gray-600' },
  saved:  { label: 'Salvo',       color: 'bg-brand-50 text-brand-700' },
  booked: { label: '✓ Reservado', color: 'bg-green-50 text-green-700' },
}

export default function PackagesClient({ initialPackages }: PackagesClientProps) {
  const [packages, setPackages] = useState<TravelPackage[]>(initialPackages)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectMode, setSelectMode] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  // ── Delete ──────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        setPackages(prev => prev.filter(p => p.id !== id))
        setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
        toast.success('Viagem excluída.')
      } else {
        toast.error('Erro ao excluir.')
      }
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  // ── Select toggle ───────────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  function toggleSelectAll() {
    if (selected.size === packages.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(packages.map(p => p.id)))
    }
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
  }

  // ── Export selected ─────────────────────────────────────────────
  function exportCombined(showPrices: boolean) {
    const ids = Array.from(selected).join(',')
    const url = `/api/export?ids=${ids}&prices=${showPrices}`
    window.open(url, '_blank')
    setShowExportModal(false)
  }

  const selectedCount = selected.size

  if (packages.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-black/5">
        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mx-auto mb-4">
          <MapPin size={24} className="text-brand-300" />
        </div>
        <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">Nenhuma viagem salva ainda</h3>
        <p className="text-gray-400 text-sm mb-6">Converse com a IA e peça para montar um pacote.</p>
        <Link href="/chat/new"
          className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
          <Plus size={14} /> Planejar viagem
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand-600 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-brand-200"
              >
                {selected.size === packages.length ? <CheckSquare size={13} className="text-brand-500" /> : <Square size={13} />}
                {selected.size === packages.length ? 'Desmarcar todos' : 'Selecionar todos'}
              </button>
              <button
                onClick={exitSelectMode}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-3 py-1.5 rounded-lg border border-gray-100"
              >
                <X size={12} /> Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setSelectMode(true)}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand-600 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-brand-200"
            >
              <CheckSquare size={13} />
              Selecionar itens
            </button>
          )}
        </div>

        {/* Combine selected action */}
        {selectMode && selectedCount > 0 && (
          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <FileDown size={14} />
            Exportar {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {packages.map(pkg => {
          const duration = pkg.check_in && pkg.check_out ? tripDuration(pkg.check_in, pkg.check_out) : null
          const status = statusConfig[pkg.status || 'draft'] || statusConfig.draft
          const isConfirming = confirmDeleteId === pkg.id
          const isSelected = selected.has(pkg.id)

          return (
            <div
              key={pkg.id}
              className={`bg-white rounded-2xl border overflow-hidden transition-all relative ${
                isSelected
                  ? 'border-brand-400 ring-2 ring-brand-200'
                  : 'border-black/5 hover:border-brand-200 card-hover'
              }`}
            >
              {/* Select checkbox */}
              {selectMode && (
                <button
                  onClick={() => toggleSelect(pkg.id)}
                  className="absolute top-3 left-3 z-10 w-6 h-6 rounded-md flex items-center justify-center bg-white shadow-sm border border-gray-200"
                >
                  {isSelected
                    ? <CheckSquare size={14} className="text-brand-500" />
                    : <Square size={14} className="text-gray-300" />
                  }
                </button>
              )}

              {/* Header */}
              <div className={`bg-brand-500 p-4 text-white ${selectMode ? 'pl-12' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <MapPin size={14} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                </div>
                <h3 className="font-display font-semibold text-sm leading-tight">{pkg.title}</h3>
                <p className="text-brand-200 text-xs mt-0.5">{pkg.destination}</p>
              </div>

              {/* Body */}
              <div className="p-4 space-y-2">
                {pkg.check_in && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar size={11} className="text-brand-300" />
                    {formatDate(pkg.check_in, 'dd/MM/yyyy')}
                    {pkg.check_out && ` → ${formatDate(pkg.check_out, 'dd/MM/yyyy')}`}
                    {duration && <span className="text-gray-300">· {duration}d</span>}
                  </div>
                )}
                {(pkg.adults || 0) > 0 && (
                  <p className="text-xs text-gray-400">
                    {pkg.adults} adulto{pkg.adults !== 1 ? 's' : ''}
                    {(pkg.children || 0) > 0 && ` + ${pkg.children} criança${pkg.children !== 1 ? 's' : ''}`}
                  </p>
                )}
                {pkg.total_price && (
                  <p className="font-semibold text-brand-600 text-sm">
                    {formatCurrency(pkg.total_price, pkg.currency || 'BRL')}
                  </p>
                )}
              </div>

              {/* Actions */}
              {isConfirming ? (
                <div className="px-4 pb-4 flex items-center gap-2 bg-red-50 border-t border-red-100 py-3">
                  <AlertCircle size={12} className="text-red-400 shrink-0" />
                  <span className="text-xs text-red-600 flex-1">Excluir esta viagem?</span>
                  <button
                    onClick={() => handleDelete(pkg.id)}
                    disabled={deletingId === pkg.id}
                    className="text-xs font-semibold text-red-600 hover:text-red-800 px-2"
                  >
                    {deletingId === pkg.id ? '...' : 'Sim, excluir'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-1"
                  >
                    Não
                  </button>
                </div>
              ) : (
                <div className="px-4 pb-4 flex gap-2">
                  <Link href={`/dashboard/packages/${pkg.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 py-2 rounded-lg transition-colors">
                    <ExternalLink size={11} /> Ver detalhes
                  </Link>
                  <a href={`/api/export?id=${pkg.id}`} target="_blank" title="Exportar PDF"
                    className="flex items-center justify-center px-3 py-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download size={11} />
                  </a>
                  <button
                    onClick={() => setConfirmDeleteId(pkg.id)}
                    title="Excluir"
                    className="flex items-center justify-center px-3 py-2 text-xs text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Export Modal ─────────────────────────────────────────── */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-gray-900">Exportar orçamento</h3>
              <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Exportar {selectedCount} item{selectedCount !== 1 ? 's' : ''} como orçamento combinado em PDF.
              Deseja incluir os preços?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => exportCombined(true)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                <FileDown size={15} /> Com preços
              </button>
              <button
                onClick={() => exportCombined(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                <FileDown size={15} /> Sem preços
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
