import { createApi } from '@/kernel/lib/trpc/client'
import { AdminKnowledgeController } from './_controller'

export const adminKnowledgeApi = createApi<AdminKnowledgeController['router']>()
