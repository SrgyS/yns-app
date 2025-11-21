import { injectable } from 'inversify'
import { dbClient, type DbClient } from '@/shared/lib/db'

export type UserAccessHistoryAction =
  | 'grant' // выдача доступа
  | 'extend' // продление
  | 'close' // закрытие
  | 'change_period' // изменение дат доступа
  | 'freeze' // заморозка доступа
  | 'freeze_cancel' // отмена заморозки
  | 'save' // технические/устаревшие обновления

type LogEntry = {
  userAccessId: string
  action: UserAccessHistoryAction
  adminId?: string
  payload?: Record<string, unknown>
}

/**
 * Поле payload содержит снимок ключевых параметров изменения UserAccess.
 *
 * Основная идея: помимо action и adminId, история изменений должна сохранять
 * конкретные значения, установленные при выполнении действия.
 *
 * Примеры использования:
 * - При выдаче доступа: reason, expiresAt, enrollmentId, setupCompleted
 * - При продлении доступа: новая дата окончания
 * - При изменении статуса: новые флаги и параметры
 *
 * Преимущества подхода:
 * - Гибкость: можно добавлять новые поля без изменения схемы БД
 * - Аудит: полная картина изменений в одном месте
 * - Совместимость: работает с Prisma JSON через сериализацию дат в ISO-формат
 *
 * Важно: перед сохранением объект сериализуется с преобразованием Date → ISO string
 * для обеспечения валидности JSON в БД.
 */

@injectable()
export class LogUserAccessHistoryService {
  async log(entry: LogEntry, db: DbClient = dbClient) {
    const payload = entry.payload
      ? JSON.parse(
          JSON.stringify(entry.payload, (_key, value) =>
            value instanceof Date ? value.toISOString() : value
          )
        )
      : null

    await db.userAccessHistory.create({
      data: {
        userAccessId: entry.userAccessId,
        action: entry.action,
        adminId: entry.adminId ?? null,
        payload,
      },
    })
  }
}
