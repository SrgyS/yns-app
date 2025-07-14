'use client'

import { useState } from 'react'
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
  signIn(provider.id, {
    callbackUrl: callBackUrl || DEAFAULT_LOGIN_REDIRECT,
  })
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
