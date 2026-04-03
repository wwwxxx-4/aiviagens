'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, MessageSquare, Briefcase, User, LogOut, Plus, Settings, FileText } from 'lucide-react'
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
  { href: '/dashboard/agent', label: 'Modo Agente', icon: FileText },
  { href: '/dashboard/profile', label: 'Perfil', icon: User },
  { href: '/dashboard/settings', label: 'Configurações', icon: Settings },
]

export default function DashboardSidebar({ profile }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

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
    <aside className="w-60 min-h-screen bg-white border-r border-black/5 flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-black/5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
            <Globe size={14} className="text-white" />
          </div>
          <span className="font-display text-sm font-semibold text-brand-700 leading-tight">
            Inteligência<br />Viagens
          </span>
        </Link>
      </div>

      {/* New chat CTA */}
      <div className="p-4">
        <Link
          href="/chat/new"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={14} />
          Nova viagem
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4">
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
  )
}
