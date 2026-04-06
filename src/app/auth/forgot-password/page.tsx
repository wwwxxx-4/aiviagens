'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Informe seu e-mail'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      // Após trocar o code por sessão, redireciona para página de nova senha
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setDone(true)
  }

  if (done) {
    return (
      <div className="animate-fade-in text-center">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-6">
          <Mail size={28} className="text-brand-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">E-mail enviado</h2>
        <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
          Se esse e-mail estiver cadastrado, você receberá as instruções em breve.
        </p>
        <Link href="/auth/login">
          <Button variant="secondary">
            <ArrowLeft size={14} />
            Voltar ao login
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Recuperar senha</h1>
        <p className="text-gray-500 text-sm">Enviaremos um link para redefinir sua senha.</p>
      </div>
      <div className="bg-white rounded-2xl border border-black/5 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          <Input
            label="E-mail cadastrado"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            icon={<Mail size={14} />}
          />
          <Button type="submit" fullWidth loading={loading}>Enviar link de recuperação</Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/auth/login" className="text-brand-500 hover:underline inline-flex items-center gap-1">
            <ArrowLeft size={12} /> Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}
