import { Prisma, PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}
// Создаем глобальный экземпляр PrismaClient с настройками пула соединений
export const dbClient = globalThis.prisma || new PrismaClient()

if(process.env.NODE_ENV !== 'production') {
  globalThis.prisma = dbClient
}

// Общие типы и type guard для работы с Prisma-клиентами
export type DbClient = PrismaClient | Prisma.TransactionClient

export function isPrismaClient(db: DbClient): db is PrismaClient {
  // Отличительный признак у корневого PrismaClient — наличие метода $connect
  return '$connect' in db
}
