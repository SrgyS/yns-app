import { BackButton } from '@/features/auth/_ui/back-button'
import { SignUpForm } from '@/features/auth/sign-up-form.server'
import { Card, CardContent, CardFooter, CardHeader } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'
import Link from 'next/link'
import { Suspense } from 'react'

// Skeleton для формы входа
function SignInFormSkeleton() {
  return (
    <div className="grid gap-6">
      {/* Email форма skeleton */}
      <div className="grid gap-2">
        {/* Email input skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
        {/* Submit button skeleton */}
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Разделитель skeleton */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Skeleton className="w-full h-px" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <Skeleton className="bg-background px-2 text-muted-foreground w-16 h-4" />
        </div>
      </div>

      {/* OAuth кнопки skeleton - Google*/}
      <div className="grid gap-2">
        <Skeleton className="h-10 w-full" />
        {/* <Skeleton className="h-10 w-full" /> */}
      </div>
    </div>
  )
}

// Компонент-обертка для клиентских компонентов с useSearchParams
function SignInFormWrapper() {
  return (
    <Suspense fallback={<SignInFormSkeleton />}>
      <SignUpForm />
    </Suspense>
  )
}

export default function RegisterPage() {
  return (
    <>
      <div className="container relative  flex-col items-center justify-center self-center pt-24">
        <Card className="max-w-[350px] mx-auto">
          <CardHeader className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Регистрация
            </h1>
          </CardHeader>
          <CardContent className="grid gap-4">
            <SignInFormWrapper />
            <p className="px-0 text-center text-sm text-muted-foreground">
              Нажимая &ldquo;Cоздать аккаунт&ldquo; вы соглашаетесь с<br />
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Пользовательским соглашением
              </Link>{' '}
              и{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Политикой конфиденциальности
              </Link>
              .
            </p>
          </CardContent>
             <CardFooter className="flex flex-col space-y-2">
            <BackButton href="/auth/sign-in" label="Есть аккаунт? Войти" />
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
