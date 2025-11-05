import { createApi, createHttpApi } from '@/kernel/lib/trpc/client'
import { WorkoutCatalogController } from './_controller'

export const workoutCatalogApi =
  createApi<WorkoutCatalogController['router']>()
export const workoutCatalogHttpApi =
  createHttpApi<WorkoutCatalogController['router']>()
