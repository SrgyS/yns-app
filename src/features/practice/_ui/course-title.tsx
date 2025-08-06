import { courseDetailsApi } from "@/features/course-details/_api"
import { Skeleton } from "@/shared/ui/skeleton"


export function CourseTitle({ courseSlug }: { courseSlug: string }) {
  const { data: courseDetails, isLoading } = courseDetailsApi.courseDetails.get.useQuery({
    courseSlug
  })

  if (isLoading) {
    return <Skeleton className="h-6 w-[300px]"/>
  }

  return (
    <h1 className="text-xl font-bold mb-4">Курс: {courseDetails?.title}</h1>
  )
}