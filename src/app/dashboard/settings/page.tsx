'use client'

import { useState, useEffect, useRef } from 'react'
import { Settings, Percent, Phone, Globe, Save, Info, Upload, X, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { AgencySettings } from '@/lib/booking'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'iv_agency_settings'

const defaults: AgencySettings = {
  agencyName: 'Mesquita Turismo', whatsapp: '5511953967095',
  phone: '(11) 95396-7095', email: 'contato@mesquitaturismo.com.br', logoUrl: '',
  bookingFlightsUrl: 'https://www.comprarviagem.com.br/mesquitaturismo',
  bookingHotelsUrl: 'https://www.comprarviagem.com.br/mesquitaturismo/hotel-list',
  bookingActivitiesUrl: 'https://www.civitatis.com/br/?ag_aid=63335',
  markupFlights: 0, markupHotels: 0, markupActivities: 0,
}

export default function SettingsPage() {
  const [s, setS] = useState<AgencySettings>(defaults)
  const [saving, setSaving] = useState(false)
  const [logoPreview, setLogoPreview] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) { const p = { ...defaults, ...JSON.parse(saved) }; setS(p); if (p.logoUrl) setLogoPreview(p.logoUrl) }
    } catch { /* ignore */ }
  }, [])

  function set<K extends keyof AgencySettings>(key: K, value: AgencySettings[K]) { setS(p => ({ ...p, [key]: value })) }

  function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem muito grande. Máximo 2MB.'); return }
    const reader = new FileReader()
    reader.onload = ev => { const d = ev.target?.result as string; setLogoPreview(d); set('logoUrl', d) }
    reader.readAsDataURL(file)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); toast.success('Configurações salvas!') }
    catch { toast.error('Erro ao salvar.') }
    finally { setSaving(false) }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-brand-50 flex items-center justify-center"><Settings size={16} className="text-brand-500" /></div>
        <div><h1 className="font-display text-2xl font-bold text-gray-900">Configurações</h1><p className="text-gray-500 text-sm">Personalize o assistente para sua agência.</p></div>
      </div>
      <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 mb-5 flex gap-2 text-sm text-brand-700">
        <Info size={15} className="shrink-0 mt-0.5" />
        <span>Salvo no navegador. Para fixar permanentemente, cole as variáveis do preview abaixo no <code className="bg-brand-100 px-1 rounded text-xs">.env.local</code>.</span>
      </div>
      <form onSubmit={handleSave} className="space-y-5">

        {/* Logo */}
        <section className="bg-white rounded-2xl border border-black/5 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2"><Upload size={14} className="text-brand-400" /> Logomarca</h2>
          <div className="flex items-center gap-4">
            {logoPreview ? (
              <div className="relative">
                <img src={logoPreview} alt="Logo" className="h-16 max-w-[160px] object-contain rounded-lg border border-black/5" />
                <button type="button" onClick={() => { setLogoPreview(''); set('logoUrl', '') }}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"><X size={10} /></button>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()}
                className="w-40 h-16 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-brand-300 hover:bg-brand-50 transition-all">
                <Upload size={16} className="text-gray-400 mb-1" /><span className="text-xs text-gray-400">Clique para enviar</span>
              </div>
            )}
            <div>
              <button type="button" onClick={() => fileRef.current?.click()} className="text-sm text-brand-500 hover:text-brand-700 font-medium">
                {logoPreview ? 'Trocar imagem' : 'Selecionar logo'}</button>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG ou SVG · Máx. 2MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
          </div>
        </section>

        {/* Agency data */}
        <section className="bg-white rounded-2xl border border-black/5 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2"><Globe size={14} className="text-brand-400" /> Dados da agência</h2>
          <div className="space-y-4">
            <Input label="Nome da agência" value={s.agencyName} onChange={e => set('agencyName', e.target.value)} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Telefone" value={s.phone} onChange={e => set('phone', e.target.value)} icon={<Phone size={14} />} />
              <Input label="E-mail" value={s.email} onChange={e => set('email', e.target.value)} icon={<Mail size={14} />} />
            </div>
            <Input label="WhatsApp (com DDI, só números)" value={s.whatsapp} onChange={e => set('whatsapp', e.target.value.replace(/\D/g, ''))} hint="Ex: 5511953967095" icon={<Phone size={14} />} />
          </div>
        </section>

        {/* Booking links */}
        <section className="bg-white rounded-2xl border border-black/5 p-5">
          <h2 className="font-semibold text-gray-800 mb-4 text-sm flex items-center gap-2"><Globe size={14} className="text-brand-400" /> Links de reserva</h2>
          <div className="space-y-4">
            <Input label="Site de voos (URL base)" value={s.bookingFlightsUrl} onChange={e => set('bookingFlightsUrl', e.target.value)} />
            <Input label="Site de hotéis" value={s.bookingHotelsUrl} onChange={e => set('bookingHotelsUrl', e.target.value)} hint="O cliente deve preencher os dados no site" />
            <Input label="Site de atividades / ingressos" value={s.bookingActivitiesUrl} onChange={e => set('bookingActivitiesUrl', e.target.value)} />
          </div>
        </section>

        {/* Markup */}
        <section className="bg-white rounded-2xl border border-black/5 p-5">
          <h2 className="font-semibold text-gray-800 mb-1 text-sm flex items-center gap-2"><Percent size={14} className="text-brand-400" /> Markup de preços</h2>
          <p className="text-xs text-gray-400 mb-4">Percentual adicionado ao preço exibido ao cliente.</p>
          <div className="grid grid-cols-3 gap-4">
            {(['markupFlights', 'markupHotels', 'markupActivities'] as const).map((key, i) => (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">{['Voos (%)', 'Hotéis (%)', 'Atividades (%)'][i]}</label>
                <div className="relative">
                  <input type="number" min="0" max="100" step="0.5" value={s[key]} onChange={e => set(key, Number(e.target.value))}
                    className="w-full h-10 px-3 pr-7 text-sm rounded-xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
                {s[key] > 0 && <p className="text-xs text-brand-600">R$ 1.000 → R$ {Math.ceil(1000 * (1 + s[key] / 100)).toLocaleString('pt-BR')}</p>}
              </div>
            ))}
          </div>
        </section>

        {/* .env preview */}
        <section className="bg-gray-50 rounded-2xl border border-black/5 p-5">
          <h2 className="font-semibold text-gray-800 mb-3 text-sm">Preview .env.local</h2>
          <pre className="text-xs text-gray-600 bg-white rounded-xl p-3 border border-black/5 overflow-x-auto leading-6 whitespace-pre-wrap select-all">
{`NEXT_PUBLIC_AGENCY_NAME=${s.agencyName}
NEXT_PUBLIC_AGENCY_PHONE=${s.phone}
NEXT_PUBLIC_AGENCY_EMAIL=${s.email}
NEXT_PUBLIC_WHATSAPP=${s.whatsapp}
NEXT_PUBLIC_BOOKING_FLIGHTS_URL=${s.bookingFlightsUrl}
NEXT_PUBLIC_BOOKING_HOTELS_URL=${s.bookingHotelsUrl}
NEXT_PUBLIC_BOOKING_ACTIVITIES_URL=${s.bookingActivitiesUrl}
NEXT_PUBLIC_MARKUP_FLIGHTS=${s.markupFlights}
NEXT_PUBLIC_MARKUP_HOTELS=${s.markupHotels}
NEXT_PUBLIC_MARKUP_ACTIVITIES=${s.markupActivities}`}
          </pre>
        </section>

        <Button type="submit" loading={saving} fullWidth size="lg"><Save size={14} /> Salvar configurações</Button>
      </form>
    </div>
  )
}
