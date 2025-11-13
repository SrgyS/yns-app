import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/shared/ui/sidebar'

import { AdminPanelSidebar } from '@/features/sidebar/admin-panel-sidebar'

export default async function Layout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session?.user) {
    redirect('/auth/sign-in')
  }

  const role = session.user.role
  const canAccessAdmin = role === 'ADMIN' || role === 'STAFF'

  if (!canAccessAdmin) {
    redirect('/')
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <AdminPanelSidebar user={session.user} />
        <SidebarInset className="flex min-h-screen flex-1 flex-col">
          <SidebarTrigger />
          <div className="flex-1 px-4 py-4">{children}</div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
