import { createApi } from '@/kernel/lib/trpc/client'
import { AdminRecipesController } from './_controller'

export const adminRecipesApi = createApi<AdminRecipesController['router']>()
