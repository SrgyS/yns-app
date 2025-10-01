'use client'

import { useAppSession } from '@/kernel/lib/next-auth/client'
import { FullPageSpinner } from '@/shared/ui/full-page-spinner'
import { signIn } from 'next-auth/react'
import { useEffect, useRef } from 'react'

export default function AuthorizedGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const session = useAppSession()

  const isUnauthenticated = session.status === 'unauthenticated'

  // Запоминаем, что пользователь уже был аутентифицирован в текущей сессии рендера.
  const hadAuthenticatedRef = useRef(false)
  useEffect(() => {
    if (session.status === 'authenticated') {
      hadAuthenticatedRef.current = true
    }
  }, [session.status])

  useEffect(() => {
    if (isUnauthenticated) {
      signIn()
    }
  }, [isUnauthenticated])

  // Показываем полноэкранный спиннер только:
  // - пока статус ещё не определён на первом монтировании (loading и не было authenticated)
  // - либо при явной неавторизованности
  const showSpinner =
    session.status === 'unauthenticated' ||
    (session.status === 'loading' && !hadAuthenticatedRef.current)

  // Сохраняем контент на экране, если ранее уже был authenticated,
  // даже если сейчас статус временно loading (например, после updateSession)
  const canRenderChildren =
    session.status === 'authenticated' ||
    (hadAuthenticatedRef.current && session.status === 'loading')

  return (
    <>
      <FullPageSpinner isLoading={showSpinner} />
      {canRenderChildren && children}
    </>
  )
}
