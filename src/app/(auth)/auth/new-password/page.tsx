import { Suspense } from 'react'
import { CardWrapper } from '@/features/auth/_ui/card-wrapper'
import { NewPasswordForm } from '@/features/auth/_ui/new-password-form'
import { AuthFormSkeleton } from '@/shared/ui/auth-form-skeleton'

// Компонент-обертка для клиентских компонентов с useSearchParams
function NewPasswordFormWrapper() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <NewPasswordForm />
    </Suspense>
  )
}

export default function NewPasswordPage() {
  return (
    <CardWrapper
      headerLabel="Сброс пароля"
      backButtonLabel="Назад к входу"
      backButtonHref="/auth/sign-in"
    >
      <NewPasswordFormWrapper />
    </CardWrapper>
  )
}
