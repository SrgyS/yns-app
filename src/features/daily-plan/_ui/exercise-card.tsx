'use client'

import { useState, useEffect, useRef } from 'react'
import { KinescopePlayer, type PlayerHandle } from './kinescope-player'
import { Timer } from 'lucide-react'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardFooter } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { useWorkoutCompletions } from '../_vm/use-workout-completions'
import { useWorkoutQuery } from '../_vm/use-workout'
import { FavoriteButton } from '@/shared/ui/favorite-button'
import { useWorkoutFavorites } from '../_vm/use-workout-favorites'
import { cn } from '@/shared/ui/utils'
import { DailyContentType } from '@prisma/client'
import { toast } from 'sonner'
import { TRPCClientError } from '@trpc/client'
import {
  formatEquipmentList,
  formatMuscleLabels,
  getDifficultyLevel,
  getDurationMinutes,
} from '@/entities/workout/_lib/workout-formatters'

interface ExerciseCardProps {
  title: string
  workoutId: string
  enrollmentId: string
  initialCompleted?: boolean
  userDailyPlanId: string
  contentType: DailyContentType
  stepIndex: number
}

export function ExerciseCard({
  title,
  workoutId,
  enrollmentId,
  initialCompleted = false,
  userDailyPlanId,
  contentType,
  stepIndex,
}: Readonly<ExerciseCardProps>) {
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const { data: session } = useAppSession()

  const playerRef = useRef<PlayerHandle | null>(null)

  const { data: workout } = useWorkoutQuery(workoutId)

  const { getWorkoutCompletionStatus, updateWorkoutCompletion } =
    useWorkoutCompletions()

  const {
    isFavorite: checkIsFavorite,
    toggleFavorite,
    isLoading: favoritesLoading,
    isToggling: isTogglingFavorite,
  } = useWorkoutFavorites({ enabled: Boolean(session?.user?.id) })

  const playerOptions = {
    size: { height: 260 },
    autoplay: false,
  }

  const durationMinutes = getDurationMinutes(workout?.durationSec ?? null)

  const muscleBadges = formatMuscleLabels(workout?.muscles)

  const equipmentText = (() => {
    const formatted = formatEquipmentList(workout?.equipment)
    if (formatted) {
      return formatted
    }
    return Array.isArray(workout?.equipment) ? 'Без инвентаря' : null
  })()

  const difficultyLevel = getDifficultyLevel(workout?.difficulty)

  useEffect(() => {
    if (session?.user?.id && enrollmentId) {
      const fetchCompletionStatus = async () => {
        const completionStatus = await getWorkoutCompletionStatus(
          session.user.id,
          workoutId,
          enrollmentId,
          contentType,
          stepIndex
        )
        setIsCompleted(completionStatus)
      }
      fetchCompletionStatus()
    }
  }, [
    session,
    workoutId,
    enrollmentId,
    getWorkoutCompletionStatus,
    contentType,
    stepIndex,
  ])

  const handleVideoCompleted = () => {
    setIsVideoPlaying(false)
    if (!isCompleted) {
      toggleCompleted()
    }
  }

  const handleVideoPlay = () => {
    setIsVideoPlaying(true)
  }

  const handleVideoPause = () => {
    setIsVideoPlaying(false)
  }

  // Убираем неиспользуемые обработчики

  const toggleCompleted = async () => {
    if (!session?.user?.id) return

    const newCompletedState = !isCompleted
    // Не обновляем состояние сразу, а только после успешного запроса

    try {
      await updateWorkoutCompletion({
        userId: session.user.id,
        workoutId,
        enrollmentId,
        contentType,
        stepIndex,
        isCompleted: newCompletedState,
      })
      // Обновляем состояние только после успешного запроса
      setIsCompleted(newCompletedState)
    } catch (error) {
      toast.error('Ошибка при обновлении статуса тренировки')
      console.error('Error updating workout completion status:', error)
    }
  }

  return (
    <Card className="min-h-[400px] md:min-h-[480px] rounded-lg gap-4 py-3 sm:rounded-xl sm:gap-5 sm:py-4 max-[400px]:gap-3 max-[400px]:py-2">
      <CardContent className="px-3 sm:px-4">
        <h3 className="text-base font-medium sm:text-lg mb-1">{title}</h3>
        {workout?.videoId && (
          <div className="relative h-[260px]">
            <KinescopePlayer
              key={`${userDailyPlanId}-${workout.videoId}`}
              ref={playerRef}
              videoId={workout.videoId}
              options={playerOptions}
              onEnded={handleVideoCompleted}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              className="overflow-hidden rounded-lg sm:rounded-xl"
            />
            <div
              className={cn(
                'absolute inset-x-0 top-0 transition-opacity duration-200',
                isVideoPlaying
                  ? 'pointer-events-none opacity-0'
                  : 'pointer-events-auto opacity-100'
              )}
            >
              <div className="flex items-center justify-between p-2 sm:p-3">
                {durationMinutes && (
                  <Badge
                    variant="secondary"
                    className="bg-background px-2 py-0.5 text-[11px] sm:text-xs"
                  >
                    <Timer className="size-3 inline-block mr-0.5" />
                    {durationMinutes} мин
                  </Badge>
                )}

                <FavoriteButton
                  isFavorite={checkIsFavorite(workoutId)}
                  onToggle={async () => {
                    try {
                      await toggleFavorite(workoutId)
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
                  }}
                  disabled={!session?.user?.id || !workoutId}
                  isLoading={favoritesLoading || isTogglingFavorite}
                />
              </div>
            </div>
          </div>
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

        {muscleBadges.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
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
          <Badge
            variant="outline"
            className="flex items-center gap-1 px-2 py-0.5 text-[11px] sm:text-xs"
          >
            <span>Сложность</span>
            <span className="flex items-center gap-1">
              {[1, 2, 3].map(step => {
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
        <div className="flex items-center justify-end gap-2">
          {isCompleted && (
            <div
              className={cn(
                'flex items-center gap-1.5 text-[11px] text-muted-foreground sm:gap-2 sm:text-xs justify-self-end'
              )}
            >
              <Badge>Выполнено</Badge>
            </div>
          )}
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
