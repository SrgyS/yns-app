'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  WorkoutDifficulty,
  WorkoutSection,
} from '@prisma/client'
import { toast } from 'sonner'

import { adminWorkoutsApi } from './_api'
import { Button } from '@/shared/ui/button'
import { AdminWorkoutsTable } from './_ui/table'
import { AdminWorkoutsFilters } from './_ui/admin-workouts-filters'

import { useDebounce } from '@/shared/hooks/use-debounce'
import { WorkoutEditDialog } from './_ui/workout-edit-dialog'

export function AdminWorkoutsPage() {
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
  const utils = adminWorkoutsApi.useUtils()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  const { data, isFetchingNextPage, hasNextPage, fetchNextPage, isLoading } =
    adminWorkoutsApi.adminWorkouts.workouts.list.useInfiniteQuery(
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

  const syncMutation = adminWorkoutsApi.adminWorkouts.workouts.sync.useMutation({
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

  const startEdit = (workout: any) => {
    setSelectedWorkoutId(workout.id)
    setDialogOpen(true)
  }

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setSelectedWorkoutId(null)
    }
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
          disabled={syncMutation.isPending}
          onClick={() =>
            syncMutation.mutate({
              overwriteManuallyEdited: false,
              folderId: undefined,
            })
          }
        >
          {syncMutation.isPending
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

      <WorkoutEditDialog
        workoutId={selectedWorkoutId}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
      />
    </div>
  )
}
