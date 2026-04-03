import { ChatWindow } from '@/components/chat/ChatWindow'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Nova viagem' }

export default function NewChatPage() {
  return <ChatWindow />
}
