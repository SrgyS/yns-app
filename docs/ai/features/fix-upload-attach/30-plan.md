---
date: 2026-03-06
planner: Codex
branch: feat/react-compiler
commit: 90d25da
feature: fix-upload-attach
based_on: docs/ai/features/fix-upload-attach/20-design.md
---

# Plan: fix-upload-attach

## Summary
План разбивает реализацию на независимые фазы: сначала backend upload pipeline в `/api/support-chat/uploads` с timeout/abort и metadata persistence, затем server contract refactor для message attachment refs (без base64), далее client refactor (pre-validation, object URL lifecycle, preview guard `10MB`, lightweight optimistic attachments), после этого TTL cleanup cron для unlinked uploads, и в конце полное regression/testing + документация. Каждая фаза может быть закоммичена отдельно и проверяется локально.

## Definition of Done
- Functional:
- Attach file >25MB блокируется на клиенте до upload/read.
- Attach video 10-25MB отображается как file card (без inline `<video>`).
- Attach video <=10MB отображается inline preview.
- Message send/createDialog не передают `base64`; используют attachment refs.
- Optimistic message attachments не содержат binary payload.
- `/api/support-chat/uploads` обрабатывает upload с timeout/abort policy и сохраняет `ChatAttachment` в `UPLOADED`.
- TTL cleanup job удаляет stale unlinked (`UPLOADED`) attachments из storage + DB.
- Technical:
- Удалена поддержка legacy `attachments[].base64` из активного server/client контракта.
- Сохранены auth/authz/ownership правила и trusted-origin protection.
- Нет изменений Prisma schema (используются текущие модели/индексы).
- Docs:
- Обновлены `30-plan.md` и `40-impl-log.md` по фактически выполненным фазам.

## Phase 1: Upload API namespace with hard timeout/abort policy
Goal:
- Ввести отдельный backend endpoint `/api/support-chat/uploads` для бинарной загрузки вложений до отправки сообщения.

Files to change:
- `src/app/api/support-chat/uploads/route.ts` (new)
- `src/features/support-chat/_domain/attachment-schema.ts`
- `src/features/support-chat/_domain/errors.ts` (если нужны коды для upload route mapping)
- `src/features/support-chat/_domain/client-error-message.ts` (если нужны новые user-facing сообщения)
- `src/entities/support-chat/_repositories/chat-attachment-repository.ts`
- `src/shared/lib/file-storage/file-storage.ts` (reuse only, без API-breaking изменений)
- `src/shared/lib/file-storage/_providers/minio.ts` (при необходимости корректной abort cleanup)
- `src/shared/lib/file-storage/_providers/supabase.ts` (при необходимости корректной abort cleanup)

Steps:
1. Создать `POST /api/support-chat/uploads` c `FormData` (`file`, `dialogId` optional/new-dialog marker).
2. Добавить session auth + dialog access ownership/staff permission checks.
3. Реализовать server-side валидацию MIME/size/count по текущим chat-правилам.
4. Реализовать hard timeout на весь request.
5. Реализовать abort on client disconnect и no-progress timeout.
6. Добавить cleanup для незавершённого upload (delete temporary object / abort multipart, где поддерживается провайдером).
7. После успешного upload создать `ChatAttachment` со `status=UPLOADED` и вернуть attachment ref DTO (`attachmentId`, `name`, `mimeType`, `sizeBytes`).

Local tests:
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat`

Acceptance criteria:
- Endpoint `/api/support-chat/uploads` принимает multipart upload и возвращает attachment ref.
- При timeout/disconnect/no-progress upload прерывается и cleanup выполняется.
- Доступ ограничен по session/ownership правилам.
- DB содержит `ChatAttachment(status=UPLOADED)` для успешных upload.

Commit message:
- `feat(support-chat): add uploads API with timeout and abort safeguards`

## Phase 2: tRPC contract refactor to attachment refs only
Goal:
- Перевести `sendMessage/createDialog` с `base64` payload на attachment references.

Files to change:
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_domain/attachment-schema.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/entities/support-chat/_repositories/chat-attachment-repository.ts`
- `src/entities/support-chat/_domain/types.ts` (если требуется)
- `src/features/support-chat/_domain/error-mapping.ts`

Steps:
1. Обновить zod schemas для `sendMessage/createDialog`: `attachments[]` как refs (без `base64`).
2. Удалить server-path декодирования base64 и `File` reconstruction из `SupportChatService`.
3. Реализовать linking переданных refs к созданному message (`UPLOADED -> LINKED`) c проверкой dialog ownership.
4. Удалить/закрыть legacy branch для `base64` payload (no compatibility mode).
5. Сохранить текущий `clientMessageId`/idempotency flow.
6. Обновить error mapping для invalid attachment refs/forbidden link scenarios.

Local tests:
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat-service`

Acceptance criteria:
- `trpc.supportChat.sendMessage` и `createDialog` принимают только attachment refs.
- Base64 decode path отсутствует в рабочем server flow.
- При передаче невалидного/чужого attachment ref возвращается корректная error category.

Commit message:
- `refactor(support-chat): switch message contracts from base64 to uploaded attachment refs`

## Phase 3: Client upload orchestration and lightweight optimistic attachments
Goal:
- Реализовать клиентский staged flow: validate -> upload -> send, без base64 и с безопасным preview.

Files to change:
- `src/features/support-chat/_ui/support-chat-attachments-upload.ts`
- `src/features/support-chat/_ui/support-chat-conversation-card.tsx`
- `src/features/support-chat/_ui/support-chat-message-attachments.tsx`
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
- `src/features/support-chat/_domain/client-error-message.ts`

Steps:
1. Переписать attachment transform helper: убрать `FileReader/readAsDataURL`, добавить pre-validation (25MB/type) и upload mutation/API call.
2. В draft/optimistic attachment модели хранить только lightweight поля (`id/name/mimeType/size/status/previewUrl?`) без binary/base64.
3. Добавить object URL lifecycle (`createObjectURL` + `revokeObjectURL` при remove/unmount).
4. В preview renderer ввести internal constant `10MB`:
- `video > 10MB` -> file card,
- `video <= 10MB` -> inline preview.
5. Убрать `data:` handling path для pending attachments в message renderer.
6. Сохранить/проверить retry flow с `clientMessageId` и pending attachments refs.

Local tests:
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat`

Acceptance criteria:
- На клиенте отсутствует base64 conversion path.
- Oversize files не добавляются и не отправляются.
- Большие видео не рендерятся inline player.
- Optimistic message attachments не содержат binary payload.

Commit message:
- `feat(support-chat): implement staged upload and safe video preview rules`

## Phase 4: TTL cleanup cron/job for stale unlinked uploads
Goal:
- Добавить server-side cleanup механизм для stale `UPLOADED` attachments.

Files to change:
- `src/features/support-chat/_services/*` (new cleanup service/job)
- `src/entities/support-chat/_repositories/chat-attachment-repository.ts`
- `src/shared/config/private.ts` (reuse existing cleanup env vars where applicable)
- `src/app/api/*` or scheduler entrypoint (по текущему паттерну репозитория)
- `src/shared/lib/file-storage/*` (reuse delete-by-path)

Steps:
1. Реализовать selector stale uploads по `status=UPLOADED` и `createdAt < now - TTL`.
2. Реализовать job/cron handler:
- батчево получать stale rows,
- удалять объект из storage,
- удалять row в `ChatAttachment`.
3. Добавить безопасное логирование и retry-safe behavior для частичных ошибок.
4. Использовать существующие env-параметры cleanup batch/TTL/lock (если уже есть в config).

Local tests:
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat`

Acceptance criteria:
- Cleanup job удаляет stale unlinked attachments из storage и DB.
- Job безопасен к повторному запуску и батчевой обработке.
- Нет зависимости от client-side unload cleanup.

Commit message:
- `feat(support-chat): add ttl cleanup job for stale uploaded attachments`

## Phase 5: Regression tests, docs sync, and release checklist
Goal:
- Зафиксировать покрытие критических сценариев и завершить feature artifacts.

Files to change:
- `src/features/support-chat/_domain/*.spec.ts`
- `src/features/support-chat/_services/*.spec.ts`
- `src/features/support-chat/_integrations/*.spec.ts` (если затронуты upload/cleanup flows)
- `docs/ai/features/fix-upload-attach/40-impl-log.md`

Steps:
1. Добавить/обновить тест-кейсы:
- oversize reject до upload,
- upload success/failure/timeout/abort,
- sendMessage/createDialog with refs only,
- no inline preview for video >10MB,
- no base64 in optimistic message state,
- cleanup job for stale `UPLOADED` rows.
2. Выполнить consolidated local checks.
3. Заполнить `40-impl-log.md` фактами выполнения фаз и результатами тестов.

Local tests:
- `npm run lint`
- `npm run lint:types`
- `npm run test`
- `npm run test:e2e` (если e2e environment доступен)

Acceptance criteria:
- Новые сценарии покрыты и проходят локально.
- Реализация соответствует утверждённому `20-design.md`.
- Impl log обновлён и готов к review.

Commit message:
- `test(support-chat): cover upload ref flow and large-video safety regressions`

## Test plan (consolidated)
- Unit:
- Attachment schema and upload validator (MIME/size limits, refs-only input).
- Timeout/abort helpers and no-progress watchdog behavior.
- Preview guard logic (`video > 10MB` => file card path).
- Integration:
- `/api/support-chat/uploads` authz + upload + cleanup on failure.
- tRPC `sendMessage/createDialog` refs-only contract and attachment linking.
- Cleanup job path (`UPLOADED` stale selection -> storage delete -> DB delete).
- E2E:
- 30MB mp4: client reject, no send request, no crash.
- 20MB mp4: upload + file card preview + successful send.
- 5MB mp4: inline preview + successful send.
- image attachment: expected preview and successful send.

## Security checklist
- AuthZ:
- Upload route and send/create procedures enforce session + role/ownership checks.
- IDOR:
- Attachment refs validated against target dialog/user scope before linking.
- Validation:
- Client + server size/type/count validation present; server authoritative.
- Storage (if applicable):
- Upload uses private access level; API route mediates file access; abort cleanup implemented.
- Secrets:
- No client-side exposure of storage credentials; server uses existing `privateConfig` only.

## Rollout / migration steps
- Steps:
1. Deploy backend upload endpoint and refs-only contract changes.
2. Deploy client staged upload + preview guard changes.
3. Enable/verify cleanup cron in target environment.
4. Run manual validation scenarios from tech task checklist.
- Rollback:
1. Roll back deployment to previous application version (client + server).
2. Disable cleanup cron if it causes unexpected deletions.
3. Since schema unchanged, DB rollback is not required.

## Risks
- R1: Race between upload completion and send mutation can produce dangling `UPLOADED` rows if UI flow is interrupted.
- R2: Incorrect abort cleanup in provider adapters may leak partial objects in storage.
- R3: Client object URL lifecycle bugs can still retain memory if revoke paths are incomplete.

## Out-of-scope follow-ups
- F1: Direct-to-storage presigned upload flow to remove backend binary relay.
- F2: Distributed lock/queue for cleanup job in multi-instance deployment.
- F3: Metrics dashboard for upload latency, timeout rate, and cleanup effectiveness.
