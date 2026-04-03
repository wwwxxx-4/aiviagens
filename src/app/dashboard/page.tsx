import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageSquare, Briefcase, Plus, Plane, MapPin, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('travel_profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', user!.id)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(5)

  const { data: packages } = await supabase
    .from('travel_packages')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const firstName = profile?.full_name?.split(' ')[0] || 'Viajante'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">
          {greeting}, {firstName}!
        </h1>
        <p className="text-gray-500">Para onde vamos hoje?</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Link
          href="/chat/new"
          className="group bg-brand-500 rounded-2xl p-6 text-white hover:bg-brand-600 transition-colors"
        >
          <Plus size={24} className="mb-3 opacity-80" />
          <h3 className="font-semibold mb-1">Nova conversa</h3>
          <p className="text-sm text-brand-100">Planejar uma viagem</p>
        </Link>

        <Link
          href="/dashboard/packages"
          className="group bg-white rounded-2xl p-6 border border-black/5 hover:border-brand-200 transition-colors card-hover"
        >
          <Briefcase size={24} className="mb-3 text-brand-400" />
          <h3 className="font-semibold text-gray-900 mb-1">Minhas viagens</h3>
          <p className="text-sm text-gray-400">
            {packages?.length ?? 0} pacote{packages?.length !== 1 ? 's' : ''} salvo{packages?.length !== 1 ? 's' : ''}
          </p>
        </Link>

        <Link
          href="/chat"
          className="group bg-white rounded-2xl p-6 border border-black/5 hover:border-brand-200 transition-colors card-hover"
        >
          <MessageSquare size={24} className="mb-3 text-ocean-400" />
          <h3 className="font-semibold text-gray-900 mb-1">Conversas</h3>
          <p className="text-sm text-gray-400">
            {conversations?.length ?? 0} ativa{conversations?.length !== 1 ? 's' : ''}
          </p>
        </Link>
      </div>

      {/* Recent conversations */}
      {conversations && conversations.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-gray-900">Conversas recentes</h2>
            <Link href="/chat" className="text-sm text-brand-500 hover:underline">Ver todas</Link>
          </div>
          <div className="space-y-2">
            {conversations.map(conv => (
              <Link
                key={conv.id}
                href={`/chat/${conv.id}`}
                className="flex items-center gap-4 bg-white rounded-xl p-4 border border-black/5 hover:border-brand-200 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                  <MessageSquare size={14} className="text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                  <p className="text-xs text-gray-400">{formatDate(conv.updated_at, "dd/MM/yyyy 'às' HH:mm")}</p>
                </div>
                <Plane size={14} className="text-gray-300 group-hover:text-brand-400 transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(!conversations || conversations.length === 0) && (
        <div className="text-center py-16 bg-white rounded-2xl border border-black/5">
          <MapPin size={40} className="text-brand-200 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
            Sua primeira viagem espera por você
          </h3>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Diga para onde quer ir e a IA cuida de tudo: voos, hotéis e atividades em tempo real.
          </p>
          <Link
            href="/chat/new"
            className="inline-flex items-center gap-2 bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <Plus size={14} />
            Começar a planejar
          </Link>
        </div>
      )}
    </div>
  )
}
