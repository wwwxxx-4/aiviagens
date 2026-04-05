'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Globe, Plus, MessageSquare, Trash2, AlertCircle, Menu, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Conversation { id: string; title: string; updated_at: string }

interface ChatLayoutClientProps {
  conversations: Conversation[]
  children: React.ReactNode
}

export default function ChatLayoutClient({ conversations: initial, children }: ChatLayoutClientProps) {
  const [convs, setConvs] = useState(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/conversations/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setConvs(p => p.filter(c => c.id !== id))
        if (pathname === `/chat/${id}`) router.push('/chat/new')
      }
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-black/5">
        <Link href="/dashboard" className="flex items-center gap-2 mb-4" onClick={() => setSidebarOpen(false)}>
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <Globe size={14} className="text-white" />
          </div>
          <span className="font-display text-sm font-semibold text-brand-700">Inteligência Viagens</span>
        </Link>
        <Link href="/chat/new"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">
          <Plus size={14} /> Nova viagem
        </Link>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs text-gray-400 font-medium px-2 mb-2 uppercase tracking-wide">Conversas</p>
        {convs.length > 0 ? (
          <ul className="space-y-0.5">
            {convs.map(conv => {
              const isActive = pathname === `/chat/${conv.id}`
              const isConfirming = confirmId === conv.id
              return (
                <li key={conv.id} className="group relative">
                  {isConfirming ? (
                    <div className="flex items-center gap-1 px-2 py-2 rounded-xl bg-red-50 border border-red-100">
                      <AlertCircle size={11} className="text-red-400 shrink-0" />
                      <span className="text-xs text-red-600 flex-1">Excluir?</span>
                      <button
                        onClick={() => handleDelete(conv.id)}
                        disabled={deletingId === conv.id}
                        className="text-xs font-semibold text-red-600 hover:text-red-800 px-1"
                      >
                        {deletingId === conv.id ? '...' : 'Sim'}
                      </button>
                      <button onClick={() => setConfirmId(null)} className="text-xs text-gray-400 hover:text-gray-600 px-1">Não</button>
                    </div>
                  ) : (
                    <div className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all',
                      isActive ? 'bg-brand-50' : 'hover:bg-gray-50'
                    )}>
                      <Link href={`/chat/${conv.id}`} className="flex-1 min-w-0" onClick={() => setSidebarOpen(false)}>
                        <p className={cn('truncate text-xs font-medium leading-tight', isActive ? 'text-brand-700' : 'text-gray-600')}>{conv.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDate(conv.updated_at, 'dd/MM/yy')}</p>
                      </Link>
                      <button
                        onClick={() => setConfirmId(conv.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all shrink-0"
                        title="Excluir conversa"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="text-center py-8">
            <MessageSquare size={24} className="text-gray-200 mx-auto mb-2" />
            <p className="text-xs text-gray-400">Nenhuma conversa ainda</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-black/5">
        <Link href="/dashboard" onClick={() => setSidebarOpen(false)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">← Voltar ao dashboard</Link>
      </div>
    </>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#FDFAF5]">

      {/* ─── Hamburger (mobile only) ───────────────────────── */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-9 h-9 rounded-xl bg-white border border-black/10 shadow-sm flex items-center justify-center text-gray-600 hover:text-brand-600 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>

      {/* ─── Overlay (mobile) ─────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─────────────────────────────────────── */}
      <aside className={cn(
        'w-64 bg-white border-r border-black/5 flex flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out',
        // Mobile: fixed slide-in
        'fixed inset-y-0 left-0',
        sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        // Desktop: always visible, in flow
        'md:relative md:inset-auto md:translate-x-0 md:shadow-none'
      )}>
        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-4 right-4 w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
        >
          <X size={15} />
        </button>
        <SidebarContent />
      </aside>

      {/* ─── Main content ─────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-hidden">{children}</main>
    </div>
  )
}
