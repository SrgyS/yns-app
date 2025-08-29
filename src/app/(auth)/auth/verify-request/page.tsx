import { Suspense } from 'react'
import { CardWrapper } from '@/features/auth/_ui/card-wrapper'
import { AuthFormSkeleton } from '@/shared/ui/skeleton/auth-form-skeleton'
import { NewVerificationForm } from '@/features/auth/_ui/new-verification-form'

// Компонент-обертка для клиентских компонентов с useSearchParams
function NewVerificationFormWrapper() {
  return (
    <Suspense fallback={<AuthFormSkeleton />}>
      <NewVerificationForm />
    </Suspense>
  )
}
export default function VerifyRequestPage() {
  return (
    <>
      <CardWrapper
        headerLabel="Подтверждение"
        backButtonLabel="Назад к входу"
        backButtonHref="/auth/sign-in"
      >
        <NewVerificationFormWrapper />
      </CardWrapper>
    </>
  )
}
