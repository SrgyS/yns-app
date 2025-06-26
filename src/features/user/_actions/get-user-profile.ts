'use server'
import { z } from 'zod'

import { getAppSessionStrictServer } from '../../../kernel/lib/next-auth/server'
import { profileSchema } from '../_domain/schema'
import { getUserService } from '@/features/user/_services/get-user'

const propsSchema = z.object({
  userId: z.string(),
})

const resultSchema = z.object({
  profile: profileSchema,
})

export const getUserProfileAction = async (props: z.infer<typeof propsSchema>) => {
  const { userId } = propsSchema.parse(props)

  const session = await getAppSessionStrictServer()

  const user = await getUserService.exec({
    session,
    userId,
  })

  return resultSchema.parseAsync({
    profile: user,
  })
}
