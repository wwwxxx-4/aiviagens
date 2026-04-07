'use client'

import Link from 'next/link'
import { Plane, Hotel, MapPin, Star, ArrowRight, Globe, Sparkles, Clock } from 'lucide-react'

const features = [
  {
    icon: Plane,
    title: 'Voos em tempo real',
    desc: 'Busca nos melhores preços da internet.',
    color: 'text-ocean-500',
    bg: 'bg-ocean-50',
  },
  {
    icon: Hotel,
    title: 'Hotéis disponíveis',
    desc: 'Compare hotéis, pousadas e resorts com avaliações reais.',
    color: 'text-brand-500',
    bg: 'bg-brand-50',
  },
  {
    icon: MapPin,
    title: 'Atividades e atrações',
    desc: 'Descubra o que fazer no destino com curadoria por IA.',
    color: 'text-sand-600',
    bg: 'bg-sand-50',
  },
  {
    icon: Sparkles,
    title: 'Pacote inteligente',
    desc: 'A IA monta o pacote completo de acordo com seu orçamento.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
]

const stats = [
  { value: '200+', label: 'Destinos buscados' },
  { value: 'Tempo real', label: 'Dados atualizados' },
  { value: 'Bilíngue', label: 'PT & EN' },
  { value: 'IA', label: 'Mesquita Turismo' },
]

const suggestions = [
  'Quero viajar para Gramado em julho, 2 pessoas, 5 dias',
  'Voos de São Paulo para Orlando em dezembro, 4 pessoas',
  'Hotéis em Porto de Galinhas para lua de mel',
  'Pacote completo São Paulo → Fortaleza, agosto, família com 2 filhos',
]

const LOGO_URL = process.env.NEXT_PUBLIC_AGENCY_LOGO || ''

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F0F9FD]">
      {/* Navbar */}
      <nav className="border-b border-black/5 bg-[#F0F9FD]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {LOGO_URL ? (
              <img src={LOGO_URL} alt="Mesquita Turismo" className="h-9 w-auto object-contain" />
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
                  <Globe size={16} className="text-white" />
                </div>
                <span className="font-display text-lg font-semibold text-brand-700">
                  AI Mesquita Turismo
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-gray-600 hover:text-brand-600 transition-colors px-3 py-1.5"
            >
              Entrar
            </Link>
            <Link
              href="/auth/register"
              className="text-sm bg-brand-500 text-white px-4 py-1.5 rounded-lg hover:bg-brand-600 transition-colors font-medium"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1.5 rounded-full mb-6 border border-brand-100">
          <Sparkles size={12} />
          Powered by Mesquita Turismo
        </div>

        <h1 className="font-display text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Sua viagem perfeita,{' '}
          <span className="text-gradient">planejada por IA</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Diga para onde quer ir e quando — a IA busca voos, hotéis e
          atividades em tempo real e monta o pacote ideal para você.
        </p>

        {/* CTA input area */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-black/8 p-4 mb-4 shadow-sm">
          <p className="text-xs text-gray-400 mb-3 text-left font-medium uppercase tracking-wide">
            Experimente agora
          </p>
          <div className="flex flex-col gap-2">
            {suggestions.map((s, i) => (
              <Link
                key={i}
                href={`/auth/register?q=${encodeURIComponent(s)}`}
                className="text-left text-sm text-gray-600 hover:text-brand-600 hover:bg-brand-50 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 group"
              >
                <ArrowRight size={14} className="text-brand-400 group-hover:translate-x-0.5 transition-transform" />
                {s}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400">
          Grátis para começar · Sem cartão de crédito
        </p>
      </section>

      {/* Stats */}
      <section className="py-12" style={{ background: 'linear-gradient(135deg, #177CBC 0%, #4BBDE8 100%)' }}>
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-3xl font-bold text-white mb-1">{s.value}</div>
              <div className="text-brand-200 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
            Tudo que você precisa para planejar
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Da busca ao pacote final, a IA cuida de tudo enquanto você decide apenas para onde quer ir.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-black/5 card-hover"
              >
                <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center mb-4`}>
                  <Icon size={20} className={f.color} />
                </div>
                <h3 className="font-display font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white py-20 border-y border-black/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-semibold text-gray-900 mb-4">
              Como funciona
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              { step: '01', title: 'Conta o que quer', desc: 'Diga o destino, datas, quantas pessoas e preferências no chat.' },
              { step: '02', title: 'IA busca em tempo real', desc: 'Voos, hotéis e atividades são consultados automaticamente.' },
              { step: '03', title: 'Recebe o pacote pronto', desc: 'A IA monta e apresenta o itinerário completo que você pode salvar ou exportar em PDF.' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="font-mono text-5xl font-bold text-brand-100 mb-4">{s.step}</div>
                <h3 className="font-display font-semibold text-gray-900 mb-2 text-lg">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="rounded-3xl px-8 py-14" style={{ background: 'linear-gradient(135deg, #177CBC 0%, #4BBDE8 100%)' }}>
          <Star size={32} className="text-brand-200 mx-auto mb-4" />
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
            Comece a planejar agora
          </h2>
          <p className="text-brand-100 mb-8 max-w-md mx-auto">
            Crie sua conta gratuita e tenha seu assistente de viagens pessoal disponível 24h.
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-white text-brand-700 px-8 py-3 rounded-xl font-semibold hover:bg-brand-50 transition-colors text-sm"
          >
            Criar conta grátis
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-brand-400" />
            <span>AI Mesquita Turismo</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Clock size={12} />
            <span>Dados em tempo real</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
