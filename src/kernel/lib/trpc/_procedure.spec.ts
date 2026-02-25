import { z } from 'zod'

import {
  authorizedProcedure,
  checkAbilityInputProcedure,
  checkAbilityProcedure,
  router,
} from './_procedure'

const session = {
  user: {
    id: 'user-1',
    email: 'user@example.com',
    role: 'USER' as const,
    name: null,
    image: null,
  },
  expires: '2099-01-01T00:00:00.000Z',
}

describe('trpc auth procedures', () => {
  test('authorizedProcedure rejects when session is missing', async () => {
    const testRouter = router({
      authed: authorizedProcedure.query(() => 'ok'),
    })
    const caller = testRouter.createCaller({ session: null })

    let code: string | null = null
    try {
      await caller.authed()
    } catch (error) {
      code = (error as { code?: string }).code ?? null
    }

    expect(code).toBe('UNAUTHORIZED')
  })

  test('checkAbilityProcedure forbids when check fails', async () => {
    const testRouter = router({
      ability: checkAbilityProcedure({
        create: async () => ({ can: false }),
        check: ability => ability.can,
      }).query(() => 'ok'),
    })
    const caller = testRouter.createCaller({ session })

    let code: string | null = null
    try {
      await caller.ability()
    } catch (error) {
      code = (error as { code?: string }).code ?? null
    }

    expect(code).toBe('FORBIDDEN')
  })

  test('checkAbilityInputProcedure passes input to check', async () => {
    const testRouter = router({
      abilityInput: checkAbilityInputProcedure({
        input: z.object({ ownerId: z.string() }),
        create: async current => ({ userId: current.user.id }),
        check: (ability, input) => ability.userId === input.ownerId,
      }).query(({ input }) => input.ownerId),
    })
    const caller = testRouter.createCaller({ session })

    const allowed = await caller.abilityInput({ ownerId: 'user-1' })
    expect(allowed).toBe('user-1')

    let code: string | null = null
    try {
      await caller.abilityInput({ ownerId: 'other' })
    } catch (error) {
      code = (error as { code?: string }).code ?? null
    }

    expect(code).toBe('FORBIDDEN')
  })
})
