import { createTRPCClient, httpBatchLink, TRPCClient } from '@trpc/client'
import { CreateTRPCReact, createTRPCReact } from '@trpc/react-query'
import { SharedRouter } from './module'
import { AnyRouter } from '@trpc/server'
import { publicConfig } from '@/shared/config/public'

export const sharedApi = createTRPCReact<SharedRouter>()

export const createApi = <T extends AnyRouter>() =>
  sharedApi as CreateTRPCReact<T, unknown>

export const sharedHttpApi = createTRPCClient<SharedRouter>({
  links: [
    httpBatchLink({
      url: `${publicConfig.PUBLIC_URL}/api/trpc`,
    }),
  ],
})

export const createHttpApi = <T extends AnyRouter>() =>
  sharedHttpApi as TRPCClient<T>
