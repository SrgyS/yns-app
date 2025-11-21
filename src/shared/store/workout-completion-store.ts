import { create } from 'zustand'
import { DailyContentType } from '@prisma/client'

// Функция для создания уникального ключа
export const createCompletionKey = (
  userId: string,
  enrollmentId: string,
  contentType: DailyContentType,
  stepIndex: number
): string => {
  return `${userId}:${enrollmentId}:${contentType}:${stepIndex}`
}

type WorkoutCompletionState = {
  completions: Record<string, boolean>
  setCompletion: (key: string, isCompleted: boolean) => void
  getCompletion: (key: string) => boolean | undefined
}

export const useWorkoutCompletionStore = create<WorkoutCompletionState>(
  (set, get) => ({
    completions: {},
    setCompletion: (key: string, isCompleted: boolean) =>
      set(state => ({
        completions: {
          ...state.completions,
          [key]: isCompleted,
        },
      })),
    getCompletion: (key: string) => get().completions[key],
  })
)
