---
date: 2026-02-24
planner: Codex
branch: feat/react-compiler
commit: 1562d21
feature: support-chat
based_on: docs/ai/features/support-chat/20-design.md
---

# Plan: support-chat

## Summary
План реализует support-chat поэтапно: сначала additive Prisma-изменения и entity-слой, затем tRPC use-cases и authz, после этого realtime/integrations (SSE, storage attachments, Telegram), далее отдельные UI-потоки для user и staff (общий inbox + визуальный маркер `hasUnansweredIncoming`), и в финале hardening/тесты/документация. Каждая фаза атомарна, independently committable и имеет локальные проверки.

## Definition of Done
- Functional:
  - Пользователь создает диалог и обменивается сообщениями с поддержкой.
  - Поддержка видит общий inbox, историю сообщений и может отвечать.
  - Есть read-индикаторы и визуальная пометка неотвеченных входящих.
  - Новые user-сообщения отправляют Telegram-уведомление.
  - Realtime-обновления доставляются через SSE.
- Technical:
  - tRPC контракты из дизайна реализованы.
  - AuthN/AuthZ и ownership checks покрывают все операции с `dialogId`.
  - Prisma migration additive, без breaking-изменений.
  - Кеширование/инвалидация реализованы по `docs/caching-strategy.md`.
- Docs:
  - Обновлен `.,...,,mjojy78uyfimpl-log.md` по факту выполнения фаз.
  - Добавлены заметки о rollout/rollback и операционных рисках.

## Phase 0 (optional): Setup / scaffolding
Goal:
- Подготовить feature scaffolding, DI registration и feature flag без изменения пользовательского поведения.

Files:
- `src/features/support-chat/module.ts`
- `src/features/support-chat/index.ts`
- `src/app/server.ts`
- `src/shared/config/public.ts` (или соответствующий env-access слой)
- `src/shared/config/private.ts` (если нужен server-only flag)

Steps:
1. Создать каркас feature-папки support-chat по FSD.
2. Добавить Inversify module с пустыми binding placeholders (controller/service/repositories).
3. Подключить module в `createServer()`.
4. Добавить `ENABLE_SUPPORT_CHAT` gate (default off) и helper для проверки флага.

Local tests:
- `npm run lint`
- `npm run lint:types`

Acceptance criteria:
- Сборка и типизация проходят.
- Feature выключена по умолчанию и не меняет текущие экраны/роуты.
- DI контейнер поднимается без runtime ошибок.

Commit message:
- `chore(support-chat): scaffold feature module and flag gate`

## Phase 1: Prisma schema and entity persistence
Goal:
- Ввести модели `ChatDialog`, `ChatMessage`, `SupportReadState` и repository-слой entities.

Files to change:
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_add_support_chat/*`
- `src/entities/support-chat/module.ts`
- `src/entities/support-chat/_repositories/support-conversation-repository.ts`
- `src/entities/support-chat/_repositories/support-message-repository.ts`
- `src/entities/support-chat/_repositories/support-read-state-repository.ts`
- `src/entities/support-chat/_domain/*` (типы/DTO)
- `src/features/admin-panel/users/_domain/types.ts` (или соответствующий тип permissions)

Steps:
1. Добавить Prisma enums/models и индексы из дизайна (без статусов/assignment).
2. Добавить `canManageSupportChats` в `StaffPermission`.
3. Сгенерировать migration (additive only).
4. Реализовать entity repositories с методами: create/find dialogs, create/list messages, upsert read state, unread counters.
5. Зарегистрировать `SupportChatEntityModule` в DI.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run prisma:generate`
- `npm run prisma:migrate:dev` (локально)

Acceptance criteria:
- БД поднимается с новой миграцией без ручных правок.
- Репозитории возвращают типизированные DTO и не нарушают FSD/DI правила.
- Статусы/SLA и assignment поля отсутствуют в схеме.

Commit message:
- `feat(support-chat): add prisma models and entity repositories`

## Phase 2: tRPC contracts and core use-cases
Goal:
- Реализовать tRPC router + service-слой для базовых операций чата с authz/ownership.

Files to change:
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_services/support-chat-read-service.ts`
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_domain/errors.ts`
- `src/features/support-chat/module.ts`
- `src/kernel/lib/trpc/_controller.ts` (только если нужны shared updates)

Steps:
1. Реализовать процедуры: `createDialog`, `sendMessage`, `markDialogRead`, `userListDialogs`, `userGetMessages`, `staffListDialogs`.
2. Добавить zod validation, доменные ошибки и deterministic mapping в `TRPCError`.
3. Реализовать authz:
   - user ownership по `dialog.userId == session.user.id`
   - staff role/permission: `ADMIN` или `STAFF` + `canManageSupportChats`
4. Реализовать вычисление `hasUnansweredIncoming` для staff inbox.
5. Подключить router в DI-контроллеры и убедиться, что роут виден через общий `/api/trpc` merge.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test -- support-chat` (если появятся unit/integration для сервисов)

Acceptance criteria:
- Все процедуры из дизайна доступны и типизированы.
- Нельзя прочитать/изменить чужой диалог через подмену `dialogId`.
- `staffListDialogs` поддерживает фильтр `hasUnansweredIncoming`.

Commit message:
- `feat(support-chat): implement trpc router and service authz flows`

## Phase 3: Attachments, SSE realtime, Telegram notifier
Goal:
- Добавить вложения, SSE обновления и Telegram уведомления на новые user-сообщения.

Files to change:
- `src/features/support-chat/_integrations/telegram-support-notifier.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/app/api/support-chat/events/route.ts`
- `src/features/support-chat/_domain/attachment-schema.ts`
- `src/shared/lib/file-storage/*` (только при необходимости расширения контрактов)
- `src/shared/config/private.ts` (telegram/env keys при необходимости)

Steps:
1. Добавить attachment validation (mime/size/count) и загрузку через существующий file-storage abstraction.
2. Реализовать приватный доступ к attachment (server-side proxy или signed URL strategy по дизайну).
3. Реализовать SSE endpoint и публикацию событий `dialog.created`, `message.created`, `read.updated`.
4. Добавить Telegram notifier для новых user-сообщений (fail-safe: не ломает основной tx).
5. Интегрировать invalidation triggers под SSE события.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test -- support-chat`

Acceptance criteria:
- Сообщение с вложением сохраняется и корректно читается при повторной загрузке страницы.
- Подписанный клиент получает realtime event без ручного refresh.
- При падении Telegram API основная отправка сообщения остается успешной, ошибка логируется.

Commit message:
- `feat(support-chat): add attachments sse and telegram notifications`

## Phase 4: User chat UI (platform)
Goal:
- Реализовать пользовательский интерфейс диалогов и сообщений с кешированием и read-индикаторами.

Files to change:
- `src/features/support-chat/user-chat/_ui/*`
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/_api.ts`
- `src/app/platform/*` (точка встраивания user chat page)
- `src/shared/lib/cache/cache-invalidation.ts` (если добавляются group keys)

Steps:
1. Реализовать user dialogs list + thread view + composer (text + attachments).
2. Подключить React Query keys/invalidation по стратегии `FREQUENT_UPDATE`.
3. Подключить SSE subscription и targeted refetch/invalidations.
4. Реализовать mark-as-read триггеры (open thread, scroll to latest).
5. Добавить feature flag gate для user entrypoint.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test -- support-chat`

Acceptance criteria:
- User может создать диалог, отправить сообщение и увидеть ответ staff.
- Read-индикатор обновляется без полного reload.
- UI корректно работает в light/dark theme и не ломает существующие страницы.

Commit message:
- `feat(support-chat): add user chat interface and query wiring`

## Phase 5: Staff inbox UI (admin) with unanswered marker
Goal:
- Реализовать staff-интерфейс общего inbox с визуальной пометкой `hasUnansweredIncoming`.

Files to change:
- `src/features/support-chat/admin-chat/_ui/*`
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/app/(admin)/admin/*` (точка встраивания support inbox)
- `src/features/admin-panel/users/_domain/ability.ts` (или соответствующий ability слой)

Steps:
1. Добавить admin inbox list + thread panel с пагинацией.
2. Визуально отобразить `hasUnansweredIncoming` (badge/highlight) без SLA-статусов.
3. Подключить staff filter `hasUnansweredIncoming`.
4. Встроить permission gate в admin UI (скрытие/блокировка при отсутствии `canManageSupportChats`).
5. Подключить realtime обновления через SSE.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test -- support-chat`

Acceptance criteria:
- Staff видит общий inbox всех диалогов.
- Диалоги с неотвеченными входящими явно помечены на фронте.
- Unauthorized staff не получает доступ к inbox и API.

Commit message:
- `feat(support-chat): add admin inbox with unanswered marker`

## Phase 6: Hardening, tests, docs, rollout prep
Goal:
- Закрыть тестовый, security и документационный контур перед включением флага.

Files to change:
- `tests/**` (unit/integration)
- `playwright/**` (smoke e2e для chat happy path)
- `docs/ai/features/support-chat/40-impl-log.md`
- `docs/ai/features/support-chat/50-review.md` (после реализации/ревью)
- `.env.example` (если добавлены переменные)

Steps:
1. Добавить unit tests для service authz/ownership и unread logic.
2. Добавить integration tests для tRPC error mapping (`UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`).
3. Добавить e2e smoke: user sends -> staff sees -> staff replies -> user sees read/unread updates.
4. Проверить миграции/rollback процедуру на staging-like окружении.
5. Заполнить impl log и подготовить материал для review.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test`
- `npm run test:e2e` (при готовом окружении БД)

Acceptance criteria:
- Тесты покрывают критические сценарии authz/idor/realtime/error mapping.
- Документация по фазам обновлена, rollout/rollback шаги валидированы.
- Feature готова к controlled enable через `ENABLE_SUPPORT_CHAT`.

Commit message:
- `chore(support-chat): finalize tests security checks and rollout docs`

## Test plan (consolidated)
- Unit:
  - `SupportChatService`: ownership checks, `hasUnansweredIncoming` computation, read state transitions.
  - Attachment validator: mime/size/count boundaries.
- Integration:
  - tRPC procedures: success + `UNAUTHORIZED` + `FORBIDDEN` + `BAD_REQUEST`.
  - Repository + Prisma: pagination stability, unread counters, read-state upsert.
  - SSE stream: event emission on create/send/read.
- E2E:
  - User creates dialog and sends message with/without attachment.
  - Staff sees message in shared inbox with unanswered marker, replies.
  - User receives reply and read indicators update in UI.

## Security checklist
- AuthZ:
  - Все staff endpoints проверяют `ADMIN` или `STAFF + canManageSupportChats`.
  - Все user endpoints берут identity только из session.
- IDOR:
  - Каждый `dialogId` проходит ownership/permission check до доступа к messages/read state.
- Validation:
  - zod валидация на всех процедурах; запрет пустого сообщения без вложений.
  - Ограничения длины текста, количества и размера вложений.
- Storage (if applicable):
  - Приватный bucket, хранение object keys вместо публичных URL.
  - Выдача через signed/proxy access с коротким TTL.
- Secrets:
  - Telegram token и storage credentials только в server env; нет утечки в client.

## Rollout / migration steps
- Steps:
  1. Применить Prisma migration в preprod/prod.
  2. Деплой backend (router/service/SSE) с `ENABLE_SUPPORT_CHAT=false`.
  3. Включить feature flag для internal staff, проверить inbox/Telegram/realtime.
  4. Включить feature flag для user audience.
- Rollback:
  1. Выключить `ENABLE_SUPPORT_CHAT`.
  2. Откатить приложение до предыдущего релиза (БД migration additive, downgrade schema не требуется немедленно).
  3. При необходимости отключить SSE route и Telegram notifier env.

## Risks
- R1: SSE без внешнего брокера может иметь ограничения при горизонтальном масштабировании.
- R2: Attachment upload path может давать высокую латентность и перегрузку при больших файлах.
- R3: Неполная синхронизация invalidation + SSE может вызвать временные UI-рассинхроны unread-маркеров.
- R4: Без выделенного download/preview access layer для вложений есть риск плохого UX и ошибок доступа к файлам.

## Out-of-scope follow-ups
- F1: SLA-статусы и workflow (`NEW/IN_PROGRESS/WAITING_USER`).
- F2: Assignment/ownership диалогов между конкретными staff-агентами.
- F3: Выделенный rate limit для `supportChat.sendMessage`.
- F4: Вынести in-memory SSE event bus в внешний pub/sub (Redis/NATS/Kafka) для корректной multi-instance доставки realtime событий.
- F5: Добавить полноценный доступ к вложениям из чата: signed/proxy download endpoint с authz/ownership проверкой + UI preview (`image/*`, `video/*`, `application/pdf`) в user/admin чатах.
