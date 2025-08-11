import { useCourseEnrollment } from '@/features/course-enrollment/_vm/use-course-enrollment'
import { courseDetailsApi } from '@/features/course-details/_api'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { useRouter } from 'next/navigation'

interface CourseActivationBannerProps {
  courseSlug: string
  activeCourseSlug: string
  enrollmentId: string
}

export function CourseActivationBanner({
  courseSlug,
  activeCourseSlug,
  enrollmentId,
}: CourseActivationBannerProps) {
  const { activateEnrollment, isActivating } = useCourseEnrollment()
  const router = useRouter()
  
  // Получаем информацию о текущем курсе
  const { data: currentCourse } = courseDetailsApi.courseDetails.get.useQuery({
    courseSlug
  })
  // Получаем информацию об активном курсе
  const { data: activeCourse } = courseDetailsApi.courseDetails.get.useQuery({
    courseSlug: activeCourseSlug
  })

  const handleActivate = async () => {
    try {
      await activateEnrollment(enrollmentId)
      // Обновляем страницу для применения изменений
      router.refresh()
    } catch (error) {
      console.error('Ошибка при активации курса:', error)
    }
  }

  return (
    <Alert className="mb-4">
      <AlertTitle>Режим просмотра</AlertTitle>
      <AlertDescription className="flex flex-col gap-2">
        <p>
          Активный: <strong>{activeCourse?.title}</strong>. 
          Вы на курсе <strong>{currentCourse?.title}</strong>.
        </p>
        <div className="flex gap-2 mt-2">
          <Button 
            onClick={handleActivate} 
            disabled={isActivating}
            variant="default"
            size="sm"
          >
            Сделать активным
          </Button>
          {/* <Button 
            variant="outline" 
            size="sm"
          >
            Остаться в просмотре
          </Button> */}
        </div>
      </AlertDescription>
    </Alert>
  )
}