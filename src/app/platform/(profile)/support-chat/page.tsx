import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { SupportChatUserPage } from '@/features/support-chat/user-chat/_ui/support-chat-user-page'
import { isSupportChatEnabled } from '@/features/support-chat'

export default async function SupportChatPage() {
  if (!isSupportChatEnabled()) {
    redirect('/platform/profile')
  }

  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  if (session.user.role !== 'USER') {
    redirect('/admin/support-chat')
  }

  return <SupportChatUserPage />
}
