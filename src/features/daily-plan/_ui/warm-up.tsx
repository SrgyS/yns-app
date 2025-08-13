import { useState, useEffect } from 'react'
import { Badge } from '@/shared/ui/badge'
import { Card, CardContent } from '@/shared/ui/card'
import { KinescopePlayer } from './kinescope-player'
import { workoutApi } from '../_api'
import { Checkbox } from '@/shared/ui/checkbox'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { useWorkoutCompletions } from '../_vm/use-workout-completions'

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
  const [isFavorite, setIsFavorite] = useState(false)
  const [isCompleted, setIsCompleted] = useState(initialCompleted)
  const { data: session } = useAppSession()

  // Получаем данные тренировки
  const { data: workout } = workoutApi.getWorkout.useQuery({
    workoutId,
  })

  // Получаем хук для работы со статусом выполнения тренировок
  const { getWorkoutCompletionStatus, updateWorkoutCompletion } =
    useWorkoutCompletions()

  // Получаем актуальный статус выполнения при загрузке данных тренировки
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

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite)
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
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`workout-completed-${workoutId}`}
              checked={isCompleted}
              onCheckedChange={toggleCompleted}
            />
            <h3 className="text-xl font-medium">{title}</h3>
          </div>
          <button onClick={toggleFavorite}>{isFavorite ? '❤️' : '🤍'}</button>
        </div>

        {workout?.videoUrl && <KinescopePlayer videoId={workout.videoUrl} />}

        <div className="flex gap-2 mt-3 flex-wrap">
          <Badge variant="secondary">
            {workout?.durationMinutes || '...'} мин
          </Badge>
          <Badge variant="outline">{workout?.type?.toLowerCase() || ''}</Badge>
          {isCompleted && <Badge>Выполнено</Badge>}
        </div>
      </CardContent>
    </Card>
  )
}
