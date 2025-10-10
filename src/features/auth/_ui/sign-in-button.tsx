'use client'

import { Button, buttonVariants } from '@/shared/ui/button'
import { LogIn } from 'lucide-react'
import { signIn } from 'next-auth/react'
import type { VariantProps } from 'class-variance-authority'
import type { ReactNode } from 'react'

type SignInButtonProps = {
  className?: string
  variant?: VariantProps<typeof buttonVariants>['variant']
  size?: VariantProps<typeof buttonVariants>['size']
  asChild?: boolean
  children?: ReactNode
}

export function SignInButton({
  className,
  variant = 'outline',
  size = 'default',
  asChild = false,
  children,
}: SignInButtonProps = {}) {
  const handleSignIn = () => signIn()

  return (
    <Button
      variant={variant}
      size={size}
      asChild={asChild}
      onClick={handleSignIn}
      className={className}
    >
      {children ?? (
        <>
          <LogIn className="mr-2 h-4 w-4" /> Войти
        </>
      )}
    </Button>
  )
}
