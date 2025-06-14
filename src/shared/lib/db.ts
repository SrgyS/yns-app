import { PrismaClient } from '@prisma/client'

// Создаем глобальный экземпляр PrismaClient
export const dbClient = new PrismaClient()
