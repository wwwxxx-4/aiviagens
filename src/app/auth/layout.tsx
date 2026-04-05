import Link from 'next/link'
import { Globe } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Acesse sua conta',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F8FF] flex flex-col">
      {/* Header simples */}
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center group-hover:bg-brand-600 transition-colors">
            <Globe size={16} className="text-white" />
          </div>
          <span className="font-display text-base font-semibold text-brand-700">
            Inteligência Viagens
          </span>
        </Link>
      </header>

      {/* Conteúdo central */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-xs text-gray-400">
          Ao usar o serviço, você concorda com nossos{' '}
          <a href="#" className="text-brand-500 hover:underline">termos de uso</a>
          {' '}e{' '}
          <a href="#" className="text-brand-500 hover:underline">política de privacidade</a>.
        </p>
      </footer>
    </div>
  )
}
