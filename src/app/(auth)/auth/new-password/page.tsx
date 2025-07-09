'use client'

import dynamic from 'next/dynamic'

const NewPasswordForm = dynamic(
  () =>
    import('@/features/auth/_ui/new-password-form').then(
      mod => mod.NewPasswordForm
    ),
  { ssr: false }
)

const CardWrapper = dynamic(
  () =>
    import('@/features/auth/_ui/card-wrapper').then(
      mod => mod.CardWrapper
    ),
  { ssr: false }
)

export default function NewPasswordPage() {
  return (
    <CardWrapper
      headerLabel="Сброс пароля"
      backButtonLabel="Назад к входу"
      backButtonHref="/auth/sign-in"
    >
      <NewPasswordForm />
    </CardWrapper>
  )
}
