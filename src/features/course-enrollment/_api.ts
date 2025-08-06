import { createApi, createHttpApi } from '@/kernel/lib/trpc/client'
import { CourseEnrollmentController } from './_controller'

export const courseEnrollmentApi = createApi<CourseEnrollmentController['router']>()

export const courseEnrollmentHttpApi = createHttpApi<CourseEnrollmentController['router']>()