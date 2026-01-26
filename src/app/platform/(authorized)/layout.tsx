import { redirect } from 'next/navigation'

import { server } from '@/app/server'
import { SessionService } from '@/kernel/lib/next-auth/module'

export default async function PlatformAuthorizedLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const sessionService = server.get(SessionService)
  const session = await sessionService.get()

  if (!session?.user?.id) {
    redirect('/auth/sign-in')
  }

  return <>{children}</>
}
