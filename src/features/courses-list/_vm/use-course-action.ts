import { CourseId, CourseSlug } from '@/kernel/domain/course'
import { coursesListApi } from '../_api'
import { usePathname } from 'next/navigation'
import { getCourseOrderPath } from '@/kernel/lib/router'

export function useCourseAction(courseId: CourseId, courseSlug: CourseSlug) {
  const pathname = usePathname()

  const { data: action, isPending } =
    coursesListApi.coursesList.getAction.useQuery({
      courseId: courseId,
    })

  if (isPending || !action) {
    return {
      type: 'pending',
    } as const
  }

  if (action.type === 'buy') {
    return { ...action, href: getCourseOrderPath(courseSlug, pathname) }
  }

  if (action.type === 'setup') {
    return { ...action, href: `/platform/select-workout-days/${courseId}` }
  }

  if (action.type === 'enter') {
    return { ...action, href: `/platform/day/${courseSlug}` }
  }

  return action
}
