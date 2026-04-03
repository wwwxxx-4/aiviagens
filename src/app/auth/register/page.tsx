'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
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

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      toast.error('Erro ao conectar com Google.')
      setGoogleLoading(false)
    }
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
        <Button
          variant="secondary"
          fullWidth
          loading={googleLoading}
          onClick={handleGoogleLogin}
          className="mb-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar com Google
        </Button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-black/5" />
          <span className="text-xs text-gray-400">ou</span>
          <div className="flex-1 h-px bg-black/5" />
        </div>

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
