import { createApi, createHttpApi } from '@/kernel/lib/trpc/client'
import { AuthCredentialsController } from './_controller'

export const authCredentialsApi = createApi<AuthCredentialsController['router']>()

export const authCredentialsHttpApi =
  createHttpApi<AuthCredentialsController['router']>()