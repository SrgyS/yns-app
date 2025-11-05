'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Timer } from 'lucide-react'
import {
  WorkoutSection,
  WorkoutSubsection,
  MuscleGroup,
} from '@prisma/client'

import { Badge } from '@/shared/ui/badge'
import { Input } from '@/shared/ui/input'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { useWorkouts } from '@/entities/workout/_vm/use-workouts'
import { Workout } from '@/entities/workout'
import { KinescopePlayer } from '@/features/daily-plan/_ui/kinescope-player'
import upperFirst from 'lodash-es/upperFirst'
import { cn } from '@/shared/ui/utils'
import { NoAccessCallout } from '@/features/course-enrollment/_ui/no-access-callout'

const MUSCLE_GROUP_LABELS: Partial<Record<MuscleGroup, string>> = {
  LEGS: 'Ноги',
  GLUTES: 'Ягодицы',
  UPPER_BODY: 'Верх тела',
  BACK: 'Спина',
  PELVIC_FLOOR: 'Тазовое дно',
  CORE: 'Кор',
}

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
}: PracticeSubsectionScreenProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const normalizedSearch = search.trim() || undefined

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useWorkouts({
    section,
   subsection,
   search: normalizedSearch,
  })

  const workouts = data ?? []

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
    useContainer ? 'container space-y-6 py-10' : 'space-y-6 py-10',
    className
  )

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="flex size-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition hover:bg-background"
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Назад</span>
        </button>
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

        {isError ? (
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
        ) : isLoading || isFetching ? (
          <PracticeWorkoutsSkeleton />
        ) : workouts.length ? (
          <div className="grid gap-5">
            {workouts.map(workout => (
              <PracticeWorkoutCard key={workout.id} workout={workout} />
            ))}
          </div>
        ) : (
          <EmptyState message="Нет тренировок для выбранного подраздела." />
        )}
      </div>
    </div>
  )
}

// ... rest of file remains unchanged (PracticeWorkoutCard, skeleton, etc.)

type PracticeWorkoutCardProps = {
  workout: Workout
}

function PracticeWorkoutCard({ workout }: PracticeWorkoutCardProps) {
  const durationMinutes = useMemo(() => {
    if (!workout.durationSec) return null
    return Math.max(1, Math.round(workout.durationSec / 60))
  }, [workout.durationSec])

  const difficulty = useMemo(() => {
    const map: Record<string, string> = {
      EASY: 'Легко',
      MEDIUM: 'Средне',
      HARD: 'Сложно',
    }
    return map[workout.difficulty] ?? null
  }, [workout.difficulty])

  const equipmentText = useMemo(() => {
    if (!Array.isArray(workout.equipment)) return null

    const normalized = workout.equipment
      .map(item => upperFirst(item))
      .filter(Boolean)

    if (normalized.length === 0) {
      return 'Без инвентаря'
    }

    return normalized.join(', ')
  }, [workout.equipment])

  const muscleBadges = useMemo(() => {
    if (!Array.isArray(workout.muscles) || workout.muscles.length === 0) {
      return []
    }

    return workout.muscles
      .map(
        muscle =>
          MUSCLE_GROUP_LABELS[muscle] ??
          upperFirst(muscle.toLowerCase().replace(/_/g, ' '))
      )
      .filter(Boolean)
  }, [workout.muscles])

  return (
    <Card className="rounded-xl border-border/80 p-4 shadow-sm transition">
      <CardContent className="space-y-4 p-0">
        <h3 className="text-lg font-semibold sm:text-xl">{workout.title}</h3>
        {workout.videoId && (
          <KinescopePlayer
            key={workout.id}
            videoId={workout.videoId}
            options={{ size: { height: 260 } }}
            className="overflow-hidden rounded-xl"
          />
        )}

        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {durationMinutes && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Timer className="size-3" /> {durationMinutes} мин
            </Badge>
          )}
          {difficulty && (
            <Badge variant="outline">Сложность: {difficulty}</Badge>
          )}
        </div>

        {equipmentText && (
          <div className="text-sm text-muted-foreground">
            Инвентарь: {equipmentText}
          </div>
        )}

        {muscleBadges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {muscleBadges.map(label => (
              <Badge key={label} variant="outline">
                {label}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PracticeWorkoutsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="rounded-xl border-border/80 p-4">
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

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}
