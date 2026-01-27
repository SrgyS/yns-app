import { z } from 'zod'

const publicConfigSchema = z.object({
  isDev: z.boolean(),
  PUBLIC_URL: z.string(),
  IMAGE_BASE_URL: z.string().optional().default(''),
})

export const publicConfig = publicConfigSchema.parse({
  isDev: process.env.NODE_ENV === 'development',
  PUBLIC_URL: process.env.NEXT_PUBLIC_PUBLIC_URL,
  IMAGE_BASE_URL: process.env.NEXT_PUBLIC_IMAGE_URL,
})

export const DEAFAULT_LOGIN_REDIRECT = '/'
