import { NewVerificationForm } from '@/features/auth/_ui/new-verification-form'

//TODO: удалить, т.к. не используется magic link
export default function VerifyRequestPage() {
  return (
    <>
      <div className="container relative  flex-col items-center justify-center self-center pt-24">
        <NewVerificationForm />
      </div>
    </>
  )
}
