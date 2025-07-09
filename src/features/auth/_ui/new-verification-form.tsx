'use client'

import { Spinner } from '@/shared/ui/spinner'
import { CardWrapper } from './card-wrapper'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { authCredentialsHttpApi } from '../_api'
import { TRPCClientError } from '@trpc/client'
import { FormSuccess } from '@/shared/ui/form-success'
import { FormError } from '@/shared/ui/form-error'

export const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()

  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const onSubmit = useCallback(() => {
    if (!token) {
      setError('Токен не найден')
      return
    }

    authCredentialsHttpApi.auth.getVerificationToken
      .query(token)
      .then(response => {
        setSuccess(response.success)
        setError(undefined)
      })
      .catch(err => {
        if (err instanceof TRPCClientError) {
          setError(err.message)
        } else {
          setError('Произошла непредвиденная ошибка: ' + err.message)
        }
        setSuccess(undefined)
      })
  }, [token])

  useEffect(() => {
    onSubmit()
  }, [onSubmit])

  return (
    <CardWrapper
      headerLabel="Подтверждение"
      backButtonLabel="Назад к входу"
      backButtonHref="/auth/sign-in"
    >
      <div className="flex w-full justify-center">
        {!success && !error && (
          <Spinner className="w-10 h-10" aria-label="Подтверждение" />
        )}

        <FormSuccess message={success} />
        {!success && <FormError message={error} />}
      </div>
    </CardWrapper>
  )
}