'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { WorkoutDifficulty, WorkoutSection, WorkoutType } from '@prisma/client'
import { toast } from 'sonner'

import { adminWorkoutsApi } from './_api'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

const enumOptions = {
  type: Object.values(WorkoutType),
  section: Object.values(WorkoutSection),
  difficulty: Object.values(WorkoutDifficulty),
}

type EditState = {
  id?: string
  slug: string
  title: string
  description: string
  videoId: string
  type: WorkoutType
  section: WorkoutSection
  difficulty: WorkoutDifficulty
  muscles: string
  subsections: string
  equipment: string
}

export function AdminWorkoutsPage() {
  const [editState, setEditState] = useState<EditState | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const utils = adminWorkoutsApi.useUtils() as any
  const api = adminWorkoutsApi as any
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const { data, isFetchingNextPage, hasNextPage, fetchNextPage } =
    api.adminWorkouts.workouts.list.useInfiniteQuery(
      {
        pageSize: 20,
      },
      {
        initialCursor: 1,
        getNextPageParam: (lastPage: any) =>
          lastPage.page * lastPage.pageSize < lastPage.total
            ? lastPage.page + 1
            : undefined,
      }
    )

  const workouts = useMemo(() => {
    const seen = new Set<string>()
    const result: any[] = []
    ;(data?.pages ?? []).forEach((page: any) => {
      ;(page.items ?? []).forEach((w: any) => {
        const key = w?.videoId || w?.slug || w?.id
        if (key && !seen.has(key)) {
          seen.add(key)
          result.push(w)
        }
      })
    })
    return result
  }, [data])
  const total = data?.pages?.[0]?.total ?? 0

  const syncMutation = api.adminWorkouts.workouts.sync.useMutation({
    onSuccess: (result: {
      created: number
      updated: number
      skippedManual: number
    }) => {
      toast('Синхронизация завершена', {
        description: `Создано: ${result.created}, обновлено: ${result.updated}, пропущено (ручные): ${result.skippedManual}`,
      })
      utils.adminWorkouts.workouts.list.invalidate()
    },
    onError: (error: any) => {
      toast('Ошибка синхронизации', { description: error?.message })
    },
  })

  const upsertMutation = api.adminWorkouts.workouts.upsert.useMutation({
    onSuccess: () => {
      toast('Тренировка сохранена')
      utils.adminWorkouts.workouts.list.invalidate()
      setEditState(null)
    },
    onError: (error: any) => {
      toast('Ошибка сохранения', { description: error?.message })
    },
  })

  const startEdit = (workout: any) => {
    setEditState({
      id: workout.id,
      slug: workout.slug,
      title: workout.title,
      description: workout.description ?? '',
      videoId: workout.videoId,
      type: workout.type,
      section: workout.section,
      difficulty: workout.difficulty,
      muscles: (workout.muscles ?? []).join(', '),
      subsections: (workout.subsections ?? []).join(', '),
      equipment: (workout.equipment ?? []).join(', '),
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!editState) return

    upsertMutation.mutate({
      id: editState.id,
      slug: editState.slug,
      title: editState.title,
      description: editState.description || null,
      videoId: editState.videoId,
      type: editState.type,
      section: editState.section,
      difficulty: editState.difficulty,
      muscles: editState.muscles
        ? editState.muscles
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
      subsections: editState.subsections
        ? editState.subsections
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
      equipment: editState.equipment
        ? editState.equipment
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [],
    })
    setDialogOpen(false)
  }

  const selectedTitle = useMemo(
    () =>
      editState ? `Редактирование: ${editState.title || editState.slug}` : '',
    [editState]
  )

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      })
    })

    observer.observe(target)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Тренировки</h1>
          <p className="text-muted-foreground">
            Синхронизация с Kinescope и ручное приведение к требуемой схеме.
          </p>
        </div>
        <Button
          disabled={syncMutation.isLoading}
          onClick={() =>
            syncMutation.mutate({
              overwriteManuallyEdited: false,
              folderId: undefined,
            })
          }
        >
          {syncMutation.isLoading
            ? 'Загрузка...'
            : 'Загрузить видео из Kinescope'}
        </Button>
      </div>

      <AdminWorkoutsTable
        data={workouts}
        total={total}
        isFetchingNextPage={isFetchingNextPage}
        loadMoreRef={loadMoreRef}
        onEdit={startEdit}
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTitle || 'Редактирование тренировки'}
            </DialogTitle>
          </DialogHeader>
          {editState ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={editState.slug} readOnly />
                </div>
                <div className="space-y-2">
                  <Label>Video ID</Label>
                  <Input value={editState.videoId} readOnly />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Название</Label>
                  <Input
                    value={editState.title}
                    onChange={e =>
                      setEditState(
                        prev => prev && { ...prev, title: e.target.value }
                      )
                    }
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Описание</Label>
                  <Textarea
                    value={editState.description}
                    onChange={e =>
                      setEditState(
                        prev => prev && { ...prev, description: e.target.value }
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Тип</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={editState.type}
                    onChange={e =>
                      setEditState(
                        prev =>
                          prev && {
                            ...prev,
                            type: e.target.value as WorkoutType,
                          }
                      )
                    }
                  >
                    {enumOptions.type.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Секция</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={editState.section}
                    onChange={e =>
                      setEditState(
                        prev =>
                          prev && {
                            ...prev,
                            section: e.target.value as WorkoutSection,
                          }
                      )
                    }
                  >
                    {enumOptions.section.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Сложность</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={editState.difficulty}
                    onChange={e =>
                      setEditState(
                        prev =>
                          prev && {
                            ...prev,
                            difficulty: e.target.value as WorkoutDifficulty,
                          }
                      )
                    }
                  >
                    {enumOptions.difficulty.map(option => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Мышечные группы (через запятую)</Label>
                  <Input
                    value={editState.muscles}
                    onChange={e =>
                      setEditState(
                        prev => prev && { ...prev, muscles: e.target.value }
                      )
                    }
                    placeholder="LEGS, BACK"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Подсекции (через запятую)</Label>
                  <Input
                    value={editState.subsections}
                    onChange={e =>
                      setEditState(
                        prev => prev && { ...prev, subsections: e.target.value }
                      )
                    }
                    placeholder="WARMUP, ..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Инвентарь (через запятую)</Label>
                  <Input
                    value={editState.equipment}
                    onChange={e =>
                      setEditState(
                        prev => prev && { ...prev, equipment: e.target.value }
                      )
                    }
                    placeholder="коврик, резинка"
                  />
                </div>
              </div>
              <DialogFooter className="justify-start space-x-2">
                <Button
                  onClick={handleSave}
                  disabled={upsertMutation.isLoading}
                >
                  {upsertMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Отмена
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
import { AdminWorkoutsTable } from './_ui/table'
