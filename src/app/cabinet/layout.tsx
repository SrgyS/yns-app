import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'
import AuthorizedGuard from '@/features/auth/authorized-guard'
import { DesktopHeader } from '@/features/desktop-header/desktop-header'

export default async function CabinetLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  return (
    <AuthorizedGuard>
      <div className="min-h-screen bg-background">
        <DesktopHeader variant="cabinet" />
        <main className="container mx-auto px-6 py-8">{children}</main>
      </div>
    </AuthorizedGuard>
  )
}
