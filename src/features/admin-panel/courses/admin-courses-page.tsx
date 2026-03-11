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
import { AppImage } from '@/shared/ui/app-image'
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
            const rawThumbnail = course.thumbnail
            const rawMain = course.image
            const hasThumb =
              Boolean(rawThumbnail) && !rawThumbnail.includes('/logo-yns')
            const hasMain =
              Boolean(rawMain) && !rawMain.includes('/logo-yns')
            const thumbnailImgSrc = hasThumb ? rawThumbnail : ''
            const mainImgSrc = hasMain ? rawMain : ''
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
                <CardHeader className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="line-clamp-2 text-lg leading-snug">
                      {course.title}
                    </CardTitle>
                    {course.draft ? (
                      <Badge variant="destructive" className="shrink-0">
                        Черновик
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="mt-auto space-y-3">
                  <div className="grid gap-3 md:grid-cols-[1.4fr_0.9fr]">
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Карточка курса
                      </span>
                      <div className="relative aspect-[4/5] overflow-hidden rounded-xl border bg-muted">
                        {hasThumb ? (
                          <AppImage
                            src={thumbnailImgSrc}
                            alt={course.title}
                            fill
                            className="object-cover object-center"
                            sizes="(max-width: 768px) 100vw, 20vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                            Миниатюра не загружена
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        Превью страницы
                      </span>
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted">
                        {hasMain ? (
                          <AppImage
                            src={mainImgSrc}
                            alt={`${course.title} основное изображение`}
                            fill
                            className="object-cover object-center"
                            sizes="(max-width: 768px) 100vw, 16vw"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">
                            Основное изображение не загружено
                          </div>
                        )}
                      </div>
                      <div className="rounded-xl border bg-muted/30 p-3">
                        <div className="space-y-1.5 rounded-lg border bg-background/80 p-3">
                          <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                            Hero
                          </span>
                          <p className="line-clamp-2 text-sm font-semibold leading-snug">
                            {course.title}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Уменьшенное превью блока страницы курса
                          </div>
                        </div>
                      </div>
                    </div>
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
