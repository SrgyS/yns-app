'use client'

import { Button } from '@/shared/ui/button'
import { LogIn } from 'lucide-react'
import { signIn } from 'next-auth/react'

export function SignInButton() {
  const handleSignIn = () => signIn()

  return (
    <Button variant={'outline'} onClick={handleSignIn}>
      <LogIn className="mr-2 h-4 w-4" /> Войти
    </Button>
  )
}
