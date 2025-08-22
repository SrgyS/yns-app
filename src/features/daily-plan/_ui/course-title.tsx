import { courseDetailsApi } from "@/features/course-details/_api"
import { Skeleton } from "@/shared/ui/skeleton"
import { useCourseEnrollment } from "@/features/course-enrollment/_vm/use-course-enrollment"
import { useAppSession } from "@/kernel/lib/next-auth/client"
import { Badge } from "@/shared/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select"
import { useRouter } from "next/navigation"

export function CourseTitle({ courseSlug }: { courseSlug: string }) {
  const router = useRouter()
  const { data: session } = useAppSession()
  const { data: courseDetails, isLoading } = courseDetailsApi.courseDetails.get.useQuery({
    courseSlug
  })
  
  const { getUserEnrollments, getActiveEnrollment } = useCourseEnrollment()
  const enrollmentsQuery = getUserEnrollments(session?.user?.id || '')
  const activeEnrollmentQuery = getActiveEnrollment(session?.user?.id || '')
  
  const enrollments = enrollmentsQuery?.data || []
  const activeEnrollment = activeEnrollmentQuery?.data
  
  const isActive = activeEnrollment?.courseId === courseDetails?.id

  const handleCourseChange = (courseSlug: string) => {
    router.push(`/day/${courseSlug}`)
  }

  if (isLoading) {
    return <Skeleton className="h-6 w-[300px]"/>
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">Курс:</h1>
        <Select value={courseSlug} onValueChange={handleCourseChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Выберите курс" />
          </SelectTrigger>
          <SelectContent>
            {enrollments.map(enrollment => (
              enrollment.course ? (
                <SelectItem key={enrollment.id} value={enrollment.course.slug}>
                  {enrollment.course.title}
                </SelectItem>
              ) : null
            ))}
          </SelectContent>
        </Select>
        {isActive && <Badge variant="outline">по умолчанию</Badge>}
      </div>
    </div>
  )
}