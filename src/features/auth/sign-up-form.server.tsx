'use server'

import { getProviders } from 'next-auth/react'
import { cn } from '@/shared/ui/utils'
import { Divider } from './_ui/divider'
import { ProviderButton } from './_ui/provider-button'
import { EmailSignUpForm } from './_ui/email-sign-up-form'

export async function SignUpForm({ className }: { className?: string }) {
  const providers = await getProviders()
  const oauthProviders = Object.values(providers ?? {}).filter(
    provider => provider.type === 'oauth'
  )

  return (
    <div className={cn('grid gap-6', className)}>
      <EmailSignUpForm />
      <Divider />
      {oauthProviders.map(provider => (
        <ProviderButton key={provider.id} provider={provider} />
      ))}
    </div>
  )
}
