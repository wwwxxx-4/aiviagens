'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, MessageSquare, Briefcase, User, LogOut, Plus, Settings, Menu, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/types'
import toast from 'react-hot-toast'

interface DashboardSidebarProps {
  profile: UserProfile | null
}

const navItems = [
  { href: '/dashboard', label: 'Início', icon: Globe, exact: true },
  { href: '/chat', label: 'Chat IA', icon: MessageSquare },
  { href: '/dashboard/packages', label: 'Minhas viagens', icon: Briefcase },
  { href: '/dashboard/profile', label: 'Perfil', icon: User },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

export default function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    toast.success('Até logo!')
    router.push('/')
    router.refresh()
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : profile?.email?.[0]?.toUpperCase() ?? 'U'

  return (
    <>
      {/* ─── Hamburger button (mobile only) ────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-9 h-9 rounded-xl bg-white border border-black/10 shadow-sm flex items-center justify-center text-gray-600 hover:text-brand-600 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={18} />
      </button>

      {/* ─── Overlay (mobile only) ─────────────────────────── */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ─── Sidebar ────────────────────────────────────────── */}
      <aside className={cn(
        'w-60 bg-white border-r border-black/5 flex flex-col shrink-0 z-50 transition-transform duration-300 ease-in-out',
        // Mobile: fixed, slide in/out
        'fixed inset-y-0 left-0',
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
        // Desktop: always visible, in flow
        'md:relative md:inset-auto md:translate-x-0 md:shadow-none'
      )}>

        {/* Close btn (mobile only) */}
        <button
          onClick={() => setOpen(false)}
          className="md:hidden absolute top-4 right-4 w-7 h-7 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
        >
          <X size={15} />
        </button>

        {/* Logo */}
        <div className="p-5 border-b border-black/5">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
              <Globe size={14} className="text-white" />
            </div>
            <span className="font-display text-sm font-semibold text-brand-700 leading-tight">
              AI Mesquita<br />Turismo
            </span>
          </Link>
        </div>

        {/* New chat CTA */}
        <div className="p-4">
          <Link
            href="/chat/new"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            <Plus size={14} />
            Nova viagem
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pb-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map(item => {
              const Icon = item.icon
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon size={16} className={isActive ? 'text-brand-500' : 'text-gray-400'} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-black/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand-700 shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {profile?.full_name || 'Usuário'}
              </p>
              <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <LogOut size={12} />
            Sair da conta
          </button>
        </div>
      </aside>
    </>
  )
}
