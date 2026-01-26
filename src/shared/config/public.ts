import { z } from 'zod'

const publicConfigSchema = z.object({
  isDev: z.boolean(),
  PUBLIC_URL: z.string(),
  STORAGE_BASE_URL: z.string().optional().default(''),
})

export const publicConfig = publicConfigSchema.parse({
  isDev: process.env.NODE_ENV === 'development',
  PUBLIC_URL: process.env.NEXT_PUBLIC_PUBLIC_URL,
  STORAGE_BASE_URL: process.env.NEXT_PUBLIC_STORAGE_BASE_URL,
})

export const DEAFAULT_LOGIN_REDIRECT = '/'
