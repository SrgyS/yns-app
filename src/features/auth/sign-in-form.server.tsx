'use server'

import { getProviders } from 'next-auth/react'
import { SignInFormClient } from './sign-in-form.client'

export async function SignInFormServer({ className }: { className?: string }) {
  const providers = await getProviders()
  return <SignInFormClient providers={providers} className={className} />
}
