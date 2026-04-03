'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, Download, Plus, FileText, MapPin, Calendar, Users } from 'lucide-react'
import { formatDate, formatCurrency, tripDuration } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface TravelPackage {
  id: string; title: string; destination: string; destination_country?: string
  check_in?: string; check_out?: string; adults: number; children: number
  total_price?: number; currency?: string; status: string; notes?: string; created_at: string
}

export default function AgentPage() {
  const [packages, setPackages] = useState<TravelPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [selected, setSelected] = useState<TravelPackage | null>(null)
  const [passengerName, setPassengerName] = useState('')
  const [customNotes, setCustomNotes] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('travel_packages').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setPackages(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function generateQuote(pkg: TravelPackage) {
    setGenerating(pkg.id)
    try {
      const res = await fetch('/api/generate-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: pkg.id,
          passenger_name: passengerName || pkg.notes || 'Cliente',
          custom_notes: customNotes,
        }),
      })
      if (!res.ok) throw new Error('Erro ao gerar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `orcamento-${pkg.destination.toLowerCase().replace(/\s+/g, '-')}.html`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Orçamento gerado! Abra o arquivo e use Ctrl+P → PDF')
      setSelected(null)
    } catch {
      toast.error('Erro ao gerar orçamento.')
    } finally {
      setGenerating(null)
    }
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center">
            <Briefcase size={16} className="text-brand-500" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Modo Agente de Viagens</h1>
            <p className="text-gray-500 text-sm">Gere orçamentos profissionais em PDF para seus clientes.</p>
          </div>
        </div>
        <Link href="/chat/new"
          className="inline-flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
          <Plus size={14} /> Nova viagem no chat
        </Link>
      </div>

      {/* How it works */}
      <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 text-sm text-brand-700">
        <p className="font-medium mb-1">Como funciona:</p>
        <ol className="list-decimal ml-4 space-y-1 text-xs">
          <li>Converse com o assistente no Chat IA e pesquise voos, hotéis e atividades</li>
          <li>Peça para o assistente "salvar o pacote" quando encontrar boas opções</li>
          <li>Volte aqui, selecione o pacote salvo e gere o orçamento em PDF</li>
          <li>Envie o PDF para o seu cliente!</li>
        </ol>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : packages.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-black/5">
          <FileText size={40} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">Nenhum pacote salvo ainda</h3>
          <p className="text-gray-400 text-sm mb-6">Converse com o assistente e salve um pacote para gerar o orçamento.</p>
          <Link href="/chat/new"
            className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
            <Plus size={14} /> Criar viagem no chat
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white rounded-2xl border border-black/5 hover:border-brand-200 transition-all">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                      <MapPin size={16} className="text-brand-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{pkg.title}</p>
                      <p className="text-sm text-gray-500">{pkg.destination}{pkg.destination_country ? `, ${pkg.destination_country}` : ''}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        {pkg.check_in && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {formatDate(pkg.check_in, 'dd/MM/yyyy')}
                            {pkg.check_out && ` → ${formatDate(pkg.check_out, 'dd/MM/yyyy')}`}
                            {pkg.check_in && pkg.check_out && ` (${tripDuration(pkg.check_in, pkg.check_out)} dias)`}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users size={10} />
                          {pkg.adults} adulto{pkg.adults !== 1 ? 's' : ''}
                          {pkg.children > 0 && ` + ${pkg.children} criança${pkg.children !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {pkg.total_price && (
                      <span className="font-bold text-brand-600 text-sm">
                        {formatCurrency(pkg.total_price, pkg.currency || 'BRL')}
                      </span>
                    )}
                    <Button
                      size="sm"
                      onClick={() => setSelected(selected?.id === pkg.id ? null : pkg)}
                      variant={selected?.id === pkg.id ? 'secondary' : 'primary'}
                    >
                      <FileText size={13} /> Gerar orçamento
                    </Button>
                  </div>
                </div>

                {selected?.id === pkg.id && (
                  <div className="mt-4 pt-4 border-t border-black/5">
                    <p className="text-sm font-medium text-gray-700 mb-3">Dados para o orçamento:</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <Input
                        label="Nome do passageiro"
                        value={passengerName}
                        onChange={e => setPassengerName(e.target.value)}
                        placeholder="Nome completo do cliente"
                      />
                      <Input
                        label="Observações (opcional)"
                        value={customNotes}
                        onChange={e => setCustomNotes(e.target.value)}
                        placeholder="Ex: inclui transfer, seguro viagem..."
                      />
                    </div>
                    <Button
                      loading={generating === pkg.id}
                      onClick={() => generateQuote(pkg)}
                      className="w-full"
                    >
                      <Download size={14} /> Baixar orçamento em HTML/PDF
                    </Button>
                    <p className="text-xs text-gray-400 text-center mt-2">
                      Após baixar, abra o arquivo no navegador e use Ctrl+P → Salvar como PDF
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
