import { CardWrapper } from '@/features/auth/_ui/card-wrapper'
import { ResetPasswordForm } from '@/features/auth/_ui/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <CardWrapper
      headerLabel="Забыли пароль?"
      backButtonLabel="Назад к входу"
      backButtonHref="/auth/sign-in"
    >
      <ResetPasswordForm />
    </CardWrapper>
  )
}
