# Activity tracker

Храним активность через JWT сессии без таблицы `Session`.

## Что сохраняется
- Метка `lastActivityAt` в `User`.
- Логи посещений в `UserActivity` (`path`, `menu`, `createdAt`).
- Дневные отметки платного контента в `UserPaidActivity` (`date` — начало суток UTC, `path`/`menu` последнего визита за день).

## Как работает
- Клиент: `ActivityTracker` (подключён в `src/app/_providers/app-provider.tsx`) слушает `usePathname()` и шлёт POST `/api/activity` на смену пути, не чаще одного раза в 30 секунд. Если страница рендерится из группы `(paid)`, `PaidActivityFlag` (подключён в `src/app/(private)/(paid)/layout.tsx`) проставляет глобальный флаг, и запрос помечается как платный.
- API: `src/app/api/activity/route.ts` проверяет сессию через NextAuth JWT, обновляет `lastActivityAt` и пишет запись в `UserActivity`. Если передан флаг `paid`, делает upsert в `UserPaidActivity` по ключу `(userId, date)` — максимум одна запись на день, путь/раздел обновляются до последнего визита.
- Админка: `GetAdminUserDetailService` берёт `lastActivityAt` из `User.lastActivityAt`, затем из последней `UserActivity`, далее из `updatedAt/createdAt`. Таб «Активность» показывает дневные записи из `UserPaidActivity`.

## Расширение
- Логировать клики по пунктам меню: отправляйте `fetch('/api/activity', { menu: 'courses' })` или добавьте параметр `menu` в существующий вызов на клике.
- Тонкая настройка частоты: поменяйте `MIN_INTERVAL_MS` в `ActivityTracker`.
- Долгие операции: можно отправлять `path` вручную на завершении действий, если нет смены маршрута.
- Если нужно фиксировать только платные заходы: фильтруйте вызовы в `ActivityTracker` и/или на сервере, оставляя `/private` и `/paid`.

## Миграции и деплой
- Перед запуском примените схему: `npx prisma migrate dev --name add-user-activity-log` (или `prisma migrate deploy` на проде).
- Убедитесь, что NextAuth остаётся в `session.strategy = 'jwt'`; таблица `Session` не используется.
