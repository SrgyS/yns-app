'use client'
import { SharedSession } from '@/kernel/domain/user'
import { useSession } from 'next-auth/react'
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export const useAppSession = useSession

// export const useRole = () => {
//   const session = useAppSession()
//   return session?.data?.user?.role
// }

export function AppSessionProvider({
  children,
}: {
  children?: React.ReactNode
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}

export function useAbbility<T>(abilityFactory: (session: SharedSession) => T) {
  const session = useAppSession()

  if (session.status === 'authenticated') {
    return abilityFactory(session.data)
  }
  return null
}