import { Prisma, PrismaClient } from '@prisma/client'

// Создаем глобальный экземпляр PrismaClient
export const dbClient = new PrismaClient()

// Общие типы и type guard для работы с Prisma-клиентами
export type DbClient = PrismaClient | Prisma.TransactionClient

export function isPrismaClient(db: DbClient): db is PrismaClient {
  // Отличительный признак у корневого PrismaClient — наличие метода $connect
  return '$connect' in db
}
