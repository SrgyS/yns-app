import { createApi, createHttpApi } from '@/kernel/lib/trpc/client'
import { WorkoutController } from './_controller'

export const workoutApi = createApi<WorkoutController['router']>()
export const workoutHttpApi = createHttpApi<WorkoutController['router']>()