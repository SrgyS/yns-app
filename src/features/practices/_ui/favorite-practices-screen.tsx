'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Badge } from '@/shared/ui/badge'
import { NoAccessCallout } from '@/features/course-enrollment/_ui/no-access-callout'
import {
  PracticeWorkoutsSkeleton,
  PracticeEmptyState,
} from './practice-subsection-screen'
import { PracticeWorkoutCard } from './practice-workout-card'
import { useFavoriteWorkoutDetails } from '../_vm/use-favorite-workouts'
import { useWorkoutFavorites } from '@/features/daily-plan/_vm/use-workout-favorites'
import { Button } from '@/shared/ui/button'

export function FavoritePracticesScreen() {
  const router = useRouter()
  const { data, isLoading, isFetching, isError, error } =
    useFavoriteWorkoutDetails()

  const workouts = useMemo(() => data ?? [], [data])
  const favoriteControls = useWorkoutFavorites()

  const handleBack = () => {
    router.push('/practices')
  }

  return (
    <div className="container max-w-[640px] space-y-6 py-10">
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
            Подборка
          </span>
          <h1 className="text-2xl font-semibold sm:text-3xl">
            Избранные тренировки
          </h1>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">
            Здесь собраны тренировки, которые вы отметили как любимые.
          </p>
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
                : 'Избранные тренировки доступны при активной подписке.'
            }
            ctaLabel="Выбрать курс"
            ctaHref="/"
          />
        ) : (isLoading || isFetching) && workouts.length === 0 ? (
          <PracticeWorkoutsSkeleton />
        ) : workouts.length ? (
          <div className="grid gap-5">
            {workouts.map(workout => (
              <PracticeWorkoutCard
                key={workout.id}
                workout={workout}
                favoriteControls={favoriteControls}
              />
            ))}
          </div>
        ) : (
          <PracticeEmptyState message="У вас пока нет избранных тренировок. Добавьте понравившиеся занятия из ежедневного плана." />
        )}
      </div>
    </div>
  )
}
