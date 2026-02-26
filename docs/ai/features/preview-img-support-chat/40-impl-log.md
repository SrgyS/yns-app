# Implementation Log: preview-img-support-chat

## 2026-02-25 — Phase 1 (Prisma model and repository for ChatAttachment)

### Summary
Implemented additive persistence for support attachments: added Prisma enum/model `ChatAttachmentStatus`/`ChatAttachment` with required fields, indexes and foreign keys; added entity type `ChatAttachmentEntity`; implemented `ChatAttachmentRepository` with methods `createUploaded`, `linkToMessage`, `findByDialogAndId`, `listStaleUploaded`, `deleteByIds`; registered repository in `SupportChatEntityModule`.

### Files changed
- `prisma/schema.prisma`
- `prisma/migrations/20260225193000_add_support_attachment/migration.sql`
- `src/entities/support-chat/_domain/types.ts`
- `src/entities/support-chat/_repositories/support-attachment-repository.ts`
- `src/entities/support-chat/module.ts`

### Commands run
- `npx prisma validate`
- `npx prisma generate`
- `npm run lint`
- `npm run lint:types`

### Notes / issues
- Migration SQL was added as additive migration file and not applied in this environment.
- Legacy `ChatMessage.attachments` JSON remains unchanged for transition compatibility (next phases).

## 2026-02-25 — Phase 2 (Dual-write in SupportChatService)

### Summary
Implemented dual-write attachment lifecycle in `SupportChatService`: each uploaded file now creates a `ChatAttachment` row with `UPLOADED` state via `ChatAttachmentRepository.createUploaded`; after message creation, attachments are linked to message via `linkToMessage` (`LINKED`). Legacy `ChatMessage.attachments` JSON is preserved and now stores DB attachment IDs for compatibility with current UI and route contract.

### Files changed
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_services/support-chat-service.spec.ts`

### Commands run
- `npm run lint`
- `npm run lint:types`
- `npm run test -- support-chat-service`

### Notes / issues
- `lastModified` snapshot is currently stored as `null`; `eTag` is persisted when provided by storage provider.
- `createDialog` flow was made sequential (`create dialog -> upload attachments -> create message -> link attachments`) to satisfy `ChatAttachment.dialogId` lifecycle without touching previous migrations.

## 2026-02-25 — Phase 3 (Attachment route read-switch and stream-first delivery)

### Summary
Switched support chat attachment endpoint to `ChatAttachment` table lookup and removed legacy scan by `ChatMessage.attachments` JSON. Endpoint now loads attachment via `ChatAttachmentRepository.findByDialogAndId` and streams file content through provider-level `downloadStreamByPath`, preserving 404 cloaking for access/not-found cases and setting secure response headers (`Content-Type`, `Content-Disposition`, `Cache-Control: private`, `X-Content-Type-Options`).

### Files changed
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/shared/lib/file-storage/types.ts`
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/lib/file-storage/_providers/supabase.ts`

### Commands run
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat`

### Notes / issues
- Added additive storage read contract `downloadStreamByPath` while keeping existing byte-buffer `downloadByPath` for backward compatibility.

## 2026-02-25 — Phase 4 (Caching, conditional requests, and rate limiting)

### Summary
Added private-safe conditional caching and request throttling for support chat attachments endpoint. Route now emits `ETag` / `Last-Modified` headers (from `ChatAttachment` snapshot and provider fallback metadata), handles `If-None-Match` / `If-Modified-Since` with `304 Not Modified`, and enforces per `userId+ip` rate limit with `429 Too Many Requests` and `Retry-After`.

### Files changed
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/features/support-chat/_domain/attachment-http-cache.ts` (new)
- `src/features/support-chat/_domain/attachment-http-cache.spec.ts` (new)
- `src/features/support-chat/_domain/attachment-rate-limit.ts` (new)
- `src/features/support-chat/_domain/attachment-rate-limit.spec.ts` (new)

### Commands run
- `npm run test -- support-chat`
- `npm run lint:types`
- `npm run lint`

### Notes / issues
- Rate limit is in-process memory based (same pattern as support-chat SSE route); for multi-instance production topology this should be moved to shared storage (Redis) in follow-up.

## 2026-02-25 — Phase 5 (Cleanup cron for staged/orphan attachments)

### Summary
Implemented cleanup cron script for stale staged attachments (`ChatAttachment.status=UPLOADED`) with distributed lock and dry-run mode. Script uses PostgreSQL advisory lock to prevent concurrent workers, selects stale uploaded attachments in batches, deletes storage objects first, and then removes DB rows for successfully processed records. Added cleanup env config and npm script entry.

### Files changed
- `scripts/cleanup-support-chat-attachments.ts` (new)
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/lib/file-storage/_providers/supabase.ts`
- `src/shared/config/private.ts`
- `.env.example`
- `package.json`

### Commands run
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat`

### Notes / issues
- Locking is implemented via `pg_try_advisory_lock(hashtext(lockKey))` and releases in `finally`; this gives distributed mutual exclusion for workers on the same Postgres cluster.
- Cleanup is retry-safe: failures on storage delete are logged and DB rows are not removed for failed items.

## 2026-02-25 — Phase 6 (Backfill and legacy dependency reduction)

### Summary
Added historical backfill script from `ChatMessage.attachments` JSON to `ChatAttachment` with idempotent checks and distributed lock. Script preserves legacy attachment IDs as `ChatAttachment.id` to keep existing attachment URLs valid after read-path switch. Route remains table-first and includes explicit operational fallback toggle (`SUPPORT_CHAT_ATTACHMENT_LEGACY_FALLBACK_ENABLED`) for incomplete backfill rollout scenarios.

### Files changed
- `scripts/backfill-support-chat-attachments.ts` (new)
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/shared/config/private.ts`
- `.env.example`
- `package.json`

### Commands run
- `npm run test -- support-chat`
- `npm run lint:types`
- `npm run lint`

### Notes / issues
- Backfill uses `pg_try_advisory_lock(hashtext(lockKey))`, batch cursor by `ChatMessage.id`, and skips existing records by `(messageId, storagePath)` checks.

## 2026-02-25 — Phase 6 follow-up (remove legacy compatibility path)

### Summary
Removed legacy compatibility mode: route now works only with `ChatAttachment` lookup and does not fallback to `ChatMessage.attachments` JSON. Backfill no longer reuses legacy `attachment.id` as `ChatAttachment.id`; IDs are generated by the new model.

### Files changed
- `scripts/backfill-support-chat-attachments.ts`
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/shared/config/private.ts`
- `.env.example`
