import { Prisma, PrismaClient } from '@prisma/client'

// Создаем глобальный экземпляр PrismaClient с настройками пула соединений
export const dbClient = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Общие типы и type guard для работы с Prisma-клиентами
export type DbClient = PrismaClient | Prisma.TransactionClient

export function isPrismaClient(db: DbClient): db is PrismaClient {
  // Отличительный признак у корневого PrismaClient — наличие метода $connect
  return '$connect' in db
}

// Graceful shutdown для правильного закрытия соединений
if (typeof window === 'undefined') {
  const gracefulShutdown = async () => {
    console.log('Закрытие соединений с базой данных...')
    await dbClient.$disconnect()
    process.exit(0)
  }

  process.on('SIGINT', gracefulShutdown)
  process.on('SIGTERM', gracefulShutdown)
  process.on('beforeExit', gracefulShutdown)
}
