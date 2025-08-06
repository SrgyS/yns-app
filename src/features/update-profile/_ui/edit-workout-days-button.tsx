import { useState, useEffect } from "react"
import Link from "next/link"
import { Edit } from "lucide-react"
import { Button } from "@/shared/ui/button"
import { useCourseEnrollment } from "@/features/course-enrollment/_vm/use-course-enrollment"
import { useAppSession } from "@/kernel/lib/next-auth/client"


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

      
        
          <Button asChild variant="outline" >
            <Link href={`/edit-workout-days/${enrollments[0].id}`}>
             <Edit className="mr-2 h-4 w-4" />
              Изменить дни 
            </Link>
          </Button>
      

  )
}