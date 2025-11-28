'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Course } from '@/entities/course'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { OptimizedImage } from '@/shared/ui/optimized-image'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { adminCoursesApi } from './_api'

type AdminCoursesPageProps = {
  courses: Course[]
}

export function AdminCoursesPage({ courses }: Readonly<AdminCoursesPageProps>) {
  const router = useRouter()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const deleteMutation = adminCoursesApi.adminCourses.course.delete.useMutation(
    {
      onSuccess: () => {
        toast.success('Курс удален')
        setConfirmOpen(false)
        setSelectedCourseId(null)
        router.refresh()
      },
      onError: () => {
        toast.error('Не удалось удалить курс')
      },
    }
  )

  const openConfirm = (courseId: string) => {
    setSelectedCourseId(courseId)
    setConfirmOpen(true)
  }

  const handleDelete = () => {
    if (!selectedCourseId) return

    deleteMutation.mutate({ id: selectedCourseId })
  }

  const selectedCourse = courses.find(course => course.id === selectedCourseId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Курсы</h1>
          <p className="text-muted-foreground">
            Все доступные курсы платформы. Выберите курс, для редактирования.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/courses/new">Создать курс</Link>
        </Button>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Курсов пока нет.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map(course => {
            const imageSrc = course.thumbnail || '/logo-yns.png'

            return (
              <Card key={course.id} className="flex flex-col overflow-hidden">
                <div className="relative h-40 w-full bg-muted">
                  <OptimizedImage
                    src={imageSrc}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    priority
                  />
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="line-clamp-2">
                    {course.title}{' '}
                    {course.draft ? (
                      <Badge variant="destructive">Черновик</Badge>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        course.product.access === 'paid' ? 'default' : 'outline'
                      }
                    >
                      {course.product.access === 'paid'
                        ? 'Платный'
                        : 'Бесплатный'}
                    </Badge>
                    <Badge variant="secondary">
                      {course.contentType === 'SUBSCRIPTION'
                        ? 'Подписка'
                        : 'Фиксированный'}
                    </Badge>
                    <Badge variant="outline">{course.durationWeeks} нед.</Badge>
                  </div>
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/admin/courses/${course.slug}`}>Открыть</Link>
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => openConfirm(course.id)}
                    disabled={deleteMutation.isPending}
                  >
                    Удалить
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить курс?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {selectedCourse
              ? `Вы уверены, что хотите удалить курс "${selectedCourse.title}"?`
              : 'Вы уверены, что хотите удалить этот курс?'}
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending || !selectedCourseId}
            >
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
