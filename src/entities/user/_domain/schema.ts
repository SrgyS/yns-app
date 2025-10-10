import { SchemaOf } from '@/shared/lib/zod'
import { z } from 'zod'
import { Profile } from './types'

export const profileSchema = z.object({
  email: z.string().email(),
  name: z
    .string()
    .trim()
    .max(20, {
      message: 'Длина имени пользователя не должна превышать 20 символов',
    })
    .nullable()
    .optional(),
  image: z.string().nullable().optional(),
}) satisfies SchemaOf<Profile>
