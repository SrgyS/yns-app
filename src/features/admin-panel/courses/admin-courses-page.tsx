'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Course } from '@/entities/course'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { selectDefaultCourseTariff } from '@/kernel/domain/course'
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
import { Switch } from '@/shared/ui/switch'

type AdminCoursesPageProps = {
  courses: Course[]
}

export function AdminCoursesPage({ courses }: Readonly<AdminCoursesPageProps>) {
  const router = useRouter()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingDraftId, setPendingDraftId] = useState<string | null>(null)
  const [pendingShowRecipesId, setPendingShowRecipesId] = useState<
    string | null
  >(null)
  const toggleDraft = adminCoursesApi.adminCourses.course.setDraft.useMutation({
    onSuccess: updated => {
      toast.success(
        updated.draft ? 'Курс переведён в черновик' : 'Курс опубликован'
      )
      router.refresh()
    },
    onError: (error: any) => {
      toast.error(error?.message ?? 'Не удалось изменить статус')
    },
    onMutate: variables => {
      setPendingDraftId(variables.id)
    },
    onSettled: () => {
      setPendingDraftId(null)
    },
  })
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

  const toggleShowRecipes =
    adminCoursesApi.adminCourses.course.setShowRecipes.useMutation({
      onSuccess: () => {
        toast.success('Отображение рецептов обновлено')
        router.refresh()
      },
      onError: (error: any) => {
        toast.error(error?.message ?? 'Не удалось обновить флаг рецептов')
      },
      onMutate: variables => {
        setPendingShowRecipesId(variables.id)
      },
      onSettled: () => {
        setPendingShowRecipesId(null)
      },
    })

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
            const thumbnailImgSrc = course.thumbnail
            const mainImgSrc = course.image
            const hasThumb =
              Boolean(thumbnailImgSrc) && !thumbnailImgSrc.includes('/logo-yns')
            const hasMain =
              Boolean(mainImgSrc) && !mainImgSrc.includes('/logo-yns')
            const isDraftMutating =
              toggleDraft.isPending && pendingDraftId === course.id
            let publishLabel: string
            if (isDraftMutating) {
              publishLabel = 'Сохранение...'
            } else if (course.draft) {
              publishLabel = 'Разместить'
            } else {
              publishLabel = 'Сделать черновиком'
            }
            const isShowRecipesMutating =
              toggleShowRecipes.isPending && pendingShowRecipesId === course.id

            return (
              <Card key={course.id} className="flex flex-col overflow-hidden">
                <div className="relative h-40 w-full bg-muted flex items-center justify-center">
                  {hasThumb ? (
                    <OptimizedImage
                      src={thumbnailImgSrc}
                      alt={course.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Миниатюра не загружена
                    </span>
                  )}
                </div>
                <CardHeader className="space-y-2">
                  <CardTitle className="line-clamp-2">
                    {course.title}{' '}
                    {course.draft ? (
                      <Badge variant="destructive">Черновик</Badge>
                    ) : null}
                  </CardTitle>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <div className="rounded-md border bg-muted/50 p-2 text-xs leading-tight space-y-1">
                    <div>
                      <span className="text-muted-foreground">Миниатюра: </span>
                      {hasThumb ? (
                        <span className="break-all text-foreground">
                          {thumbnailImgSrc}
                        </span>
                      ) : (
                        <span className="text-destructive">не загружено</span>
                      )}
                    </div>
                    <div>
                      <span className="text-muted-foreground">
                        Основное изображение:{' '}
                      </span>
                      {hasMain ? (
                        <span className="break-all text-foreground">
                          {mainImgSrc}
                        </span>
                      ) : (
                        <span className="text-destructive">не загружено</span>
                      )}
                    </div>
                    {hasMain && (
                      <div className="mt-2 relative w-full aspect-4/3 max-h-40 overflow-hidden rounded bg-background">
                        <OptimizedImage
                          src={mainImgSrc}
                          alt={`${course.title} основное изображение`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        selectDefaultCourseTariff(course.tariffs)?.access ===
                        'paid'
                          ? 'default'
                          : 'outline'
                      }
                    >
                      {selectDefaultCourseTariff(course.tariffs)?.access ===
                      'paid'
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
                  <div className="flex flex-col gap-2">
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/admin/courses/${course.slug}`}>
                        Редактировать параметры курса
                      </Link>
                    </Button>
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/admin/knowledge?courseId=${course.id}`}>
                        Редактировать раздел знания
                      </Link>
                    </Button>
                    <Button asChild className="w-full" variant="outline">
                      <Link href={`/admin/courses/${course.slug}/daily-plan`}>
                        Редактировать план тренировок
                      </Link>
                    </Button>
                    <Button
                      className="w-full"
                      variant={course.draft ? 'default' : 'outline'}
                      disabled={toggleDraft.isPending}
                      onClick={() =>
                        toggleDraft.mutate({
                          id: course.id,
                          draft: !course.draft,
                        })
                      }
                    >
                      {publishLabel}
                    </Button>
                    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span className="text-muted-foreground">
                        Показывать рецепты
                      </span>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={course.showRecipes}
                          onCheckedChange={checked =>
                            toggleShowRecipes.mutate({
                              id: course.id,
                              showRecipes: Boolean(checked),
                            })
                          }
                          disabled={isShowRecipesMutating}
                          aria-label="Переключить отображение рецептов"
                        />
                      </div>
                    </div>
                  </div>
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
