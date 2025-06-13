import { PrismaClient } from '@/services/db/generated/prisma'

// Создаем глобальный экземпляр PrismaClient
export const dbClient = new PrismaClient()
