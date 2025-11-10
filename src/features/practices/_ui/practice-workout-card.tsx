'use client'

import { useCallback, useMemo } from 'react'
import { Timer } from 'lucide-react'
import { WorkoutSection } from '@prisma/client'

import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { FavoriteButton } from '@/shared/ui/favorite-button'
import { KinescopePlayer } from '@/features/daily-plan/_ui/kinescope-player'
import { toast } from 'sonner'
import { TRPCClientError } from '@trpc/client'
import { cn } from '@/shared/ui/utils'
import {
  formatEquipmentList,
  formatMuscleLabels,
  getDifficultyLevel,
  getDurationMinutes,
} from '@/entities/workout/_lib/workout-formatters'
import { Workout } from '@/entities/workout'

const SECTION_LABELS: Record<WorkoutSection, string> = {
  [WorkoutSection.WARMUP]: 'Зарядка',
  [WorkoutSection.STRENGTH]: 'Силовая',
  [WorkoutSection.FUNCTIONAL]: 'Функциональная',
  [WorkoutSection.CORRECTION]: 'Коррекция осанки',
  [WorkoutSection.PAIN]: 'Работа с болью',
}

type FavoriteControls = {
  isFavorite: (workoutId: string) => boolean
  toggleFavorite: (workoutId: string) => Promise<void>
  isLoading: boolean
  isToggling: boolean
}

type PracticeWorkoutCardProps = {
  workout: Workout
  favoriteControls: FavoriteControls
}

export function PracticeWorkoutCard({
  workout,
  favoriteControls,
}: PracticeWorkoutCardProps) {
  const {
    isFavorite: checkIsFavorite,
    toggleFavorite,
    isLoading,
    isToggling,
  } = favoriteControls

  const handleToggleFavorite = useCallback(async () => {
    try {
      await toggleFavorite(workout.id)
    } catch (error) {
      if (
        error instanceof TRPCClientError &&
        error.data?.code === 'FORBIDDEN'
      ) {
        toast.error('Нет активного доступа к тренировкам')
      } else {
        toast.error('Не удалось обновить избранное')
      }
    }
  }, [toggleFavorite, workout.id])

  const durationMinutes = useMemo(
    () => getDurationMinutes(workout.durationSec),
    [workout.durationSec]
  )

  const difficultyLevel = useMemo(
    () => getDifficultyLevel(workout.difficulty),
    [workout.difficulty]
  )

  const equipmentText = useMemo(() => {
    const formatted = formatEquipmentList(workout.equipment)
    if (formatted) {
      return formatted
    }
    return Array.isArray(workout.equipment) ? 'Без инвентаря' : null
  }, [workout.equipment])

  const muscleBadges = useMemo(
    () => formatMuscleLabels(workout.muscles),
    [workout.muscles]
  )

  const sectionLabel = useMemo(
    () => SECTION_LABELS[workout.section] ?? 'Тренировка',
    [workout.section]
  )

  const playerOptions = useMemo(
    () => ({
      size: { height: 260 },
      autoplay: false,
    }),
    []
  )

  return (
    <Card className="rounded-xl border-border/80 p-4 shadow-sm transition">
      <CardContent className="space-y-4 p-0">
        <p>{sectionLabel}</p>
        {workout.videoId ? (
          <div className="relative h-[260px]">
            <KinescopePlayer
              key={workout.id}
              videoId={workout.videoId}
              options={playerOptions}
              className="h-full w-full overflow-hidden rounded-xl"
            />
            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 sm:p-3">
              {durationMinutes && (
                <Badge
                  variant="secondary"
                  className="bg-background px-2 py-0.5 text-[11px] sm:text-xs"
                >
                  <Timer className="mr-1 inline-block size-3" />
                  {durationMinutes} мин
                </Badge>
              )}
              <FavoriteButton
                isFavorite={checkIsFavorite(workout.id)}
                onToggle={handleToggleFavorite}
                isLoading={isLoading || isToggling}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            {durationMinutes && (
              <Badge
                variant="secondary"
                className="bg-background px-2 py-0.5 text-[11px] sm:text-xs"
              >
                <Timer className="mr-1 inline-block size-3" />
                {durationMinutes} мин
              </Badge>
            )}
            <FavoriteButton
              isFavorite={checkIsFavorite(workout.id)}
              onToggle={handleToggleFavorite}
              isLoading={isLoading || isToggling}
            />
          </div>
        )}

        <div className="space-y-1">
          <h3 className="text-lg font-semibold sm:text-xl">{workout.title}</h3>
          {workout.description && (
            <p className="text-sm text-muted-foreground">
              {workout.description}
            </p>
          )}
        </div>

        {equipmentText && (
          <div className="text-sm text-muted-foreground">
            {equipmentText === 'Без инвентаря' ? (
              <span>{equipmentText}</span>
            ) : (
              <>
                <span className="text-muted-foreground/80">Инвентарь:</span>{' '}
                <span>{equipmentText}</span>
              </>
            )}
          </div>
        )}

        {muscleBadges.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {muscleBadges.map(muscleLabel => (
              <Badge key={muscleLabel} variant="outline">
                {muscleLabel}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Сложность</span>
          <span className="flex items-center gap-1">
            {[1, 2, 3].map(level => (
              <span
                key={level}
                className={cn(
                  'h-2.5 w-2.5 rounded-full border',
                  difficultyLevel >= level
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/40 bg-transparent'
                )}
              />
            ))}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
