import { queryClient } from "@/shared/api/query-client"


type CacheGroup = {
  name: string
  keys: string[]
}

// Определение групп связанных кешей
export const CACHE_GROUPS: Record<string, CacheGroup> = {
  WORKOUT_DATA: {
    name: 'Данные тренировок',
    keys: [
      'workoutCompletionStatus',
      'userDailyPlan',
      'enrollment',
      'enrollmentByCourseSlug',
      'workout'
    ]
  },
  USER_DATA: {
    name: 'Данные пользователя',
    keys: [
      'user',
      'userProfile',
      'userSettings'
    ]
  }
}

// Функция для инвалидации группы кешей
export const invalidateCacheGroup = async (groupName: keyof typeof CACHE_GROUPS) => {
  const group = CACHE_GROUPS[groupName]
  if (!group) return
  
  console.log(`Инвалидация группы кешей: ${group.name}`)
  
  for (const key of group.keys) {
    await queryClient.invalidateQueries({ queryKey: [key] })
  }
}