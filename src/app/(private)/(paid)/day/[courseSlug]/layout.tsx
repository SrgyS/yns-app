import { ReactNode } from 'react'

import { CheckAccessGuard } from '@/features/course-enrollment/_vm/check-access-guard'
import { CourseSlug } from '@/kernel/domain/course'

type LayoutProps = {
  children: ReactNode
  params: Promise<{
    courseSlug: CourseSlug
  }>
}

export default async function CourseDayLayout({
  children,
  params,
}: LayoutProps) {
  const { courseSlug } = await params

  return (
    <CheckAccessGuard courseSlug={courseSlug}>
      {children}
    </CheckAccessGuard>
  )
}
