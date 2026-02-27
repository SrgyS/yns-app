import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import { isSupportChatEnabled } from '@/features/support-chat'

export default async function PlatformProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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

  return (
    <div className="h-dvh flex flex-col bg-background">
      <main className="flex-1 container overflow-auto px-3 py-6 sm:px-6">
        {children}
      </main>
    </div>
  )
}
