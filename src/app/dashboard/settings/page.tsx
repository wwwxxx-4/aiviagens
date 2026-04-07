'use client'

import { useEffect, useState } from 'react'
import { User, Phone, Mail, Calendar, Plane, Hotel, Users, RefreshCw, Copy, Check } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Lead {
  id: string
  created_at: string
  full_name: string | null
  birth_date: string | null
  cpf: string | null
  email: string | null
  phone: string | null
  adults: number
  children: number
  flight_info: Record<string, unknown>[] | null
  hotel_info: Record<string, unknown>[] | null
  conversation_id: string | null
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      className="ml-1 text-gray-300 hover:text-brand-500 transition-colors"
    >
      {copied ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
    </button>
  )
}

export default function SettingsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  async function fetchLeads() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/admin/leads')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro'); return }
      setLeads(data.leads || [])
      setError('')
    } catch { setError('Erro de conexão') }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchLeads() }, [])

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function waLink(phone: string, name: string) {
    const num = phone.replace(/\D/g, '')
    const msg = `Olá ${name}! Sou da Mesquita Turismo. Vi que você tem interesse em uma viagem. Posso ajudar com a reserva?`
    return `https://wa.me/55${num}?text=${encodeURIComponent(msg)}`
  }

  const withFlights = leads.filter(l => l.flight_info && l.flight_info.length > 0).length
  const withHotels  = leads.filter(l => l.hotel_info  && l.hotel_info.length  > 0).length
  const withPhone   = leads.filter(l => l.phone).length

  return (
    <div className="p-6 md:p-8 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">⚙ Configurações · Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Leads captados pelo assistente de viagens</p>
        </div>
        <button onClick={fetchLeads} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 text-brand-600 text-sm font-medium hover:bg-brand-100 transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total de leads',      value: leads.length,  color: 'text-brand-600' },
          { label: 'Com WhatsApp',        value: withPhone,     color: 'text-green-500' },
          { label: 'Interesse em voos',   value: withFlights,   color: 'text-amber-500' },
          { label: 'Interesse em hotéis', value: withHotels,    color: 'text-purple-500' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-black/5 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 mb-4">
          {error === 'Forbidden'
            ? '⚠️ Acesso restrito ao administrador.'
            : `⚠️ ${error}. Verifique se a tabela passenger_leads foi criada no Supabase (SQL abaixo).`}
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-semibold">Ver SQL para criar a tabela</summary>
            <pre className="mt-2 text-xs bg-gray-900 text-green-400 p-3 rounded-lg overflow-auto whitespace-pre-wrap">{SQL_CREATE}</pre>
          </details>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-50 rounded-2xl animate-pulse" />)}
        </div>
      )}

      {/* ── Empty ── */}
      {!loading && !error && leads.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-black/5">
          <User size={36} className="text-brand-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium">Nenhum lead captado ainda</p>
          <p className="text-gray-400 text-xs mt-1">
            Quando um cliente fornecer dados para reserva no chat, ele aparecerá aqui automaticamente.
          </p>
        </div>
      )}

      {/* ── Leads ── */}
      <div className="space-y-3">
        {leads.map(lead => {
          const flight = lead.flight_info?.[0]
          const hotel  = lead.hotel_info?.[0]
          return (
            <div key={lead.id} className="bg-white rounded-2xl border border-black/5 p-5 hover:border-brand-200 transition-all">

              {/* Row 1: avatar + name + actions */}
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-brand-700">
                      {(lead.full_name || '?')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{lead.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{fmtDate(lead.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {lead.adults > 0 && (
                    <span className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-lg">
                      <Users size={10} />
                      {lead.adults} adulto{lead.adults !== 1 ? 's' : ''}
                      {lead.children > 0 ? ` + ${lead.children} criança${lead.children !== 1 ? 's' : ''}` : ''}
                    </span>
                  )}
                  {lead.phone && (
                    <a href={waLink(lead.phone, lead.full_name || 'Cliente')} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                      <Phone size={10} /> Contatar via WhatsApp
                    </a>
                  )}
                </div>
              </div>

              {/* Row 2: data fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {lead.cpf && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-400 mb-0.5">CPF</p>
                    <p className="text-xs font-mono font-semibold text-gray-700 flex items-center">{lead.cpf}<CopyBtn text={lead.cpf} /></p>
                  </div>
                )}
                {lead.birth_date && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Calendar size={9} /> Nascimento</p>
                    <p className="text-xs font-semibold text-gray-700">{lead.birth_date}</p>
                  </div>
                )}
                {lead.email && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Mail size={9} /> E-mail</p>
                    <p className="text-xs font-semibold text-gray-700 flex items-center truncate">{lead.email}<CopyBtn text={lead.email} /></p>
                  </div>
                )}
                {lead.phone && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Phone size={9} /> Telefone</p>
                    <p className="text-xs font-semibold text-gray-700 flex items-center">{lead.phone}<CopyBtn text={lead.phone} /></p>
                  </div>
                )}
              </div>

              {/* Row 3: interesse */}
              {(flight || hotel) && (
                <div className="border-t border-black/5 pt-3 flex flex-wrap gap-2">
                  {flight && (
                    <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-lg px-3 py-1.5">
                      <Plane size={10} className="text-brand-500 shrink-0" />
                      <span className="text-xs text-brand-700 font-medium">
                        {String(flight.origin ?? '?')} → {String(flight.destination ?? '?')}
                        {flight.departure_time ? ` · ${String(flight.departure_time).slice(0, 10)}` : ''}
                        {flight.price ? ` · ${formatCurrency(Number(flight.price), String(flight.currency ?? 'BRL'))}` : ''}
                      </span>
                    </div>
                  )}
                  {hotel && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5">
                      <Hotel size={10} className="text-amber-600 shrink-0" />
                      <span className="text-xs text-amber-700 font-medium">
                        {String(hotel.name ?? '?')}
                        {hotel.price_per_night ? ` · ${formatCurrency(Number(hotel.price_per_night), String(hotel.currency ?? 'BRL'))}/noite` : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}

// SQL shown in error state
const SQL_CREATE = `-- Cole este SQL no Supabase > SQL Editor e execute:

CREATE TABLE IF NOT EXISTS passenger_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID,
  full_name TEXT,
  birth_date TEXT,
  cpf TEXT,
  email TEXT,
  phone TEXT,
  flight_info JSONB,
  hotel_info JSONB,
  adults INTEGER DEFAULT 1,
  children INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE passenger_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service insert leads" ON passenger_leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin read leads" ON passenger_leads
  FOR SELECT USING (true);`
