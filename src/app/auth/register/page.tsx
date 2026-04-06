'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const supabase = createClient()

  function validate() {
    const e: Record<string, string> = {}
    if (!fullName.trim()) e.fullName = 'Informe seu nome'
    if (!email) e.email = 'Informe seu e-mail'
    if (!password || password.length < 6) e.password = 'Mínimo 6 caracteres'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setLoading(false)

    if (error) {
      if (error.message.includes('already registered')) {
        setErrors({ general: 'Este e-mail já está cadastrado.' })
      } else {
        setErrors({ general: error.message })
      }
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-brand-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">
          Verifique seu e-mail
        </h2>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Enviamos um link de confirmação para <strong>{email}</strong>.
          Clique no link para ativar sua conta.
        </p>
        <Button variant="ghost" onClick={() => router.push('/auth/login')}>
          Voltar para o login
        </Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
          Crie sua conta
        </h1>
        <p className="text-gray-500 text-sm">
          Grátis para começar · Sem cartão de crédito
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <Input
            label="Nome completo"
            type="text"
            placeholder="Seu nome"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            error={errors.fullName}
            icon={<User size={14} />}
            autoComplete="name"
          />

          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={errors.email}
            icon={<Mail size={14} />}
            autoComplete="email"
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={14} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full h-10 pl-9 pr-10 py-2 text-sm rounded-xl border border-black/10 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
          </div>

          <Button type="submit" fullWidth loading={loading} className="mt-1">
            Criar conta grátis
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Já tem conta?{' '}
          <Link href="/auth/login" className="text-brand-500 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
