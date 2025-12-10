'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { adminCoursesApi } from '@/features/admin-panel/courses/_api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { KnowledgeCategoriesList } from './_ui/categories-list'

export function AdminKnowledgePage() {
  const searchParams = useSearchParams()
  const initialCourseId = searchParams?.get('courseId')
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(initialCourseId)

  useEffect(() => {
    if (initialCourseId) {
       setSelectedCourseId(initialCourseId)
    }
  }, [initialCourseId])

  const { data: courses, isLoading } = adminCoursesApi.adminCourses.course.list.useQuery()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">База знаний</h1>
        <p className="text-muted-foreground">
          Управление статьями и материалами внутри курсов.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Курсы</CardTitle>
              <CardDescription>Выберите курс для настройки</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {isLoading && <div className="text-sm text-muted-foreground">Загрузка...</div>}
              {courses?.map(course => (
                <Button
                  key={course.id}
                  variant={selectedCourseId === course.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCourseId(course.id)}
                >
                  {course.title}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {selectedCourseId ? (
            <KnowledgeCategoriesList courseId={selectedCourseId} />
          ) : (
            <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed text-muted-foreground">
              Выберите курс слева
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
