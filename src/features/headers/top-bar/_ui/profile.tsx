'use client'

import Link from 'next/link'

// import { useSignOut } from '@/features/auth/use-sign-out'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { SignInButton } from '@/features/auth/_ui/sign-in-button'

import { useAppSession } from '@/kernel/lib/next-auth/client'
import { ProfileAvatar } from '@/entities/user/client'

export function Profile() {
  const session = useAppSession()

  if (session.status === 'loading') {
    return <Skeleton className="w-8 h-8 rounded-full" />
  }

  if (session.status === 'unauthenticated') {
    return <SignInButton />
  }

  const user = session?.data?.user

  return (
    <Link href="/platform/profile">
      <ProfileAvatar profile={user} className="w-8 h-8" />
    </Link>
  )
}
