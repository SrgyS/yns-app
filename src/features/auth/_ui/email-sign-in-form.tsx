'use client'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import { useForm } from 'react-hook-form'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Spinner } from '@/shared/ui/spinner'
import { useEmailSignIn } from '../_vm/use-email-sign-in'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { emailSignInSchema } from '../schemas'
import { useState } from 'react'
import { FormError } from '@/shared/ui/form-error'

type EmailSignInFormValues = z.infer<typeof emailSignInSchema>

export function EmailSignInForm() {
  const [error, setError] = useState<string | undefined>()

  const form = useForm<EmailSignInFormValues>({
    resolver: zodResolver(emailSignInSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const emailSignIn = useEmailSignIn()

  const handleSubmit = form.handleSubmit(async data => {
    setError('')
    const res = await emailSignIn.signIn(data)
    if (res && res.error) {
      setError('Неверный email или пароль')
    }
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-2">
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
                    disabled={emailSignIn.isPending}
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
              <FormItem>
                <FormLabel className="sr-only">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="******"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="password"
                    autoCorrect="off"
                    disabled={emailSignIn.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormError message={error} />
          <Button disabled={emailSignIn.isPending}>
            {emailSignIn.isPending && (
              <Spinner className="mr-2 h-4 w-4 " aria-label="Загрузка выхода" />
            )}
            Войти через Email
          </Button>
        </div>
      </form>
    </Form>
  )
}
