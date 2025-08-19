'use client'

import { useRouter } from 'next/navigation'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import Link from 'next/link'
import { Skeleton } from '@/shared/ui/skeleton'
import { useEffect } from 'react'

export default function DayPage() {
  const router = useRouter()
  const { data: session } = useAppSession()
  const { getUserEnrollments, getActiveEnrollment } = useCourseEnrollment()

  // Получаем все записи пользователя на курсы
  const enrollmentsQuery = getUserEnrollments(session?.user?.id || '')
  
  // Получаем активную запись на курс
  const activeEnrollmentQuery = getActiveEnrollment(session?.user?.id || '')

  useEffect(() => {
    // Если данные загружены и есть активный курс, перенаправляем на его страницу
    if (activeEnrollmentQuery.data?.course?.slug) {
      router.push(`/day/${activeEnrollmentQuery.data.course.slug}`)
    }
  }, [activeEnrollmentQuery.data, router])

  // Если данные загружаются, показываем скелетон
  if (enrollmentsQuery.isLoading || activeEnrollmentQuery.isLoading) {
    return (
      <main className="flex flex-col space-y-6 py-4 container max-w-[600px]">
        <Skeleton className="h-6 w-[300px]" />
        <Skeleton className="h-[400px] w-full" />
      </main>
    )
  }

  // Если у пользователя есть курсы, но нет активного
  if (enrollmentsQuery.data && enrollmentsQuery.data.length > 0) {
    return (
      <main className="flex flex-col space-y-6 py-4 container max-w-[600px]">
        <Alert>
          <AlertTitle>Выберите активный курс</AlertTitle>
          <AlertDescription>
            У вас есть несколько курсов. Выберите один из них, чтобы начать тренировки.
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4">
          {enrollmentsQuery.data.map((enrollment) => (
            <Button 
              key={enrollment.id} 
              onClick={() => {
                if (enrollment.course?.slug) {
                  router.push(`/day/${enrollment.course.slug}`)
                }
              }}
              variant="outline"
              className="justify-start"
            >
              {enrollment.course?.title || 'Курс без названия'}
            </Button>
          ))}
        </div>
      </main>
    )
  }

  // Если у пользователя нет курсов
  return (
    <main className="flex flex-col space-y-6 py-4 container max-w-[600px]">
      <Alert>
        <AlertTitle>У вас нет активных курсов</AlertTitle>
        <AlertDescription>
          Приобретите курс, чтобы начать тренировки.
        </AlertDescription>
      </Alert>
      <Button>
        <Link href="/">Выбрать курс</Link>
      </Button>
    </main>
  )
}