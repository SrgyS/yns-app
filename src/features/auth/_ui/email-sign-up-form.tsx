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
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { emailSignUpSchema } from '../schemas'
import { useCredentialsSignUp } from '../_vm/use-credentials-sign-up'

type EmailSignUpFormValues = z.infer<typeof emailSignUpSchema>

export function EmailSignUpForm() {
  const form = useForm<EmailSignUpFormValues>({
    resolver: zodResolver(emailSignUpSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  })

  const credentialsSignUp = useCredentialsSignUp()

  const handleSubmit = form.handleSubmit(async data => {
    await credentialsSignUp.credentialsSignUp(data)
  })

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ваше имя"
                    autoCapitalize="none"
                    autoCorrect="off"
                    disabled={credentialsSignUp.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
                    disabled={credentialsSignUp.isPending}
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
                    disabled={credentialsSignUp.isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={credentialsSignUp.isPending}>
            {credentialsSignUp.isPending && (
              <Spinner className="mr-2 h-4 w-4 " aria-label="Загрузка выхода" />
            )}
            Создать аккаунт
          </Button>
        </div>
      </form>
    </Form>
  )
}
