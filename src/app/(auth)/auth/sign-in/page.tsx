import { AuthFormSkeleton } from '@/shared/ui/auth-form-skeleton'

import { CardWrapper } from '@/features/auth/_ui/card-wrapper'
import { SignInForm } from '@/features/auth/sign-in-form.server'

import { Suspense } from 'react'

// Компонент-обертка для клиентских компонентов с useSearchParams
function SignInFormWrapper({
  showOauthProviders,
}: {
  showOauthProviders?: boolean
}) {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <SignInForm showOauthProviders={showOauthProviders} />
    </Suspense>
  )
}

export default function SignInPage() {
  return (
    <CardWrapper
      headerLabel="Авторизация"
      backButtonLabel="Зарегистрироваться"
      backButtonHref="/auth/sign-up"
    >
      <SignInFormWrapper showOauthProviders />
    </CardWrapper>
  )
}
