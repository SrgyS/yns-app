'use client'

import { CalendarTabs } from '@/features/practice/_ui/calendar-tabs'
import { Button } from '@/shared/ui/button'
import { Suspense, use } from 'react'
import { Skeleton } from '@/shared/ui/skeleton'
import { CourseTitle } from '@/features/practice/_ui/course-title'

interface DayPageProps {
  params: Promise<{
    courseSlug: string
  }>
}

export default function DayPage({ params }: DayPageProps) {
  const resolvedParams = use(params)
  
  return (
    <main className="flex flex-col space-y-6 py-4 container max-w-[600px]">
      <Suspense fallback={<Skeleton className="h-6 w-[300px]"/>}>
        <CourseTitle courseSlug={resolvedParams.courseSlug} />
      </Suspense>
      <CalendarTabs />
      <Button variant="outline">Варианты питания</Button>
    </main>
  )
}