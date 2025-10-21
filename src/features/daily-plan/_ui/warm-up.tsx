'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { KinescopePlayer, type PlayerHandle } from './kinescope-player'
import upperFirst from 'lodash-es/upperFirst'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardFooter } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { useWorkoutCompletions } from '../_vm/use-workout-completions'
import { useWorkout } from '../_vm/use-workout'
import { FavoriteButton } from '@/shared/ui/favorite-button'
import { cn } from '@/shared/ui/utils'

const MUSCLE_GROUP_LABELS = {
  LEGS: 'Ноги',
  GLUTES: 'Ягодицы',
  UPPER_BODY: 'Верх тела',
  BACK: 'Спина',
  PELVIC_FLOOR: 'Тазовое дно',
  CORE: 'Кор',
} as const

const DIFFICULTY_STEPS = [1, 2, 3] as const

interface WarmUpProps {
  title: string
  workoutId: string
  enrollmentId: string
  initialCompleted?: boolean
  userDailyPlanId: string
}

export function WarmUp({
  title,
  workoutId,
  enrollmentId,
  initialCompleted = false,
  userDailyPlanId,
}: WarmUpProps) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const { data: session } = useAppSession()

  const playerRef = useRef<PlayerHandle | null>(null)

  const { getWorkout } = useWorkout()
  const { data: workout } = getWorkout(workoutId)

  const { getWorkoutCompletionStatus, updateWorkoutCompletion } =
    useWorkoutCompletions()

  const playerOptions = useMemo(
    () => ({
      size: { height: 260 },
    }),
    []
  )

  const durationMinutes = useMemo(() => {
    if (!workout?.durationSec) return null
    const minutes = Math.round(workout.durationSec / 60)
    if (minutes <= 0) {
      return 1
    }
    return minutes
  }, [workout?.durationSec])

  const muscleBadges = useMemo(() => {
    if (!Array.isArray(workout?.muscles) || workout.muscles.length === 0) {
      return []
    }

    return workout.muscles
      .map(muscle => {
        if (muscle in MUSCLE_GROUP_LABELS) {
          return MUSCLE_GROUP_LABELS[muscle as keyof typeof MUSCLE_GROUP_LABELS]
        }

        return upperFirst(muscle.toLowerCase().replace(/_/g, ' '))
      })
      .filter(Boolean)
  }, [workout?.muscles])

  const equipmentText = useMemo(() => {
    if (!Array.isArray(workout?.equipment)) return null

    const normalized = workout.equipment
      .map(item => upperFirst(item))
      .filter(Boolean)

    if (normalized.length === 0) {
      return 'Без инвентаря'
    }

    return normalized.join(', ')
  }, [workout?.equipment])

  const difficultyLevel = useMemo(() => {
    if (!workout?.difficulty) return 0

    const map: Record<string, number> = {
      EASY: 1,
      MEDIUM: 2,
      HARD: 3,
    }

    return map[workout.difficulty] ?? 0
  }, [workout?.difficulty])

  useEffect(() => {
    if (workout?.type && session?.user?.id && enrollmentId) {
      const fetchCompletionStatus = async () => {
        const completionStatus = await getWorkoutCompletionStatus(
          session.user.id,
          workoutId,
          enrollmentId,
          workout.type,
          userDailyPlanId
        )
        setIsCompleted(completionStatus)
      }
      fetchCompletionStatus()
    }
  }, [
    workout,
    session,
    workoutId,
    enrollmentId,
    getWorkoutCompletionStatus,
    userDailyPlanId,
  ])
  const handleVideoCompleted = () => {
    if (!isCompleted) {
      toggleCompleted()
    }
  }

  const toggleCompleted = async () => {
    if (!session?.user?.id || !workout?.type) return

    const newCompletedState = !isCompleted
    // Не обновляем состояние сразу, а только после успешного запроса

    try {
      await updateWorkoutCompletion({
        userId: session.user.id,
        workoutId,
        enrollmentId,
        workoutType: workout.type,
        isCompleted: newCompletedState,
        userDailyPlanId,
      })
      // Обновляем состояние только после успешного запроса
      setIsCompleted(newCompletedState)
    } catch (error) {
      console.error('Error updating workout completion status:', error)
    }
  }

  return (
    <Card className="rounded-lg gap-4 py-3 sm:rounded-xl sm:gap-5 sm:py-4 max-[400px]:gap-3 max-[400px]:py-2">
      <CardContent className="px-3 sm:px-4">
        <h3 className="text-base font-medium sm:text-lg mb-1">{title}</h3>
        {workout?.videoId && (
          <KinescopePlayer
            key={`${userDailyPlanId}-${workout.videoId}`}
            ref={playerRef}
            videoId={workout.videoId}
            options={playerOptions}
            onEnded={handleVideoCompleted}
            className="overflow-hidden rounded-lg sm:rounded-xl"
          />
        )}
        <div className="mt-2 sm:mt-3">
          {workout?.title && (
            <p className="mt-1 text-xs leading-relaxed  sm:text-sm">
              {workout.title}
            </p>
          )}
          {workout?.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {workout.description}
            </p>
          )}
        </div>
        {(muscleBadges.length > 0 || isCompleted) && (
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2 sm:mt-3">
            {muscleBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {muscleBadges.map((muscle, index) => (
                  <Badge
                    key={`${muscle}-${index}`}
                    variant="secondary"
                    className="px-2 py-0.5 text-[11px] sm:text-xs"
                  >
                    {muscle}
                  </Badge>
                ))}
              </div>
            )}
            {isCompleted && (
              <div
                className={cn(
                  'flex items-center gap-1.5 text-[11px] text-muted-foreground sm:gap-2 sm:text-xs justify-self-end',
                  muscleBadges.length > 0
                    ? 'col-start-2 row-start-1'
                    : 'col-span-2 justify-end'
                )}
              >
                <Badge>Выполнено</Badge>
              </div>
            )}
          </div>
        )}
        {equipmentText && (
          <p className="mt-2 text-xs leading-snug sm:text-sm">
            {equipmentText === 'Без инвентаря' ? (
              <span>{equipmentText}</span>
            ) : (
              <>
                <span className="text-muted-foreground">Инвентарь:</span>{' '}
                <span>{equipmentText}</span>
              </>
            )}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2 max-[400px]:gap-1.5">
          {durationMinutes && (
            <Badge
              variant="outline"
              className="px-2 py-0.5 text-[11px] sm:text-xs"
            >
              {durationMinutes} мин
            </Badge>
          )}
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] sm:text-xs"
          >
            <span>Сложность</span>
            <span className="flex items-center gap-1">
              {DIFFICULTY_STEPS.map(step => {
                const isActive = difficultyLevel >= step
                return (
                  <span
                    key={step}
                    className={cn(
                      'h-2.5 w-2.5 rounded-full border transition-colors max-[400px]:h-2 max-[400px]:w-2',
                      isActive
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/40 bg-transparent'
                    )}
                  />
                )
              })}
            </span>
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <FavoriteButton />
          <Checkbox
            id={`workout-completed-${workoutId}`}
            checked={isCompleted}
            onCheckedChange={toggleCompleted}
            className="cursor-pointer"
          />
        </div>
      </CardFooter>
    </Card>
  )
}
