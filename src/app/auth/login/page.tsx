'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!email) { setErrors(p => ({ ...p, email: 'Informe seu e-mail' })); return }
    if (!password) { setErrors(p => ({ ...p, password: 'Informe sua senha' })); return }

    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (error) {
      if (error.message.includes('Invalid login')) {
        setErrors({ general: 'E-mail ou senha incorretos.' })
      } else {
        setErrors({ general: error.message })
      }
      return
    }

    toast.success('Bem-vindo de volta!')
    router.push(next)
    router.refresh()
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    })
    if (error) {
      toast.error('Erro ao conectar com Google.')
      setGoogleLoading(false)
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
          Bem-vindo de volta
        </h1>
        <p className="text-gray-500 text-sm">
          Entre na sua conta para continuar planejando
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
        {/* Google OAuth */}
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

        {/* Email/password form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

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
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <Link href="/auth/forgot-password" className="text-xs text-brand-500 hover:underline">
                Esqueci a senha
              </Link>
            </div>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={14} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
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
            Entrar
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Não tem conta?{' '}
          <Link href="/auth/register" className="text-brand-500 font-medium hover:underline">
            Criar conta grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
