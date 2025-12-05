'use client'

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import {
  MuscleGroup,
  WorkoutDifficulty,
  WorkoutSection,
  WorkoutSubsection,
} from '@prisma/client'
import { toast } from 'sonner'

import { adminWorkoutsApi } from './_api'
import { PRACTICE_TYPES } from '@/features/practices/_constants/practice-types'
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
import { AdminWorkoutsTable } from './_ui/table'
import { AdminWorkoutsFilters } from './_ui/admin-workouts-filters'

import { useDebounce } from '@/shared/hooks/use-debounce'

const enumOptions = {
  difficulty: Object.values(WorkoutDifficulty),
  muscles: Object.values(MuscleGroup),
}

const muscleLabels: Record<MuscleGroup, string> = {
  LEGS: 'Ноги',
  GLUTES: 'Ягодицы',
  UPPER_BODY: 'Верхняя часть тела',
  BACK: 'Спина',
  PELVIC_FLOOR: 'Мышцы тазового дна',
  CORE: 'Кор',
}

const practiceSections = Array.from(
  new Set(PRACTICE_TYPES.map(practice => practice.section))
)

const sectionLabels = PRACTICE_TYPES.reduce<Record<WorkoutSection, string>>(
  (acc, practice) => {
    if (!acc[practice.section]) {
      acc[practice.section] = practice.title
    }
    return acc
  },
  {} as Record<WorkoutSection, string>
)

const subsectionsBySection = PRACTICE_TYPES.reduce<
  Record<WorkoutSection, WorkoutSubsection[]>
>(
  (acc, practice) => {
    acc[practice.section] = practice.subcategories.map(
      subcategory => subcategory.value
    )
    return acc
  },
  {} as Record<WorkoutSection, WorkoutSubsection[]>
)

const subsectionLabels = PRACTICE_TYPES.reduce<
  Partial<Record<WorkoutSubsection, string>>
>((acc, practice) => {
  for (const subcategory of practice.subcategories) {
    acc[subcategory.value] = subcategory.title
  }
  return acc
}, {})

type EditState = {
  id?: string
  title: string
  description: string
  videoId: string
  section: WorkoutSection
  difficulty: WorkoutDifficulty
  muscles: MuscleGroup[]
  subsections: WorkoutSubsection[]
  equipment: string
}

export function AdminWorkoutsPage() {
  const [editState, setEditState] = useState<EditState | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(
    null
  )
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | 'needsReview' | 'ready'>('all')
  const [sectionFilter, setSectionFilter] = useState<WorkoutSection | 'all'>(
    'all'
  )
  const [difficultyFilter, setDifficultyFilter] = useState<
    WorkoutDifficulty | 'all'
  >('all')
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc')
  const debouncedSearch = useDebounce(search, 300)
  const utils = adminWorkoutsApi.useUtils() as any
  const api = adminWorkoutsApi as any
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const { data, isFetchingNextPage, hasNextPage, fetchNextPage, isLoading } =
    api.adminWorkouts.workouts.list.useInfiniteQuery(
      {
        pageSize: 20,
        search: debouncedSearch,
        status,
        section: sectionFilter === 'all' ? undefined : sectionFilter,
        difficulty: difficultyFilter === 'all' ? undefined : difficultyFilter,
        sortDir,
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
    for (const page of data?.pages ?? []) {
      for (const w of page.items ?? []) {
        const key = w?.videoId || w?.id
        if (key && !seen.has(key)) {
          seen.add(key)
          result.push(w)
        }
      }
    }
    return result
  }, [data])
  const total = data?.pages?.[0]?.total ?? 0

  const workoutDetailQuery = api.adminWorkouts.workouts.get.useQuery(
    selectedWorkoutId ? { id: selectedWorkoutId } : undefined,
    { enabled: Boolean(selectedWorkoutId) }
  )

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
    },
    onError: (error: any) => {
      toast('Ошибка сохранения', { description: error?.message })
    },
  })

  const startEdit = (workout: any) => {
    setEditState({
      id: workout.id,
      title: workout.title ?? '',
      description: workout.description ?? '',
      videoId: workout.videoId,
      section: workout.section as WorkoutSection,
      difficulty: workout.difficulty as WorkoutDifficulty,
      muscles: workout.muscles ?? [],
      subsections: workout.subsections ?? [],
      equipment: Array.isArray(workout.equipment)
        ? workout.equipment.join(', ')
        : (workout.equipment ?? ''),
    })
    setSelectedWorkoutId(workout.id)
    setDialogOpen(true)
  }

  useEffect(() => {
    const workout = workoutDetailQuery.data
    if (!workout) return

    const section = workout.section as WorkoutSection
    const allowedSubsections = subsectionsBySection[section] ?? []
    const workoutSubsections = Array.isArray(workout.subsections)
      ? (workout.subsections as WorkoutSubsection[])
      : []

    setEditState({
      id: workout.id,
      title: workout.title,
      description: workout.description ?? '',
      videoId: workout.videoId,
      section,
      difficulty: workout.difficulty,
      muscles: Array.isArray(workout.muscles) ? workout.muscles : [],
      subsections: allowedSubsections.length
        ? workoutSubsections.filter(subsection =>
            allowedSubsections.includes(subsection)
          )
        : workoutSubsections,
      equipment: (workout.equipment ?? []).join(', '),
    })
  }, [workoutDetailQuery.data])

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setSelectedWorkoutId(null)
      setEditState(null)
    }
  }

  const handleSave = () => {
    if (!editState) return

    upsertMutation.mutate({
      id: editState.id,
      title: editState.title,
      description: editState.description || null,
      videoId: editState.videoId,
      section: editState.section,
      difficulty: editState.difficulty,
      muscles: editState.muscles,
      subsections: editState.subsections,
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
    () => (editState ? `Редактирование: ${editState.title}` : ''),
    [editState]
  )

  const availableSubsections: WorkoutSubsection[] = useMemo(() => {
    if (!editState) return []
    return subsectionsBySection[editState.section] ?? []
  }, [editState])

  let dialogBody: ReactNode = (
    <div className="py-6 text-center text-sm text-muted-foreground">
      Загрузка данных...
    </div>
  )
  if (!workoutDetailQuery.isLoading && editState) {
    dialogBody = (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label>Название</Label>
            <Input
              value={editState.title}
              onChange={e =>
                setEditState(prev => prev && { ...prev, title: e.target.value })
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
          <div className="space-y-2 md:col-span-2">
            <Label>Категория</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={editState.section}
              onChange={e =>
                setEditState(prev => {
                  if (!prev) return prev

                  const nextSection = e.target.value as WorkoutSection
                  const allowedSubsections =
                    subsectionsBySection[nextSection] ?? []

                  return {
                    ...prev,
                    section: nextSection,
                    subsections: prev.subsections.filter(subsection =>
                      allowedSubsections.includes(subsection)
                    ),
                  }
                })
              }
            >
              {practiceSections.map(option => (
                <option key={option} value={option}>
                  {sectionLabels[option] ?? option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Подкатегории</Label>
            {availableSubsections.length ? (
              <div className="flex flex-wrap gap-2">
                {availableSubsections.map(option => {
                  const checked = editState.subsections.includes(option)
                  return (
                    <label
                      key={option}
                      className="flex items-center gap-1 rounded border px-2 py-1 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={e => {
                          setEditState(prev => {
                            if (!prev) return prev
                            const next = new Set(prev.subsections)
                            if (e.target.checked) {
                              next.add(option)
                            } else {
                              next.delete(option)
                            }
                            return {
                              ...prev,
                              subsections: Array.from(next),
                            }
                          })
                        }}
                      />
                      {subsectionLabels[option] ?? option}
                    </label>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Для этой категории нет подкатегорий.
              </p>
            )}
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
            <Label>Мышечные группы</Label>
            <div className="flex flex-wrap gap-2">
              {enumOptions.muscles.map(option => {
                const checked = editState.muscles.includes(option)
                return (
                  <label
                    key={option}
                    className="flex items-center gap-1 rounded border px-2 py-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => {
                        setEditState(prev => {
                          if (!prev) return prev
                          const next = new Set(prev.muscles)
                          if (e.target.checked) {
                            next.add(option)
                          } else {
                            next.delete(option)
                          }
                          return { ...prev, muscles: Array.from(next) }
                        })
                      }}
                    />
                    {muscleLabels[option] ?? option}
                  </label>
                )
              })}
            </div>
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
          <Button onClick={handleSave} disabled={upsertMutation.isLoading}>
            {upsertMutation.isLoading ? 'Сохранение...' : 'Сохранить'}
          </Button>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Отмена
          </Button>
        </DialogFooter>
      </div>
    )
  }

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      }
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

      <AdminWorkoutsFilters
        filters={{
          search,
          status,
          section: sectionFilter,
          difficulty: difficultyFilter,
          sortDir,
        }}
        onChange={(key, value) => {
          if (key === 'search') setSearch(value)
          if (key === 'status') setStatus(value)
          if (key === 'section') setSectionFilter(value)
          if (key === 'difficulty') setDifficultyFilter(value)
          if (key === 'sortDir') setSortDir(value)
        }}
        onReset={() => {
          setSearch('')
          setStatus('all')
          setSectionFilter('all')
          setDifficultyFilter('all')
          setSortDir('desc')
        }}
      />

      <AdminWorkoutsTable
        data={workouts}
        total={total}
        isLoading={isLoading}
        isFetchingNextPage={isFetchingNextPage}
        hasNextPage={!!hasNextPage}
        loadMoreRef={loadMoreRef}
        onEdit={startEdit}
      />

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTitle || 'Редактирование тренировки'}
            </DialogTitle>
            {editState ? (
              <p className="text-sm text-muted-foreground">
                Video ID: {editState.videoId}
              </p>
            ) : null}
          </DialogHeader>
          {dialogBody}
        </DialogContent>
      </Dialog>
    </div>
  )
}
