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
    <SidebarProvider className="h-dvh min-h-dvh">
      <AdminPanelSidebar user={session.user} />
      <SidebarInset className="min-h-0 overflow-hidden">
        <div className="mx-1 mt-1 shrink-0">
          <SidebarTrigger className="cursor-pointer" />
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2 pb-2 pt-2">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
