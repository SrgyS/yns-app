import { DEAFAULT_LOGIN_REDIRECT } from '@/shared/config/public'
import { useMutation } from '@tanstack/react-query'
import { signIn } from 'next-auth/react'
// import { useSearchParams } from 'next/navigation'

export function useEmailSignIn() {
  // const searchParams = useSearchParams()
  // const callbackUrl = searchParams.get('callbackUrl')

  const emailSignInMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string
      password: string
    }) => {
      return await signIn('credentials', {
        email,
        password,
        callbackUrl: DEAFAULT_LOGIN_REDIRECT,
      })
    },
  })

  return {
    isPending: emailSignInMutation.isPending,
    signIn: emailSignInMutation.mutateAsync,
  }
}
