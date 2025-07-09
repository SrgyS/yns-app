import { AuthFormSkeleton } from '@/shared/ui/auth-form-skeleton'
import { CardWrapper } from '@/features/auth/_ui/card-wrapper'
import { SignUpForm } from '@/features/auth/sign-up-form.server'

import { Suspense } from 'react'

// Компонент-обертка для клиентских компонентов с useSearchParams
function SignUpFormWrapper({
  showOauthProviders,
}: {
  showOauthProviders?: boolean
}) {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <SignUpForm showOauthProviders={showOauthProviders} />
    </Suspense>
  )
}

export default function SignInPage() {
  return (
    <CardWrapper
      headerLabel="Создать аккаунт"
      backButtonLabel="Есть аккаунт? Войти"
      backButtonHref="/auth/sign-in"
      showPolicy
    >
      <SignUpFormWrapper showOauthProviders />
    </CardWrapper>
  )
}
