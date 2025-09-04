'use client'
import { Button } from '@/shared/ui/button'
import Link from 'next/link'
import { CourseId, CourseSlug } from '@/kernel/domain/course'
import { type CourseAction } from '../_domain/types'
import { useCourseAction } from '../_vm/use-course-action'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

export function CourseAction({
  courseId,
  courseSlug,
}: {
  courseId: CourseId
  courseSlug: CourseSlug
}) {
  const action = useCourseAction(courseId, courseSlug)

  if (action.type === 'pending') {
    return <Skeleton className="h-10 w-40 rounded-md" />
  }

  if (action.type === 'buy') {
    return (
      <Button size={'lg'} asChild>
        <Link href={action.href}>
          Купить за {new Intl.NumberFormat('ru-RU').format(action.price)}₽
        </Link>
      </Button>
    )
  }

  if (action.type === 'comming-soon') {
    return (
      <Button disabled variant={'default'} size={'lg'}>
        Курс ещё в разработке
      </Button>
    )
  }

  if (action.type === 'enter') {
    return (
      <Button size={'lg'}>
        <Link href={action.href}>Продолжить</Link>
      </Button>
    )
  }

  return null
}
