import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatLayoutClient from '@/components/layout/ChatLayoutClient'

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, title, updated_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(30)

  return (
    <ChatLayoutClient conversations={conversations || []}>
      {children}
    </ChatLayoutClient>
  )
}
