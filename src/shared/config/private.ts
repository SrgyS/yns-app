import { z } from 'zod'

const privateConfigSchema = z.object({
  ADMIN_EMAILS: z.string().optional(),
  TEST_EMAIL_TOKEN: z.string().optional(),

  GITHUB_ID: z.string().optional(),
  GITHUB_SECRET: z.string().optional(),

  GOOGLE_ID: z.string().optional(),
  GOOGLE_SECRET: z.string().optional(),

  EMAIL_SERVER_USER: z.string(),
  EMAIL_SERVER_PASSWORD: z.string(),
  EMAIL_SERVER_HOST: z.string(),
  EMAIL_SERVER_PORT: z.string(),
  EMAIL_FROM: z.string(),

  S3_ACCESS_KEY_ID: z.string(),
  S3_SECRET_ACCESS_KEY: z.string(),
  S3_IMAGES_BUCKET: z.string(),
  S3_ENDPOINT: z.string(),
  S3_REGION: z.string(),

  SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_KEY: z.string(),
  SUPABASE_IMAGE_BUCKET: z.string(),

  CONTENT_URL: z.string(),
  CONTENT_TOKEN: z.string().optional(),
})

export const privateConfig = privateConfigSchema.parse(process.env)
