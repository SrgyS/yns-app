---
date: 2026-02-25
planner: Codex
branch: feat/react-compiler
commit: c304731
feature: preview-img-support-chat
based_on: docs/ai/features/preview-img-support-chat/20-design.md
---

# Plan: preview-img-support-chat

## Summary
План разбивает работу на атомарные фазы: сначала additive Prisma-слой для `ChatAttachment` и инфраструктурные контракты, затем dual-write в сервисе сообщений, после этого переключение download route на table lookup + stream-first, далее кэш/rate-limit/security hardening, затем cleanup cron с distributed lock, и в конце backfill/переходный cleanup legacy JSON-зависимости. Каждая фаза independently committable и проверяется локально.

## Definition of Done
- Functional:
  - Attachment preview/open в support-chat работает через `/api/support-chat/attachments/:dialogId/:attachmentId` с lookup по `ChatAttachment`.
  - Новые вложения сохраняются в private bucket и связываются с сообщением в БД.
  - Endpoint поддерживает private-safe caching (`Cache-Control`, `ETag`, `Last-Modified`) и возвращает `304`.
  - Реализован cleanup staged attachments через cron script с distributed lock.
- Technical:
  - Prisma-изменения additive, индексы и FK добавлены.
  - Route не сканирует `ChatMessage.attachments` JSON и использует stream-first read path.
  - Rate limiting для attachment endpoint реализован.
  - Сохранена совместимость текущего UI контракта (URL endpoint без изменений).
- Docs:
  - Обновлен `docs/ai/features/preview-img-support-chat/40-impl-log.md` по фазам.
  - Подготовлен `docs/ai/features/preview-img-support-chat/50-review.md` после реализации.

## Phase 0 (optional): Setup / scaffolding
Goal:
- Подготовить каркас для attachment persistence и cleanup orchestration без изменения runtime поведения.

Files:
- `src/entities/support-chat/module.ts`
- `src/shared/lib/file-storage/types.ts`
- `src/shared/config/private.ts`
- `.env.example`

Steps:
1. Добавить placeholder-типы для attachment read metadata (включая ETag/Last-Modified snapshot поля).
2. Подготовить env-переменные для cleanup lock (TTL/key namespace), без включения runtime job.
3. Обновить entity module для будущего `ChatAttachmentRepository` binding.

Local tests:
- `npm run lint`
- `npm run lint:types`

Acceptance criteria:
- Сборка/типизация проходят.
- Новые типы/конфиг доступны, но поведение приложения не меняется.

Commit message:
- `chore(preview-img-support-chat): scaffold attachment metadata contracts`

## Phase 1: Prisma model and repository for ChatAttachment
Goal:
- Добавить persistence-слой `ChatAttachment` со статусами lifecycle и индексами.

Files to change:
- `prisma/schema.prisma`
- `prisma/migrations/<timestamp>_add_support_attachment/*`
- `src/entities/support-chat/_domain/types.ts`
- `src/entities/support-chat/_repositories/support-attachment-repository.ts` (new)
- `src/entities/support-chat/module.ts`

Steps:
1. Добавить enum `ChatAttachmentStatus` (`UPLOADED`, `LINKED`).
2. Добавить model `ChatAttachment` с полями: `id`, `dialogId`, `messageId?`, `storagePath`, `mimeType`, `sizeBytes`, `originalName`, `createdByUserId`, `status`, `etag?`, `lastModified?`, `createdAt`, `updatedAt`.
3. Добавить FK/индексы: `(dialogId,id)`, `(messageId)`, `(status,createdAt)`.
4. Сгенерировать additive migration.
5. Реализовать repository методы: `createUploaded`, `linkToMessage`, `findByDialogAndId`, `listStaleUploaded`, `deleteByIds`.
6. Зарегистрировать repository в entity module.

Local tests:
- `npx prisma validate`
- `npx prisma generate`
- `npm run lint`
- `npm run lint:types`

Acceptance criteria:
- Prisma schema/migration применяются локально.
- Repository компилируется и доступен через DI.
- Индексы и FK соответствуют дизайну.

Commit message:
- `feat(preview-img-support-chat): add support attachment prisma model and repository`

## Phase 2: Dual-write in SupportChatService (upload lifecycle)
Goal:
- Встроить `ChatAttachment` lifecycle в send/create flows с dual-write (legacy JSON + table).

Files to change:
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_domain/attachment-schema.ts`
- `src/entities/support-chat/_repositories/support-message-repository.ts` (если нужен DTO mapping)
- `src/features/support-chat/module.ts` (DI injections)

Steps:
1. При upload attachment создавать `ChatAttachment` со статусом `UPLOADED`.
2. После успешного создания сообщения вызывать `linkToMessage` и переводить в `LINKED`.
3. Сохранить legacy JSON `attachments` в `ChatMessage` для переходной совместимости.
4. Сохранять snapshot `etag/lastModified` (если доступны от storage-провайдера) в attachment записи.
5. Обновить unit tests сервиса для attachment lifecycle.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test -- support-chat-service`

Acceptance criteria:
- Новые сообщения создают записи в `ChatAttachment`.
- Статусы корректно переходят `UPLOADED -> LINKED`.
- Текущий UI/DTO не ломаются благодаря dual-write.

Commit message:
- `feat(preview-img-support-chat): add dual-write attachment lifecycle in support chat service`

## Phase 3: Attachment route read-switch and stream-first delivery
Goal:
- Переключить `/api/support-chat/attachments/...` на lookup через `ChatAttachment` и stream response.

Files to change:
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/shared/lib/file-storage/types.ts`
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/lib/file-storage/_providers/supabase.ts`
- `src/shared/lib/file-storage/_model/create-storage.ts` (если нужен unified read contract)

Steps:
1. В route заменить `findAttachmentById` scan по `ChatMessage.attachments` на repository lookup `findByDialogAndId`.
2. Добавить stream-first path в file-storage read API (`downloadStreamByPath` или эквивалентный контракт).
3. Возвращать response с `Content-Type`, `Content-Disposition`, `Cache-Control: private`, `X-Content-Type-Options`.
4. Сохранить `404` cloaking для no-access/not-found.
5. Добавить integration/unit tests для route authz + table lookup.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test -- support-chat`

Acceptance criteria:
- Endpoint отдает вложение без JSON scan сообщений.
- Read path использует stream-first контракт.
- Authz/ownership поведение соответствует текущим правилам.

Commit message:
- `feat(preview-img-support-chat): switch attachment endpoint to table lookup and streaming`

## Phase 4: Caching, conditional requests, and rate limiting
Goal:
- Добавить private-safe caching и нагрузочные ограничители для attachment endpoint.

Files to change:
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/features/support-chat/_domain/*` (если нужен helper для conditional headers)
- `src/features/support-chat/_services/*` (если нужна shared limiter utility)

Steps:
1. Добавить `ETag`/`Last-Modified` заголовки из snapshot metadata (`ChatAttachment`).
2. Реализовать `If-None-Match`/`If-Modified-Since` -> `304`.
3. Добавить rate limiting per user+ip для attachment route (window + max requests).
4. Добавить ограничение параллельных скачиваний на пользователя (если предусмотрено дизайном фазы).
5. Обновить тесты на 304/429 сценарии.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test -- support-chat`

Acceptance criteria:
- Повторный запрос с валидными conditional headers возвращает `304`.
- При превышении лимита route возвращает `429`.
- Заголовки кэширования соответствуют дизайну.

Commit message:
- `feat(preview-img-support-chat): add conditional caching and rate limiting for attachment endpoint`

## Phase 5: Cleanup cron for staged/orphan attachments
Goal:
- Реализовать фоновую очистку stale `UPLOADED` attachments через cron script с distributed lock.

Files to change:
- `scripts/cleanup-support-chat-attachments.ts` (new)
- `package.json` (new script entry)
- `src/entities/support-chat/_repositories/support-attachment-repository.ts`
- `src/shared/config/private.ts`
- `.env.example`

Steps:
1. Добавить script, который:
   - берет distributed lock,
   - выбирает stale `UPLOADED` attachments,
   - удаляет объекты из storage,
   - удаляет/маркирует записи в БД.
2. Добавить lock TTL и retry-safe поведение.
3. Добавить dry-run режим для операционной проверки.
4. Документировать команду запуска и параметры.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test -- support-chat`

Acceptance criteria:
- Script idempotent при повторном запуске.
- При активном lock второй инстанс не выполняет cleanup.
- Очистка не затрагивает `LINKED` attachments.

Commit message:
- `feat(preview-img-support-chat): add staged attachment cleanup cron with distributed lock`

## Phase 6: Backfill and legacy dependency reduction
Goal:
- Подготовить миграцию/процедуру перехода для historical attachments и снизить зависимость от legacy JSON.

Files to change:
- `scripts/backfill-support-attachments.ts` (new)
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `docs/ai/features/preview-img-support-chat/40-impl-log.md`
- `docs/ai/features/preview-img-support-chat/50-review.md` (if available at phase close)

Steps:
1. Добавить backfill script: из `ChatMessage.attachments` -> `ChatAttachment` для исторических записей.
2. Выполнить read-path hard switch: route читает только `ChatAttachment`.
3. Сохранить explicit fallback policy (если backfill не завершен) как операционный toggle на rollout этапе.
4. Обновить документацию rollout/rollback и verification checklist.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test -- support-chat`

Acceptance criteria:
- Historical attachments доступны через новый lookup после backfill.
- Route не зависит от `ChatMessage.attachments` для новых/мигрированных данных.
- Документация rollout/rollback обновлена.

Commit message:
- `chore(preview-img-support-chat): backfill support attachments and finalize read path`

## Test plan (consolidated)
- Unit:
  - `SupportChatService` attachment lifecycle (`UPLOADED -> LINKED`).
  - Attachment metadata parser/DTO mapping.
  - Conditional request helpers (`ETag`/`Last-Modified`) and limiter helpers.
- Integration:
  - tRPC `sendMessage/createDialog` создают attachment rows.
  - Attachment route auth matrix: `USER owner`, `USER non-owner`, `STAFF with/without permission`, `ADMIN`.
  - Route responses: `200`, `304`, `404`, `429`.
  - Cleanup cron lock behavior and stale selection.
- E2E:
  - User отправляет вложение -> staff видит preview/open.
  - Staff reply с вложением -> user открывает preview.
  - Повторное открытие attachment с cache headers.

## Security checklist
- AuthZ:
  - Role checks (`ADMIN`/`STAFF+permission`) и ownership для `USER` на route и service слоях.
- IDOR:
  - Lookup attachment строго по `(dialogId, attachmentId)` + `404` cloaking.
- Validation:
  - zod + MIME/size/count validation для upload payload.
- Storage (if applicable):
  - `private` bucket для support-chat; выдача только через backend endpoint.
  - `Content-Type`, `Content-Disposition`, `nosniff` в route response.
- Secrets:
  - Storage credentials/lock config только в server-side env.

## Rollout / migration steps
- Steps:
  1. Deploy schema migration (`ChatAttachment` + enum/indexes).
  2. Deploy dual-write service changes.
  3. Run backfill script in controlled batches.
  4. Enable route read-switch to table lookup.
  5. Enable rate limit + conditional caching.
  6. Schedule cron cleanup with lock.
- Rollback:
  - Revert route to legacy JSON-read path (temporary fallback).
  - Disable dual-write to new table via feature toggle/config gate.
  - Keep additive schema; no destructive rollback on DB during incident.

## Risks
- R1: Incomplete backfill may leave part of historical attachments unreachable after hard switch.
- R2: Provider-specific stream behavior differences (MinIO/Supabase) may require adapter-level normalization.
- R3: Aggressive rate-limit tuning may impact legitimate preview-heavy sessions.
- R4: Cleanup cron misconfiguration may remove attachments too early if stale threshold is too low.

## Out-of-scope follow-ups
- F1: Full HTTP byte-range (`206`) support for large video/PDF previews.
- F2: Signed-URL offload mode (redirect) as optional path in addition to stream-first backend proxy.
- F3: Removal of legacy `ChatMessage.attachments` JSON column in a later deprecation migration.
