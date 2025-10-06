'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  KinescopePlayer,
  type PlayerHandle,
} from './kinescope-player'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent, CardFooter } from '@/shared/ui/card'
import { Checkbox } from '@/shared/ui/checkbox'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { useWorkoutCompletions } from '../_vm/use-workout-completions'
import { useWorkout } from '../_vm/use-workout'
import { FavoriteButton } from '@/shared/ui/favorite-button'



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
      </CardContent>
      <CardFooter className="flex gap-2 flex-wrap justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">мин</Badge>
          <Badge variant="outline">{workout?.type?.toLowerCase() || ''}</Badge>
          {isCompleted && <Badge>Выполнено</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <FavoriteButton />
          <Checkbox
            id={`workout-completed-${workoutId}`}
            checked={isCompleted}
            onCheckedChange={toggleCompleted}
            className='cursor-pointer'
          />
        </div>
      </CardFooter>
    </Card>
  )
}
