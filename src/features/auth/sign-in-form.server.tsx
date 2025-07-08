'use server'

import { getProviders } from 'next-auth/react'
import { cn } from '@/shared/ui/utils'
import { EmailSignInForm } from './_ui/email-sign-in-form'
import { Divider } from './_ui/divider'
import { ProviderButton } from './_ui/provider-button'
import { TestEmailSignInForm } from './_ui/test-email-sign-in-form'
import { privateConfig } from '@/shared/config/private'

const testToken = privateConfig.TEST_EMAIL_TOKEN

export async function SignInForm({
  className,
  showOauthProviders,
}: {
  className?: string
  showOauthProviders?: boolean
}) {
  const providers = await getProviders()
  const oauthProviders = Object.values(providers ?? {}).filter(
    provider => provider.type === 'oauth'
  )

  return (
    <div className={cn('grid gap-6', className)}>
      {testToken ? (
        <TestEmailSignInForm testToken={testToken} />
      ) : (
        <EmailSignInForm />
      )}
      {showOauthProviders && (
        <>
          <Divider />{' '}
          {oauthProviders.map(provider => (
            <ProviderButton key={provider.id} provider={provider} />
          ))}
        </>
      )}
    </div>
  )
}
