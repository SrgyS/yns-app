import { defineConfig } from 'prisma/config'
import 'dotenv/config'

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    seed: 'ts-node --project tsconfig.script.json prisma/seed.ts',
    path: './prisma/migrations',
  },
})
