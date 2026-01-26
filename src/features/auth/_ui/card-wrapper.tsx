import { Card, CardHeader, CardContent, CardFooter } from '@/shared/ui/card'

import { BackButton } from './back-button'
import React from 'react'
// import Link from 'next/link'

interface CardWrapperProps {
  children: React.ReactNode
  headerLabel: string
  backButtonLabel: string
  backButtonHref: string
  showOauthProviders?: boolean
  showPolicy?: boolean
}

export const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  // showPolicy,
}: CardWrapperProps) => {
  return (
    <div className="container relative  flex-col items-center justify-center self-center pt-24">
      <Card className="max-w-[350px] mx-auto">
        <CardHeader className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight self-center">
            {headerLabel}
          </h1>
        </CardHeader>
        <CardContent className="grid gap-4">
          {children}
          {/* {showPolicy && (
            <p className="px-0 text-center text-sm text-muted-foreground">
              Нажимая зарегистрироваться вы соглашаетесь с{' '}
              <Link
                href="/order"
                className="underline underline-offset-4 hover:text-primary"
              >
                договором-офертой
              </Link>{' '}
              и{' '}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Политикой конфиденциальности
              </Link>
            </p>
          )} */}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <BackButton href={backButtonHref} label={backButtonLabel} />
        </CardFooter>
      </Card>
    </div>
  )
}
