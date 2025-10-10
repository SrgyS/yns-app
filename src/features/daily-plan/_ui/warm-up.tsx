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
      size: { height: 300 },
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
    <Card>
      <CardContent>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        {workout?.videoId && (
          <KinescopePlayer
            key={`${userDailyPlanId}-${workout.videoId}`}
            ref={playerRef}
            videoId={workout.videoId}
            options={playerOptions}
            onEnded={handleVideoCompleted}
          />
        )}
        {(muscleBadges.length > 0 || isCompleted || durationMinutes) && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            {muscleBadges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {muscleBadges.map((muscle, index) => (
                  <Badge key={`${muscle}-${index}`} variant="secondary">
                    {muscle}
                  </Badge>
                ))}
              </div>
            )}
            {(isCompleted || durationMinutes) && (
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                {isCompleted && <Badge>Выполнено</Badge>}
                {durationMinutes && <Badge>{durationMinutes} мин</Badge>}
              </div>
            )}
          </div>
        )}
        {equipmentText && (
          <p className="mt-3 text-sm">
            <span className="text-muted-foreground">Инвентарь:</span>{' '}
            <span>{equipmentText}</span>
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Сложность:</span>
          <span className="flex items-center gap-1">
            {DIFFICULTY_STEPS.map(step => {
              const isActive = difficultyLevel >= step
              return (
                <span
                  key={step}
                  className={cn(
                    'h-2.5 w-2.5 rounded-full border transition-colors',
                    isActive
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground/40 bg-transparent'
                  )}
                />
              )
            })}
          </span>
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
