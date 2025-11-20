import { SharedSession } from '@/kernel/domain/user'
import { AnyRouter, initTRPC, TRPCError } from '@trpc/server'
import { ZodTypeAny, z } from 'zod'
import { createServerSideHelpers } from '@trpc/react-query/server'
import { ContextFactory } from './_context-factory'

export const t = initTRPC.context<ContextFactory['createContext']>().create()

export const router = t.router
export const publicProcedure = t.procedure
export const authorizedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: ctx.session,
    },
  })
})

export const checkAbilityProcedure = <Ability>({
  check,
  create,
}: {
  check?: (ability: Ability) => boolean | Promise<boolean>
  create: (session: SharedSession) => Ability | Promise<Ability>
}) =>
  authorizedProcedure.use(async ({ ctx, next }) => {
    const ability = await create(ctx.session)

    if (check && !(await check(ability))) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    return next({
      ctx: {
        ...ctx,
        ability,
      },
    })
  })

export const checkAbilityInputProcedure = <Ability, Input extends ZodTypeAny>({
  check,
  create,
  input,
}: {
  input: Input
  check: (
    ability: Ability,
    input: z.infer<Input>
  ) => boolean | Promise<boolean>
  create: (session: SharedSession) => Ability | Promise<Ability>
}) =>
  authorizedProcedure.input(input).use(async ({ ctx, next, input: params }) => {
    const ability = await create(ctx.session)

    if (!(await check(ability, params))) {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }

    return next({
      ctx: {
        ...ctx,
        ability,
      },
    })
  })

export const sharedRouter = router({})
export type SharedRouter = typeof sharedRouter

export const createPublicServerApi = <T extends AnyRouter>(router: T) =>
  createServerSideHelpers<T>({
    router: router,
    ctx: () => ({}),
  } as any)
