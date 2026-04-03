import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ChatWindowWithHistory } from '@/components/chat/ChatWindowWithHistory'

interface ChatPageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: ChatPageProps) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('conversations').select('title').eq('id', params.id).single()
  return { title: data?.title || 'Conversa' }
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, user_id, title')
    .eq('id', params.id)
    .single()

  if (!conversation || conversation.user_id !== user.id) notFound()

  // Load existing messages to pre-populate chat
  const { data: messages } = await supabase
    .from('messages')
    .select('id, role, content, metadata, created_at')
    .eq('conversation_id', params.id)
    .order('created_at', { ascending: true })

  return (
    <ChatWindowWithHistory
      conversationId={params.id}
      initialMessages={messages || []}
    />
  )
}
