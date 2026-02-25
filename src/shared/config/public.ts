import { z } from 'zod'

const publicConfigSchema = z.object({
  isDev: z.boolean(),
  PUBLIC_URL: z.string(),
  IMAGE_BASE_URL: z.string().optional().default(''),
  BUCKETS: z.object({
    MAIN: z.string(),
  }),
})

export const publicConfig = publicConfigSchema.parse({
  isDev: process.env.NODE_ENV === 'development',
  PUBLIC_URL: process.env.NEXT_PUBLIC_PUBLIC_URL,
  IMAGE_BASE_URL: process.env.NEXT_PUBLIC_IMAGE_URL,
  BUCKETS: {
    MAIN: process.env.NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET || 'images',
  },
})

export const DEAFAULT_LOGIN_REDIRECT = '/'
