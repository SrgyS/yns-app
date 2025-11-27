import { createApi, createHttpApi } from '@/kernel/lib/trpc/client'

import { AdminCoursesController } from './_controller'

export const adminCoursesApi = createApi<AdminCoursesController['router']>()

export const adminCoursesHttpApi =
  createHttpApi<AdminCoursesController['router']>()
