'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { WorkoutSection, WorkoutSubsection } from '@prisma/client'

import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { useWorkouts } from '@/entities/workout/_vm/use-workouts'
import { cn } from '@/shared/ui/utils'
import { NoAccessCallout } from '@/features/course-enrollment/_ui/no-access-callout'
import { useWorkoutFavorites } from '@/features/daily-plan/_vm/use-workout-favorites'

import { PracticeWorkoutCard } from './practice-workout-card'
import { Button } from '@/shared/ui/button'

type PracticeSubsectionScreenProps = {
  section: WorkoutSection
  subsection: WorkoutSubsection
  sectionTitle: string
  subcategoryTitle: string
  subcategoryDescription?: string
  backHref?: string
  onBack?: () => void
  className?: string
  useContainer?: boolean
}

export function PracticeSubsectionScreen({
  section,
  subsection,
  sectionTitle,
  subcategoryTitle,
  subcategoryDescription,
  backHref,
  onBack,
  className,
  useContainer = true,
}: Readonly<PracticeSubsectionScreenProps>) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim() || undefined

  const { data, isLoading, isFetching, isError, error } = useWorkouts({
    section,
    subsection,
    search: normalizedSearch,
  })

  const favoriteControls = useWorkoutFavorites({ enabled: true })
  const workouts = useMemo(() => data ?? [], [data])

  const handleBack = () => {
    if (onBack) {
      onBack()
      return
    }

    if (backHref) {
      router.push(backHref)
      return
    }

    router.push('/practices')
  }

  const containerClasses = cn(
    useContainer ? 'container space-y-6 py-10 max-w-2xl' : 'space-y-6 py-10',
    className
  )

  let content: React.ReactNode

  if (isError) {
    content = (
      <NoAccessCallout
        title="Доступ ограничен"
        description={
          error instanceof Error
            ? error.message
            : 'Тренировки доступны только при активном доступе.'
        }
        ctaLabel="Выбрать курс"
        ctaHref="/"
      />
    )
  } else if ((isLoading || isFetching) && workouts.length === 0) {
    content = <PracticeWorkoutsSkeleton />
  } else if (workouts.length) {
    content = (
      <div className="grid gap-5">
        {workouts.map(workout => (
          <PracticeWorkoutCard
            key={workout.id}
            workout={workout}
            favoriteControls={favoriteControls}
          />
        ))}
      </div>
    )
  } else {
    content = (
      <PracticeEmptyState message="Нет тренировок для выбранного подраздела." />
    )
  }

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={handleBack}
          size="icon"
          variant="outline"
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Назад</span>
        </Button>
        <div className="flex flex-col">
          <span className="text-xs uppercase text-muted-foreground">
            {sectionTitle}
          </span>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            {subcategoryTitle}
          </h1>
        </div>
      </div>

      {subcategoryDescription && (
        <p className="max-w-2xl text-muted-foreground">
          {subcategoryDescription}
        </p>
      )}

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Поиск тренировки по названию"
            className="h-11 sm:max-w-sm"
          />
          <Badge variant="secondary" className="self-start">
            Найдено: {workouts.length}
          </Badge>
        </div>

        {content}
      </div>
    </div>
  )
}

type PracticeWorkoutsSkeletonProps = {
  items?: number
}

export function PracticeWorkoutsSkeleton({
  items = 3,
}: PracticeWorkoutsSkeletonProps = {}) {
  const placeholders = Array.from({ length: items }, (_, index) => `skeleton-${index}`)

  return (
    <div className="space-y-4">
      {placeholders.map(key => (
        <Card key={key} className="rounded-xl border-border/80 p-4">
          <CardContent className="space-y-4 p-0">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

type EmptyStateProps = {
  message: string
}

export function PracticeEmptyState({ message }: Readonly<EmptyStateProps>) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
