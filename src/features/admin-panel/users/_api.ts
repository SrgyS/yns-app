import { createApi, createHttpApi } from '@/kernel/lib/trpc/client'

import { AdminUsersController } from './_controller'

export const adminUsersApi = createApi<AdminUsersController['router']>()

export const adminUsersHttpApi = createHttpApi<AdminUsersController['router']>()
