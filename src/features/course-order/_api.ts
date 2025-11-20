import { createApi } from '@/kernel/lib/trpc/client'
import { CourseOrderController } from './_controller'

export const courseOrderApi = createApi<CourseOrderController['router']>()
