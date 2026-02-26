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
  S3_PUBLIC_BUCKET: z.string().optional(),
  S3_PRIVATE_BUCKET: z.string().optional(),
  S3_IMAGES_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string(),
  S3_REGION: z.string(),

  SUPABASE_URL: z.string(),
  SUPABASE_SERVICE_KEY: z.string(),
  SUPABASE_PUBLIC_BUCKET: z.string().optional(),
  SUPABASE_PRIVATE_BUCKET: z.string().optional(),
  SUPABASE_IMAGE_BUCKET: z.string().optional(),

  CONTENT_URL: z.string(),
  CONTENT_TOKEN: z.string().optional(),

  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),
  SUPPORT_CHAT_ENABLED: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  SUPPORT_CHAT_ATTACHMENT_CLEANUP_STALE_MINUTES: z.string().optional(),
  SUPPORT_CHAT_ATTACHMENT_CLEANUP_BATCH_SIZE: z.string().optional(),
  SUPPORT_CHAT_ATTACHMENT_CLEANUP_LOCK_KEY: z.string().optional(),
  SUPPORT_CHAT_ATTACHMENT_BACKFILL_BATCH_SIZE: z.string().optional(),
  SUPPORT_CHAT_ATTACHMENT_BACKFILL_LOCK_KEY: z.string().optional(),

  PRODAMUS_DEMO_ENABLED: z
    .string()
    .optional()
    .transform(val => val === 'true'),
  PRODAMUS_URL: z.string().optional(),
  PRODAMUS_KEY: z.string().optional(),
})

export const privateConfig = privateConfigSchema.parse(process.env)
