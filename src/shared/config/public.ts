import { z } from 'zod'

const publicConfigSchema = z.object({
  isDev: z.boolean(),
  PUBLIC_URL: z.string(),
  IMAGE_BASE_URL: z.string().optional().default(''),
  ENABLE_SUPPORT_CHAT: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  BUCKETS: z.object({
    MAIN: z.string(),
  }),
})

export const publicConfig = publicConfigSchema.parse({
  isDev: process.env.NODE_ENV === 'development',
  PUBLIC_URL: process.env.NEXT_PUBLIC_PUBLIC_URL,
  IMAGE_BASE_URL: process.env.NEXT_PUBLIC_IMAGE_URL,
  ENABLE_SUPPORT_CHAT: process.env.NEXT_PUBLIC_ENABLE_SUPPORT_CHAT,
  BUCKETS: {
    MAIN: process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET || 'images',
  },
})

export const DEAFAULT_LOGIN_REDIRECT = '/'
