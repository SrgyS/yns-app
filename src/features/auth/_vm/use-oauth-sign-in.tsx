import { DEAFAULT_LOGIN_REDIRECT } from '@/shared/config/public'
import { useMutation } from '@tanstack/react-query'
import { ClientSafeProvider, signIn } from 'next-auth/react'
// import { useSearchParams } from 'next/navigation'

export function useOAuthSignIn(provider: ClientSafeProvider) {
  // const searchParams = useSearchParams()
  // const callbackUrl = searchParams.get('callbackUrl')

  const oauthSignInMutation = useMutation({
    mutationFn: () =>
      signIn(provider.id, {
        callbackUrl: DEAFAULT_LOGIN_REDIRECT,
      }),
  })

  return {
    isPending: oauthSignInMutation.isPending,
    signIn: oauthSignInMutation.mutate,
  }
}
