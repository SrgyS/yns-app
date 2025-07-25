'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
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
import { resetPasswordSchema } from '../schemas'
import { FormError } from '@/shared/ui/form-error'
import { FormSuccess } from '@/shared/ui/form-success'
import { authCredentialsHttpApi } from '../_api'
import { TRPCClientError } from '@trpc/client'

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const handleSubmit = form.handleSubmit(async data => {
    setError('')
    setSuccess('')

    startTransition(async () => {
      try {
        const res = await authCredentialsHttpApi.auth.resetPassword.mutate(data)
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="email@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
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
            Сбросить пароль
          </Button>
        </div>
      </form>
    </Form>
  )
}
