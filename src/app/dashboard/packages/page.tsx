import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Briefcase, Plus, MapPin, Calendar, ExternalLink, Download } from 'lucide-react'
import { formatDate, formatCurrency, tripDuration } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Minhas viagens' }

export default async function PackagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: packages } = await supabase
    .from('travel_packages')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft:  { label: 'Rascunho',    color: 'bg-gray-100 text-gray-600' },
    saved:  { label: 'Salvo',       color: 'bg-brand-50 text-brand-700' },
    booked: { label: '✓ Reservado', color: 'bg-green-50 text-green-700' },
  }

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Minhas viagens</h1>
          <p className="text-gray-500 text-sm">Pacotes montados e salvos pela IA.</p>
        </div>
        <Link href="/chat/new"
          className="inline-flex items-center gap-2 bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
          <Plus size={14} /> Nova viagem
        </Link>
      </div>

      {packages && packages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map(pkg => {
            const duration = pkg.check_in && pkg.check_out ? tripDuration(pkg.check_in, pkg.check_out) : null
            const status = statusConfig[pkg.status] || statusConfig.draft
            return (
              <div key={pkg.id} className="bg-white rounded-2xl border border-black/5 overflow-hidden hover:border-brand-200 transition-all card-hover">
                <div className="bg-brand-500 p-4 text-white">
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                      <MapPin size={14} />
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                  </div>
                  <h3 className="font-display font-semibold text-sm leading-tight">{pkg.title}</h3>
                  <p className="text-brand-200 text-xs mt-0.5">{pkg.destination}</p>
                </div>
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
                <div className="px-4 pb-4 flex gap-2">
                  <Link href={`/dashboard/packages/${pkg.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium text-white bg-brand-500 hover:bg-brand-600 py-2 rounded-lg transition-colors">
                    <ExternalLink size={11} /> Ver detalhes
                  </Link>
                  <a href={`/api/export?id=${pkg.id}`} download title="Exportar"
                    className="flex items-center justify-center px-3 py-2 text-xs text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download size={11} />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-black/5">
          <Briefcase size={40} className="text-gray-200 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">Nenhuma viagem salva ainda</h3>
          <p className="text-gray-400 text-sm mb-6">Converse com a IA e peça para montar um pacote.</p>
          <Link href="/chat/new"
            className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
            <Plus size={14} /> Planejar viagem
          </Link>
        </div>
      )}
    </div>
  )
}
