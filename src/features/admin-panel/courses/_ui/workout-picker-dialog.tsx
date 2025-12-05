import React, { useEffect, useMemo, useRef, useState } from 'react'
import { WorkoutSection } from '@prisma/client'

import { adminWorkoutsApi } from '@/features/admin-panel/workouts/_api'
import { useDebounce } from '@/shared/hooks/use-debounce'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Spinner } from '@/shared/ui/spinner'
import { cn } from '@/shared/ui/utils'
import { formatDuration } from '@/shared/lib/format-duration'
import { LoadMoreHint } from '@/shared/ui/load-more-hint'
import Image from 'next/image'

export type WorkoutSummary = {
  id: string
  title: string
  section?: string | null
  durationSec?: number | null
  posterUrl?: string | null
}

type Props = Readonly<{
  open: boolean
  kind: 'warmup' | 'main'
  onClose: () => void
  onSelect: (workout: WorkoutSummary) => void
  sectionFilter?: 'all' | WorkoutSection
}>

const sectionLabels: Record<string, string> = {
  [WorkoutSection.STRENGTH]: 'Силовые',
  [WorkoutSection.CORRECTION]: 'Коррекция осанки',
  [WorkoutSection.FUNCTIONAL]: 'Функциональные',
  [WorkoutSection.WARMUP]: 'Зарядки',
  [WorkoutSection.PAIN]: 'Решает боль',
}

export function WorkoutPickerDialog({
  open,
  kind,
  onClose,
  onSelect,
  sectionFilter: initialSection = 'all',
}: Props) {
  const [sectionFilter, setSectionFilter] = useState<'all' | WorkoutSection>(
    initialSection
  )
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 200)

  const workoutsQuery =
    adminWorkoutsApi.adminWorkouts.workouts.list.useInfiniteQuery(
      {
        pageSize: 20,
        search: debouncedSearch,
        status: 'ready',
        section: sectionFilter === 'all' ? undefined : sectionFilter,
        sortDir: 'asc',
      },
      {
        initialCursor: 1,
        getNextPageParam: last =>
          last.page * last.pageSize < last.total ? last.page + 1 : undefined,
      }
    )

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const isFetchingMore = workoutsQuery.isFetching && !workoutsQuery.isLoading

  useEffect(() => {
    setSelectedId(null)
  }, [open, debouncedSearch, sectionFilter])

  const workouts = useMemo(() => {
    const seen = new Set<string>()
    const acc: WorkoutSummary[] = []
    for (const page of workoutsQuery.data?.pages ?? []) {
      for (const item of page.items ?? []) {
        if (!seen.has(item.id)) {
          seen.add(item.id)
          acc.push(item as WorkoutSummary)
        }
      }
    }
    return acc
  }, [workoutsQuery.data])

  useEffect(() => {
    const node = loadMoreRef.current
    if (!node) return
    const fetchNextPage = workoutsQuery.fetchNextPage
    const hasNextPage = workoutsQuery.hasNextPage
    const isFetchingNextPage = workoutsQuery.isFetchingNextPage
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
          }
        }
      },
      { root: scrollRef.current ?? undefined }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [
    workoutsQuery.fetchNextPage,
    workoutsQuery.hasNextPage,
    workoutsQuery.isFetchingNextPage,
  ])

  const submitSelection = () => {
    const workout = workouts.find(item => item.id === selectedId)
    if (!workout) return
    onSelect(workout)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={value => {
        if (!value) onClose()
      }}
    >
      <DialogContent className="sm:max-w-6xl  max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {kind === 'warmup' ? 'Выбор зарядки' : 'Выбор тренировки'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex-1">
              <Input
                placeholder="Поиск по названию..."
                value={search}
                onChange={event => setSearch(event.target.value)}
              />
            </div>
            <Select
              value={sectionFilter}
              onValueChange={value =>
                setSectionFilter(value as 'all' | WorkoutSection)
              }
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Фильтр по типу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value={WorkoutSection.WARMUP}>Зарядки</SelectItem>
                <SelectItem value={WorkoutSection.STRENGTH}>Силовые</SelectItem>
                <SelectItem value={WorkoutSection.CORRECTION}>
                  Коррекция осанки
                </SelectItem>
                <SelectItem value={WorkoutSection.FUNCTIONAL}>
                  Функциональные
                </SelectItem>
                <SelectItem value={WorkoutSection.PAIN}>Решает боль</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            ref={scrollRef}
            className="relative rounded-lg border max-h-[65vh] min-h-80 overflow-auto bg-background"
          >
            {workoutsQuery.isLoading && (
              <div className="flex items-center gap-2 p-4 text-muted-foreground">
                <Spinner className="h-4 w-4" />
                Загрузка тренировок...
              </div>
            )}

            {!workoutsQuery.isLoading &&
              workouts.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    'flex w-full items-center gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-muted/70',
                    selectedId === item.id && 'bg-muted'
                  )}
                >
                  <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-muted">
                    {item.posterUrl ? (
                      <Image
                        width={56}
                        height={32}
                        src={item.posterUrl}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                        Нет
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="font-medium leading-tight">
                      {item.title}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">
                        {item.section
                          ? (sectionLabels[item.section] ?? item.section)
                          : '—'}
                      </Badge>
                      <span>· {formatDuration(item.durationSec)}</span>
                    </div>
                  </div>
                </button>
              ))}

            {!workoutsQuery.isLoading && workouts.length === 0 && (
              <div className="py-6 text-center text-muted-foreground">
                Ничего не найдено
              </div>
            )}

            {workouts.length > 0 && (
              <LoadMoreHint
                ref={loadMoreRef}
                isLoadingMore={workoutsQuery.isFetchingNextPage}
                hasNextPage={workoutsQuery.hasNextPage}
              />
            )}

            {isFetchingMore && (
              <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
                <div className="mt-2 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1 text-xs text-muted-foreground shadow">
                  <Spinner className="h-3 w-3" /> Обновляем список...
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <Button variant="ghost" onClick={onClose}>
            Отмена
          </Button>
          <Button disabled={!selectedId} onClick={submitSelection}>
            Выбрать
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
