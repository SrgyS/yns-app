import { create } from 'zustand'
import { WorkoutType } from '@prisma/client'

// Функция для создания уникального ключа
export const createCompletionKey = (
  userId: string,
  workoutId: string,
  enrollmentId: string,
  workoutType: WorkoutType,
  userDailyPlanId: string
): string => {
  return `${userId}:${workoutId}:${enrollmentId}:${workoutType}:${userDailyPlanId}`
}

type WorkoutCompletionState = {
  completions: Record<string, boolean>
  setCompletion: (key: string, isCompleted: boolean) => void
  getCompletion: (key: string) => boolean | undefined
}

export const useWorkoutCompletionStore = create<WorkoutCompletionState>((set, get) => ({
  completions: {},
  setCompletion: (key: string, isCompleted: boolean) => 
    set(state => ({
      completions: {
        ...state.completions,
        [key]: isCompleted
      }
    })),
  getCompletion: (key: string) => get().completions[key]
}))