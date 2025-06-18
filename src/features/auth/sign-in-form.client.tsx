'use client'

import { cn } from '@/shared/ui/utils'
import { EmailSignInForm } from './_ui/email-sign-in-form'
import { Divider } from './_ui/divider'
import { ProviderButton } from './_ui/provider-button'
import type { LiteralUnion, ClientSafeProvider } from 'next-auth/react'
import type { BuiltInProviderType } from 'next-auth/providers'

type SignInFormClientProps = {
  providers?: Record<LiteralUnion<BuiltInProviderType, string>, ClientSafeProvider>
  className?: string
}

export function SignInFormClient({ providers, className }: SignInFormClientProps) {
  const oauthProviders = Object.values(providers ?? {}).filter(
    provider => provider.type === 'oauth'
  )

  return (
    <div className={cn('grid gap-6', className)}>
      <EmailSignInForm />
      <Divider />
      {oauthProviders.map(provider => (
        <ProviderButton key={provider.id} provider={provider} />
      ))}
    </div>
  )
}
