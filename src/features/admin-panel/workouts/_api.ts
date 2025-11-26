import { createApi, createHttpApi } from '@/kernel/lib/trpc/client'

import { AdminWorkoutsController } from './_controller'

export const adminWorkoutsApi =
  createApi<AdminWorkoutsController['router']>()

export const adminWorkoutsHttpApi =
  createHttpApi<AdminWorkoutsController['router']>()
