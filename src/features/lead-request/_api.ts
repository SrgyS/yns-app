import { createApi } from '@/kernel/lib/trpc/client'
import { LeadRequestController } from './_controller'

export const leadRequestApi = createApi<LeadRequestController['router']>()
