'use client'

import { useEffect, useState } from 'react'
import { ClientSafeProvider, signIn } from 'next-auth/react'
import { Github, Globe } from 'lucide-react'
import { DEAFAULT_LOGIN_REDIRECT } from '@/shared/config/public'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { useSearchParams } from 'next/navigation'

export function ProviderButton({ provider }: { provider: ClientSafeProvider }) {
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  const callBackUrl = searchParams.get('callbackUrl')

  useEffect(() => {
    const resetLoading = () => {
      setIsLoading(false)
    }

    window.addEventListener('pageshow', resetLoading)

    return () => {
      window.removeEventListener('pageshow', resetLoading)
    }
  }, [])

  const getIcon = (provider: ClientSafeProvider) => {
    switch (provider.id) {
      case 'github':
        return <Github className="mr-2 h-4 w-4" />
      case 'google':
        return <Globe className="mr-2 h-4 w-4" />
      default:
        return null
    }
  }

  const oauthSignIn = () => {
    setIsLoading(true)
    const authParams =
      provider.id === 'google' ? { prompt: 'select_account' } : undefined

    signIn(
      provider.id,
      {
        callbackUrl: callBackUrl || DEAFAULT_LOGIN_REDIRECT,
      },
      authParams
    )
  }

  return (
    <Button
      variant="outline"
      type="button"
      disabled={isLoading}
      onClick={oauthSignIn}
      className="cursor-pointer"
    >
      {isLoading ? (
        <Spinner className="mr-2 h-4 w-4 animate-spin" aria-label="Вход" />
      ) : (
        getIcon(provider)
      )}
      {provider.name}
    </Button>
  )
}
