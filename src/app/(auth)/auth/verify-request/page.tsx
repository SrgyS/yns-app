'use client'

import dynamic from 'next/dynamic'

const NewVerificationForm = dynamic(
  () =>
    import('@/features/auth/_ui/new-verification-form').then(
      mod => mod.NewVerificationForm
    ),
  { ssr: false }
)

export default function VerifyRequestPage() {
  return (
    <>
      <div className="container relative  flex-col items-center justify-center self-center pt-24">
        <NewVerificationForm />
      </div>
    </>
  )
}
