import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const envFilesInPriorityOrder = [
  '.env.example',
  '.env',
  '.env.local',
  '.env.test',
  '.env.test.local',
]

for (const envFile of envFilesInPriorityOrder) {
  const envFilePath = path.resolve(process.cwd(), envFile)

  if (fs.existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath })
  }
}

const testDefaults: Record<string, string> = {
  NODE_ENV: 'test',
  NEXT_PUBLIC_PUBLIC_URL: 'http://localhost:3000',
  RESEND_API_KEY: 're_test_key',
}

for (const [key, value] of Object.entries(testDefaults)) {
  process.env[key] ??= value;
}
