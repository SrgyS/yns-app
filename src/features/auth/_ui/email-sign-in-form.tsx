'use client'

import { useSearchParams, useRouter } from 'next/navigation'
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
import { emailSignInSchema } from '../schemas'
import { FormError } from '@/shared/ui/form-error'
import { AUTH_MESSAGES } from '@/shared/constants'
import { FormSuccess } from '@/shared/ui/form-success'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { DEAFAULT_LOGIN_REDIRECT } from '@/shared/config/public'

type EmailSignInFormValues = z.infer<typeof emailSignInSchema>

export function EmailSignInForm() {
  const router = useRouter()

  const searchParams = useSearchParams()
  const callBackUrl = searchParams.get('callbackUrl')

  const errorUrl =
    searchParams.get('error') === 'OAuthAccountNotLinked'
      ? 'Email уже используется'
      : ''
  const [error, setError] = useState<string | undefined>()
  const [success, setSuccess] = useState<string | undefined>()
  const [isPending, startTransition] = useTransition()

  const form = useForm<EmailSignInFormValues>({
    resolver: zodResolver(emailSignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // const emailSignIn = useEmailSignIn()

  const handleSubmit = form.handleSubmit(async data => {
    setError('')
    setSuccess('')

    startTransition(async () => {
      try {
        const res = await signIn('credentials', {
          ...data,
          callbackUrl: callBackUrl || DEAFAULT_LOGIN_REDIRECT,
        })

        if (res && res.error) {
          if (res.error === 'EmailUnverified') {
            setSuccess(AUTH_MESSAGES.EmailUnverified)
          } else {
            const errorMessage =
              AUTH_MESSAGES[res.error] || 'Ошибка авторизации'
            setError(errorMessage)
          }
        } else if (res && res.ok && res.url) {
          router.push(res.url)
        }
      } catch {
        setError('Что-то пошло не так. Попробуйте позже.')
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
                    placeholder="name@example.com"
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
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="gap-0">
                <FormLabel className="sr-only">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="******"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="password"
                    autoCorrect="off"
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <Button
                  size="sm"
                  variant="link"
                  asChild
                  className="p-0 mr-auto font-normal"
                >
                  <Link href="/auth/password-reset">Забыли пароль?</Link>
                </Button>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormError message={error || errorUrl} />
          <FormSuccess message={success} />
          <Button disabled={isPending} className="cursor-pointer">
            {isPending && (
              <Spinner className="mr-2 h-4 w-4 " aria-label="Загрузка выхода" />
            )}
            Войти
          </Button>
        </div>
      </form>
    </Form>
  )
}
