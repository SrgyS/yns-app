import { createApi } from '@/kernel/lib/trpc/client'
import { SupportChatController } from './_controller'

export const supportChatApi = createApi<SupportChatController['router']>()
