---
date: 2026-03-05
planner: Codex
branch: feat/react-compiler
commit: f8271b9
feature: chat-optimistic-update
based_on: docs/ai/features/chat-optimistic-update/20-design.md
---

# Plan: chat-optimistic-update

## Summary
План реализует optimistic send с `clientMessageId` поэтапно: сначала additive Prisma-схема и migration для idempotency, затем серверные контракты и сервисная дедупликация (tRPC/service/repository/SSE), после этого клиентский optimistic lifecycle (`sending/sent/failed` + retry + merge), и в финале тесты/документация. Каждая фаза атомарна, independently committable и может проверяться локально.

## Definition of Done
- Functional:
  - Сообщение появляется мгновенно после submit со статусом `sending`.
  - Reconciliation по `clientMessageId` устраняет дубли между optimistic cache, mutation response, SSE и refetch.
  - При ошибке отправки сообщение получает статус `failed`; доступны действия `Повторить` (с тем же `clientMessageId`) и `Отмена` (удаляет failed сообщение из UI).
  - `clientMessageId` присутствует на уровне message DTO и не добавляется в dialog preview DTO.
- Technical:
  - `ChatMessage` содержит `clientMessageId` + уникальность `(dialogId, clientMessageId)`.
  - `sendMessage` принимает `clientMessageId` optional (совместимость), клиент всегда отправляет.
  - Сохранены текущие auth/ACL, FSD layering, DI wiring.
- Docs:
  - Актуализированы design/plan/impl-log артефакты для feature.

## Phase 1: Prisma schema and migration for clientMessageId
Goal:
- Добавить persistence-основу для message correlation и idempotency.

Files to change:
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_chat_message_client_message_id/migration.sql`

Steps:
1. В `ChatMessage` добавить `clientMessageId String?`.
2. Добавить уникальный композитный индекс/constraint на `(dialogId, clientMessageId)`.
3. Подготовить SQL migration:
- add nullable column,
- backfill legacy rows значениями `legacy_<id>` (или эквивалентным детерминированным шаблоном),
- apply unique constraint.
4. Проверить, что миграция additive и не ломает текущие foreign keys/indexes.

Local tests:
- `npm run lint:types`
- `npm run lint`
- `npx prisma validate`

Acceptance criteria:
- Prisma schema компилируется.
- Миграция применима на локальной БД без удаления данных.
- В таблице `ChatMessage` есть поле `clientMessageId`, уникальность `(dialogId, clientMessageId)` соблюдается.

Commit message:
- `feat(chat): add clientMessageId to ChatMessage with unique dialog correlation`

## Phase 2: Server contract and idempotent send path
Goal:
- Реализовать server-side correlation/idempotency и вернуть `clientMessageId` в message-level DTO.

Files to change:
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/entities/support-chat/_repositories/chat-message-repository.ts`
- `src/entities/support-chat/_domain/types.ts` (если требуется расширение entity type)
- `src/features/support-chat/_domain/errors.ts` и/или `src/features/support-chat/_domain/error-mapping.ts` (только если нужны новые коды)

Steps:
1. Расширить `sendMessageInputSchema` полем `clientMessageId?: string` с ограничениями длины/формата.
2. Обновить controller input forwarding в `supportChat.sendMessage`.
3. Добавить repository-метод поиска message по `(dialogId, clientMessageId)`.
4. В `SupportChatService.sendMessage`:
- нормализовать/генерировать `clientMessageId` при отсутствии,
- сначала искать существующее сообщение по `(dialogId, clientMessageId)`,
- при наличии возвращать existing message DTO (idempotent path),
- при отсутствии создавать новое сообщение с `clientMessageId`.
5. Обновить response DTO `sendMessage` и `userGetMessages` так, чтобы message-level включал `clientMessageId`.
6. Обновить unit/spec тесты сервиса/схем на новые поля и idempotent behavior.

Local tests:
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat-service`
- `npm run test -- support-chat-read-service`

Acceptance criteria:
- `sendMessage` принимает запросы как с `clientMessageId`, так и без него.
- Повторный вызов с тем же `(dialogId, clientMessageId)` не создаёт дубль в БД.
- Message DTO из `sendMessage`/`userGetMessages` содержит `clientMessageId`.

Commit message:
- `feat(chat): implement idempotent sendMessage with clientMessageId`

## Phase 3: SSE payload enrichment and reconciliation support
Goal:
- Передавать correlation данные через realtime-события и сохранить совместимость.

Files to change:
- `src/features/support-chat/_integrations/support-chat-events.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/app/api/support-chat/events/route.ts`
- `src/features/support-chat/_vm/use-support-chat.ts` (SSE handler compatibility path)

Steps:
1. Расширить тип `SupportChatEvent` для `message.created` message-level payload (`id`, `clientMessageId`, `senderType`, `text`, `createdAt`).
2. В `sendMessage`/`createDialog` публиковать enriched event payload для `message.created`.
3. Сохранить совместимость SSE route serialization/filtering.
4. На клиенте в SSE handler добавить merge/reconcile path по `clientMessageId`, оставив fallback invalidation для legacy payload.

Local tests:
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat`

Acceptance criteria:
- `message.created` содержит `clientMessageId` в новой схеме.
- Клиент корректно обрабатывает как enriched, так и legacy payload.
- Дубликаты не появляются при сценарии «SSE пришёл раньше mutation success».

Commit message:
- `feat(chat): enrich support chat SSE message.created with client correlation`

## Phase 4: Client optimistic lifecycle (sending/sent/failed + retry)
Goal:
- Внедрить optimistic UX и message status machine в user/admin chat UI.

Files to change:
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/_ui/support-chat-conversation-card.tsx`
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
- при необходимости: `src/features/support-chat/_domain/*` для typed optimistic message helpers

Steps:
1. В `useSupportChatActions().sendMessage` добавить mutation lifecycle:
- `onMutate`: генерировать `tmp_<uuid>` `clientMessageId`, вставлять optimistic message в cache (`status: sending`),
- `onSuccess`: reconcile optimistic message (`id -> serverId`, `status: sent`),
- `onError`: помечать message `status: failed`,
- `onSettled`: текущие invalidations.
2. Добавить retry action: повторный `sendMessage` с тем же `clientMessageId`.
3. Обновить conversation UI:
- `sending`: opacity 0.6 + `Clock` icon 16px,
- `failed`: `AlertCircle` + controls `Повторить` и `Отмена`,
- `sent`: убрать индикаторы.
4. Обеспечить, что `clientMessageId` всегда передаётся клиентом (Q2: без изменений dialog preview DTO).
5. Сохранить поведение без TTL: failed message остаётся до user action.
6. Реализовать `Отмена` для failed message: удаление optimistic записи из cache/UI без серверного запроса.

Local tests:
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat`

Acceptance criteria:
- После submit пользователь видит message мгновенно со статусом `sending`.
- При успехе статус становится `sent` без дубля.
- При ошибке статус `failed`; `Повторить` работает с тем же `clientMessageId`, `Отмена` удаляет failed сообщение из UI.
- Нет `clientMessageId` в dialog preview DTO.

Commit message:
- `feat(chat): add optimistic send lifecycle with clientMessageId reconciliation`

## Phase 5: Regression tests, docs sync, and release readiness
Goal:
- Зафиксировать покрытие ключевых сценариев и синхронизировать feature docs.

Files to change:
- `src/features/support-chat/_services/support-chat-service.spec.ts`
- `src/features/support-chat/_domain/*.spec.ts` (если добавлены/обновлены)
- `docs/ai/features/chat-optimistic-update/40-impl-log.md` (при выполнении реализации)
- при необходимости: `docs/ai/features/chat-optimistic-update/20-design.md` (только factual sync)

Steps:
1. Добавить/обновить тест-кейсы:
- idempotent повторная отправка,
- optimistic reconcile (mutation success/SSE-first race),
- failed + retry.
2. Проверить end-to-end consistency invalidation и отсутствие дублей вручную на user/admin страницах.
3. Подготовить impl-log с фактическими изменениями и результатами тестов.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test`
- (если доступно) `npm run test:e2e`

Acceptance criteria:
- Все новые сценарии покрыты тестами и проходят локально.
- Документация по фазам отражает фактическое состояние реализации.

Commit message:
- `test(chat): cover optimistic send correlation and dedupe scenarios`

## Test plan (consolidated)
- Unit:
  - schema validation for optional `clientMessageId`.
  - service idempotency: same `(dialogId, clientMessageId)` returns existing message.
  - error path: storage failure marks optimistic message failed on client side reducer/helper.
- Integration:
  - tRPC `sendMessage` round-trip with and without `clientMessageId`.
  - SSE event payload includes `clientMessageId` and is consumed by client merge path.
- E2E:
  - user send message: immediate optimistic render, then `sent`.
  - forced mutation error: `failed` + retry recovery.
  - forced mutation error: `failed` + cancel removes failed message from UI.
  - race: SSE before mutation response does not create duplicate message.

## Security checklist
- AuthZ:
  - `authorizedProcedure` and `assertDialogAccess` remain unchanged and covered in regression checks.
- IDOR:
  - idempotency lookup always scoped by `dialogId` after access validation.
- Validation:
  - zod validates `clientMessageId` format/size; text/attachment constraints preserved.
- Storage (if applicable):
  - no change in private upload/download policy and attachment ACL checks.
- Secrets:
  - no new secrets/env vars; existing config only.

## Rollout / migration steps
- Steps:
1. Apply Prisma migration adding `clientMessageId` and unique composite.
2. Deploy server changes (optional input + idempotent send + enriched SSE payload).
3. Deploy client optimistic lifecycle (always sends `clientMessageId`).
4. Verify manually on `/platform/(profile)/support-chat` and `/admin/support-chat`.
- Rollback:
1. Roll back client optimistic UI first if UI regression.
2. Roll back server logic while keeping additive DB migration.
3. Keep DB schema as-is; no destructive rollback on chat tables.

## Risks
- R1: Некорректный merge ключей может приводить к «залипшим» optimistic сообщениями в статусе `sending`.
- R2: Неконсистентность between legacy SSE payload и enriched payload может вызвать временное двойное invalidate/merge поведение.

## Out-of-scope follow-ups
- F1: Вынести in-process SSE bus в shared broker (Redis/NATS) для multi-instance realtime consistency.
- F2: Добавить телеметрию по optimistic lifecycle (`send_attempt`, `send_failed`, `retry_success`).
