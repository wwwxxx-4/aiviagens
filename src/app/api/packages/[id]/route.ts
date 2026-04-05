import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { error } = await supabase
    .from('travel_packages')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return new Response(error.message, { status: 500 })
  return new Response(null, { status: 204 })
}
