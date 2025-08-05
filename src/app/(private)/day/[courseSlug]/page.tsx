'use client'

import { CalendarTabs } from '@/features/practice/_ui/calendar-tabs'
import { Button } from '@/shared/ui/button'
import { courseDetailsApi } from '@/features/course-details/_api'
import { Suspense, use } from 'react'

interface DayPageProps {
  params: Promise<{
    courseSlug: string
  }>
}

export default function DayPage({ params }: DayPageProps) {
  const resolvedParams = use(params)
  
  return (
    <main className="flex flex-col space-y-6 py-14 container max-w-[600px]">
      <Suspense fallback={<div>Загрузка...</div>}>
        <CourseTitle courseSlug={resolvedParams.courseSlug} />
      </Suspense>
      <CalendarTabs />
      <Button variant="outline">Варианты питания</Button>
    </main>
  )
}

function CourseTitle({ courseSlug }: { courseSlug: string }) {
  const { data: courseDetails, isLoading } = courseDetailsApi.courseDetails.get.useQuery({
    courseSlug
  })

  if (isLoading) {
    return <div>Загрузка...</div>
  }

  return (
    <h1 className="text-2xl mb-4">Курс: {courseDetails?.title}</h1>
  )
}
