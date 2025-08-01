import { Button } from "@/shared/ui/button"
import Link from "next/link"
import { useCourseEnrollment } from "@/features/course-enrollment/_vm/use-course-enrollment"
import { useAppSession } from "@/kernel/lib/next-auth/client"
import { useState, useEffect } from "react"

export const EditWorkoutDaysButton = () => {
  const { data: session } = useAppSession()
  const { getUserEnrollments } = useCourseEnrollment()
  const [enrollments, setEnrollments] = useState<Array<{ id: string; courseId: string; courseTitle: string }>>([])

  // Используем query hook для получения enrollment
  const enrollmentsQuery = getUserEnrollments(session?.user?.id || '')

  useEffect(() => {
    if (enrollmentsQuery.data) {
      setEnrollments(enrollmentsQuery.data.map(enrollment => ({
        id: enrollment.id,
        courseId: enrollment.courseId,
        courseTitle: `Курс ${enrollment.courseId}` // Пока используем ID курса, позже можно добавить получение названия
      })))
    }
  }, [enrollmentsQuery.data])

  if (enrollmentsQuery.isLoading) {
    return <div>Загрузка...</div>
  }

  if (enrollments.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {enrollments.map((enrollment) => (
          <Button key={enrollment.id} asChild variant="outline" className="w-full justify-start">
            <Link href={`/edit-workout-days/${enrollment.id}`}>
              Изменить дни тренировок
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}