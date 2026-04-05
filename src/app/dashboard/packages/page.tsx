import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import PackagesClient from '@/components/package/PackagesClient'
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

      <PackagesClient initialPackages={packages || []} />
    </div>
  )
}
