'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { User, Globe, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import type { UserProfile } from '@/types'

interface ProfileData extends Partial<UserProfile> {
  whatsapp?: string
  contact_email?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({})
  const [authEmail, setAuthEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setAuthEmail(user.email ?? '')
      const { data } = await supabase.from('travel_profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile({ ...data, contact_email: data.contact_email ?? user.email ?? '' })
      } else {
        setProfile({ contact_email: user.email ?? '' })
      }
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
      whatsapp: profile.whatsapp,
      contact_email: profile.contact_email,
    }).eq('id', user.id)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar. Tente novamente.'); return }
    toast.success('Perfil atualizado!')
  }

  if (loading) return (
    <div className="p-8">
      <div className="h-8 w-48 bg-gray-100 rounded-lg animate-pulse mb-8" />
      <div className="space-y-4">
        {[1,2,3,4,5,6].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
      </div>
    </div>
  )

  return (
    <div className="p-8 max-w-lg">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Seu perfil</h1>
      <p className="text-gray-500 text-sm mb-8">Configure seus dados de contato e preferências de viagem.</p>

      <div className="bg-white rounded-2xl border border-black/5 p-6">
        <form onSubmit={handleSave} className="flex flex-col gap-5">

          {/* ── Dados pessoais ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Dados pessoais
            </p>
            <div className="flex flex-col gap-4">
              <Input
                label="Nome completo"
                value={profile.full_name || ''}
                onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                icon={<User size={14} />}
                placeholder="Seu nome completo"
              />

              <Input
                label="E-mail de contato"
                type="email"
                value={profile.contact_email || ''}
                onChange={e => setProfile(p => ({ ...p, contact_email: e.target.value }))}
                icon={<Mail size={14} />}
                placeholder={authEmail || 'seu@email.com'}
                hint="E-mail que a agência usará para entrar em contato com você"
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">WhatsApp</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone size={14} />
                  </div>
                  <input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={profile.whatsapp || ''}
                    onChange={e => setProfile(p => ({ ...p, whatsapp: e.target.value }))}
                    className="w-full h-10 pl-9 pr-3 py-2 text-sm rounded-xl border border-black/10 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
                  />
                </div>
                <p className="text-xs text-gray-400">Número com DDD — a agência pode te contatar via WhatsApp</p>
              </div>
            </div>
          </div>

          <div className="border-t border-black/5" />

          {/* ── Preferências de viagem ── */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Preferências de viagem
            </p>
            <div className="flex flex-col gap-4">
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
            </div>
          </div>

          <Button type="submit" loading={saving} className="mt-2">
            Salvar perfil
          </Button>
        </form>
      </div>
    </div>
  )
}
