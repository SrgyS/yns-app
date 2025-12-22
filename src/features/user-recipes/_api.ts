import { createApi } from '@/kernel/lib/trpc/client'
import { UserRecipesController } from './_controller'

export const userRecipesApi = createApi<UserRecipesController['router']>()
