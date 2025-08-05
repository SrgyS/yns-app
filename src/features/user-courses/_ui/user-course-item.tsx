'use client'

import { Course } from '@/entity/course'
import { MdxCode } from '@/shared/lib/mdx'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import Link from 'next/link'
import { CalendarDays, CheckCircle } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { UserCourseEnrollmentApi } from '@/entity/course/_domain/course'
import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { useRouter } from 'next/navigation'

interface UserCourseItemProps {
  course: Course
  enrollment: UserCourseEnrollmentApi
}

export function UserCourseItem({ course, enrollment }: UserCourseItemProps) {
  const { activateEnrollment, isActivating } = useCourseEnrollment()
  const router = useRouter()

  const handleActivate = async () => {
    await activateEnrollment(enrollment.id)
    router.refresh() // Обновляем страницу, чтобы отобразить изменения
  }



  const startDateFormatted = format(
    new Date(enrollment.startDate),
    'dd MMMM yyyy',
    { locale: ru }
  )

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{course.title}</CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays size={16} />
          <span>Начало: {startDateFormatted}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <MdxCode code={course.description} />

            {enrollment.hasFeedback && (
              <Badge variant="outline" className="bg-green-50">
                С обратной связью
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">

        {enrollment.active ? (
          <Button asChild>
            <Link href={`/day/${course.slug}`}>Перейти к тренировкам</Link>
          </Button>
        ) : (
          <Button
            onClick={handleActivate}
            disabled={isActivating}
            variant="secondary"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Выбрать курс
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
