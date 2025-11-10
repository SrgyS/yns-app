'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/shared/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Логирование ошибки на сервер
    console.error('Ошибка при редактировании дней тренировок:', error)
  }, [error])

  return (
    <main className="flex flex-col justify-center space-y-6 py-14 container max-w-[800px]">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Что-то пошло не так</h1>
        <p className="mt-4">
          Произошла ошибка при загрузке страницы редактирования дней тренировок.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button onClick={reset} variant="outline">
            Попробовать снова
          </Button>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground shadow hover:bg-secondary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Вернуться на главную
          </Link>
        </div>
      </div>
    </main>
  )
}