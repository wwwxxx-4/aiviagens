'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Globe, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import type { UserProfile } from '@/types'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('travel_profiles').select('*').eq('id', user.id).single()
      if (data) setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('travel_profiles').update({
      full_name: profile.full_name,
      home_airport: profile.home_airport,
      preferred_currency: profile.preferred_currency,
      preferred_language: profile.preferred_language,
    }).eq('id', user.id)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar.'); return }
    toast.success('Perfil atualizado!')
  }

  if (loading) return (
    <div className="p-8">
      <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-8" />
      <div className="space-y-4">
        {[1,2,3,4].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-lg">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Seu perfil</h1>
      <p className="text-gray-500 text-sm mb-8">Configure suas preferências de viagem.</p>

      <div className="bg-white rounded-2xl border border-black/5 p-6">
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <Input
            label="Nome completo"
            value={profile.full_name || ''}
            onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
            icon={<User size={14} />}
            placeholder="Seu nome"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Idioma preferido</label>
            <select
              value={profile.preferred_language || 'both'}
              onChange={e => setProfile(p => ({ ...p, preferred_language: e.target.value as UserProfile['preferred_language'] }))}
              className="w-full h-10 px-3 text-sm rounded-xl border border-black/10 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="pt">Português (BR)</option>
              <option value="en">English</option>
              <option value="both">Bilíngue (PT + EN)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Moeda padrão</label>
            <select
              value={profile.preferred_currency || 'BRL'}
              onChange={e => setProfile(p => ({ ...p, preferred_currency: e.target.value }))}
              className="w-full h-10 px-3 text-sm rounded-xl border border-black/10 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-300"
            >
              <option value="BRL">BRL — Real brasileiro</option>
              <option value="USD">USD — Dólar americano</option>
              <option value="EUR">EUR — Euro</option>
              <option value="GBP">GBP — Libra esterlina</option>
            </select>
          </div>

          <Input
            label="Aeroporto de origem (IATA)"
            value={profile.home_airport || ''}
            onChange={e => setProfile(p => ({ ...p, home_airport: e.target.value.toUpperCase() }))}
            icon={<Globe size={14} />}
            placeholder="Ex: GRU, CGH, BSB"
            hint="Código de 3 letras do aeroporto mais próximo de você"
            maxLength={3}
          />

          <Button type="submit" loading={saving} className="mt-2">
            Salvar preferências
          </Button>
        </form>
      </div>
    </div>
  )
}
