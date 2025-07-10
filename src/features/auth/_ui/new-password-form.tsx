'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Spinner } from '@/shared/ui/spinner'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { newPasswordSchema } from '../schemas'
import { FormError } from '@/shared/ui/form-error'
import { FormSuccess } from '@/shared/ui/form-success'
import { authCredentialsHttpApi } from '../_api'
import { TRPCClientError } from '@trpc/client'

type NewPasswordFormValues = z.infer<typeof newPasswordSchema>

export function NewPasswordForm() {
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  const form = useForm<NewPasswordFormValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: '',
    },
  })

  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const handleSubmit = form.handleSubmit(async data => {
    setError('')
    setSuccess('')

    if (!token) {
      setError('Token не найден')
      return
    }

    startTransition(async () => {
      try {
        const res = await authCredentialsHttpApi.auth.newPassword.mutate({
          password: data.password,
          token,
        })
        setSuccess(res.success)
      } catch (err) {
        if (err instanceof TRPCClientError) {
          setError(err.message)
        } else {
          setError('Что-то пошло не так. Попробуйте позже.')
        }
      }
    })
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Введите новый пароль"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="password"
                    autoCorrect="off"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormError message={error} />
          <FormSuccess message={success} />
          <Button disabled={isPending} className="cursor-pointer">
            {isPending && (
              <Spinner className="mr-2 h-4 w-4 " aria-label="Загрузка выхода" />
            )}
            Установить новый пароль
          </Button>
        </div>
      </form>
    </Form>
  )
}
