'use client'

import { useAppSession } from '@/services/user/session'
import { FullPageSpinner } from '@/shared/ui/full-page-spinner'
import { signIn } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthorizedGuard({ children }: { children: React.ReactNode }) {
  const session = useAppSession()

  const isUnauthenticated = session.status === 'unauthenticated'
  const pathname = usePathname()

  useEffect(() => {
    if (isUnauthenticated) {
      signIn()
    }
  }, [isUnauthenticated, pathname])

  const isLoading = session.status === 'loading' || session.status === 'unauthenticated'

  return (
    <>
      <FullPageSpinner isLoading={isLoading} />
      {session.status === 'authenticated' && children}
    </>
  )
}
