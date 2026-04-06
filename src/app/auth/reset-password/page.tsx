'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [sessionReady, setSessionReady] = useState(false)

  const supabase = createClient()

  // Verifica se o usuário tem sessão ativa (via link do email)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSessionReady(true)
      } else {
        // Sem sessão — link expirado ou inválido
        setError('Link de redefinição inválido ou expirado. Solicite um novo.')
      }
    })
  }, [])

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!password || password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    setDone(true)

    // Redireciona ao dashboard após 3 segundos
    setTimeout(() => router.push('/dashboard'), 3000)
  }

  // Sucesso
  if (done) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={28} className="text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">
          Senha redefinida!
        </h2>
        <p className="text-gray-500 text-sm mb-2">
          Sua senha foi atualizada com sucesso.
        </p>
        <p className="text-gray-400 text-xs">
          Redirecionando para o dashboard...
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
          Nova senha
        </h1>
        <p className="text-gray-500 text-sm">
          Escolha uma senha forte para sua conta.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
        {/* Link expirado / sem sessão */}
        {!sessionReady && error && (
          <div className="text-center py-4">
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-4 text-sm text-red-600 mb-4">
              {error}
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push('/auth/forgot-password')}
            >
              Solicitar novo link
            </Button>
          </div>
        )}

        {/* Formulário de nova senha */}
        {sessionReady && (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Nova senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Nova senha</label>
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
            </div>

            {/* Confirmar senha */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Confirmar senha</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock size={14} />
                </div>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repita a nova senha"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="w-full h-10 pl-9 pr-10 py-2 text-sm rounded-xl border border-black/10 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* Indicador de correspondência */}
              {confirm && (
                <p className={`text-xs ${password === confirm ? 'text-green-500' : 'text-red-500'}`}>
                  {password === confirm ? '✓ Senhas coincidem' : '✗ Senhas não coincidem'}
                </p>
              )}
            </div>

            <Button type="submit" fullWidth loading={loading} className="mt-1">
              Salvar nova senha
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
