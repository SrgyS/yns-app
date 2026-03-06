---
date: 2026-03-06
implementer: Codex
branch: feat/react-compiler
commit: 90d25da
feature: fix-upload-attach
based_on: docs/ai/features/fix-upload-attach/30-plan.md
---

# Implementation Log: fix-upload-attach

## 2026-03-06 - Phase 1

### Lead
- Scope: Phase 1 only.
- Goal: Add binary upload endpoint `/api/support-chat/uploads` with auth/access checks, MIME/size validation, timeout/abort controls, and attachment metadata persistence (`UPLOADED`).
- Definition of done for this phase:
  - upload route exists and is protected,
  - request hard timeout + client disconnect abort + no-progress timeout are handled,
  - storage abort cleanup is best-effort for provider uploads,
  - successful upload persists `ChatAttachment(status=UPLOADED)` and returns attachment ref DTO.

### Fix list (open/closed)
- Open: none
- Closed: none

### Coder
- Added new route:
  - `src/app/api/support-chat/uploads/route.ts`
  - Implements `POST` upload flow with:
    - NextAuth session check,
    - trusted-origin check,
    - file presence/type/size validation using support-chat attachment constraints,
    - dialog ownership/permission checks (`USER` ownership; `STAFF` with `canManageSupportChats`; `ADMIN`),
    - `newDialog=true` path for user uploads via canonical dialog resolution,
    - hard timeout, client-disconnect abort, no-progress timeout,
    - upload through `fileStorage.uploadFile(..., { signal, onProgress })`,
    - DB persistence via `ChatAttachmentRepository.createUploaded`,
    - JSON response with attachment ref (`attachmentId`, `dialogId`, `name`, `mimeType`, `sizeBytes`).
- Extended storage provider upload options:
  - `src/shared/lib/file-storage/types.ts`: added `UploadFileOptions` (`signal`, `onProgress`).
  - `src/shared/lib/file-storage/_providers/minio.ts`:
    - `uploadFile`/`upload` now accept optional upload options,
    - forwards progress callback from multipart uploader,
    - listens to abort signal, aborts upload task, and runs best-effort object cleanup on abort.
  - `src/shared/lib/file-storage/_providers/supabase.ts`:
    - `uploadFile`/`upload` now accept optional upload options,
    - supports abort-aware flow using raced abort promise and best-effort cleanup.
- Fixes addressed:
  - None (no R#/S#/T# blockers raised in this phase).

### Reviewer
- Verdict: Pass
- Notes:
  - Scope stays within Phase 1 (new upload endpoint + storage upload option extension).
  - No unrelated refactors performed.
  - Existing support-chat read/download and tRPC message contract were not modified beyond phase scope.

### Security
- Verdict: Pass
- Notes:
  - Upload route enforces session authn and trusted-origin checks.
  - Role/ownership checks gate dialog-scoped uploads.
  - Server-side type/size validation is authoritative.
  - Abort/timeouts reduce DoS risk from stalled uploads.
  - Storage credentials remain server-side only.

### Tester
- Verdict: Pass
- Commands run:
```bash
npm run lint:types
npm run lint
npm run test -- support-chat
```
- Verification notes:
  - `tsc --noEmit`: pass.
  - `eslint .`: pass.
  - support-chat suites: pass (7/7 suites, 40/40 tests).

## 2026-03-06 - Phase 2

### Lead
- Scope: Phase 2 only.
- Goal: Switch `sendMessage/createDialog` contracts from base64 attachments to uploaded attachment refs and link existing `ChatAttachment` rows to messages.
- Definition of done for this phase:
  - attachment input schema uses refs (`attachmentId`, `name`, `mimeType`, `sizeBytes`),
  - server no longer decodes base64 or uploads binaries in `SupportChatService`,
  - message creation links already uploaded rows (`UPLOADED -> LINKED`) with ownership checks.

### Fix list (open/closed)
- Closed:
  - T1: Type-level contract mismatch after schema switch (`use-support-chat` and pending attachment types still expected base64 fields).
- Open: none

### Coder
- Updated `src/features/support-chat/_domain/attachment-schema.ts`:
  - changed `supportChatAttachmentSchema` from `{ filename, mimeType, sizeBytes, base64 }` to refs-only `{ attachmentId, name, mimeType, sizeBytes }`.
- Updated `src/features/support-chat/_services/support-chat-service.ts`:
  - removed base64 decode/upload pipeline (`decodeAttachment` + file reconstruction path),
  - replaced `uploadAttachments` with `resolveUploadedAttachments`,
  - attachment resolution now validates:
    - dialog-scoped attachment existence,
    - creator ownership (`createdByUserId === actor.id`),
    - status `UPLOADED`,
    - `messageId` is empty,
    - MIME/name/size match with provided ref,
  - kept link step via `attachmentRepository.linkToMessage`,
  - `createDialog` switched to canonical dialog acquisition (`createOrReturnCanonical`) and emits `dialog.created` only when canonical dialog is newly created.
- Updated `src/features/support-chat/_services/support-chat-service.spec.ts`:
  - replaced upload-creation assertions with ref-resolution assertions,
  - added negative test for foreign attachment ref rejection.
- Type-alignment updates (to close T1 and keep build green with phase-2 contract):
  - `src/features/support-chat/_ui/support-chat-attachments-upload.ts`
  - `src/features/support-chat/_vm/use-support-chat.ts`
  - `src/features/support-chat/_ui/support-chat-conversation-card.tsx`
  - These now use refs-shaped pending attachment type (no base64 fields).
- Fixes addressed:
  - T1 (closed).

### Reviewer
- Verdict: Pass
- Notes:
  - Core runtime scope aligns with Phase 2 objective: contract/schema/service refactor to refs-only.
  - Base64 decode/upload logic was removed from `SupportChatService` as planned.
  - No unrelated architecture refactors introduced.

### Security
- Verdict: Pass
- Notes:
  - Attachment linking enforces actor ownership and dialog scoping before message link.
  - Server remains authoritative on MIME/size validation.
  - Legacy base64 payload path removed from service runtime.

### Tester
- Verdict: Pass
- Commands run:
```bash
npm run lint:types
npm run lint
npm run test -- src/features/support-chat/_services/support-chat-service.spec.ts
npm run test -- support-chat
```
- Verification notes:
  - `tsc --noEmit`: pass.
  - `eslint .`: pass.
  - service and support-chat suites: pass.

## 2026-03-06 - Phase 3

### Lead
- Scope: Phase 3 only.
- Goal: Implement client staged attachment flow (`validate -> upload -> send`) with lightweight optimistic attachments and safe preview policy.
- Definition of done for this phase:
  - client no longer generates base64 payloads,
  - files are uploaded via `/api/support-chat/uploads` before `sendMessage/createDialog`,
  - optimistic attachments store metadata only, with optional `previewUrl` object URL,
  - preview renderer enforces `10MB` inline-video threshold and does not use `data:` paths.

### Fix list (open/closed)
- Closed:
  - T2: Optimistic attachment preview path relied on non-existent local IDs after refs-only contract switch.
- Open: none

### Coder
- Reworked `src/features/support-chat/_ui/support-chat-attachments-upload.ts`:
  - added client-side file pre-validation using shared support-chat constraints (`MAX_ATTACHMENT_SIZE_BYTES`, MIME allow-list),
  - switched helper to staged upload via `POST /api/support-chat/uploads`,
  - mapped upload HTTP statuses to stable client error codes,
  - introduced pending attachment shape with optional `previewUrl`,
  - added object URL helpers (`toPendingSupportChatAttachments`, `revokePendingSupportChatAttachmentPreviews`).
- Updated compose/send screens:
  - `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
  - `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
  - now call staged upload helper before send/create and pass `pendingAttachments` to optimistic flow.
- Updated optimistic flow in `src/features/support-chat/_vm/use-support-chat.ts`:
  - added pending attachment map by `clientMessageId`,
  - optimistic message attachments now resolve preview path from `previewUrl` (if present) or API attachment URL,
  - added object URL cleanup on success, cancel-failed, and hook unmount.
- Updated message/pending attachment UI types:
  - `src/features/support-chat/_ui/support-chat-conversation-card.tsx` (`previewUrl?` in pending attachments).
- Updated preview renderer in `src/features/support-chat/_ui/support-chat-message-attachments.tsx`:
  - removed legacy `data:` path handling,
  - added internal constant `MAX_INLINE_VIDEO_PREVIEW_SIZE_BYTES = 10MB`,
  - videos above threshold render as file card, videos at/below threshold render inline player.
- Updated client error mapping in `src/features/support-chat/_domain/client-error-message.ts` for upload-specific error codes.
- Fixes addressed:
  - T2 (closed).

### Reviewer
- Verdict: Pass
- Notes:
  - Implementation remains within approved Phase 3 scope and preserves refs-only contract.
  - No fallback to base64/data URL path in active flow.
  - Retry flow with existing `clientMessageId` remains intact.

### Security
- Verdict: Pass
- Notes:
  - Client-side validation added as UX guard, while server-side upload validation remains authoritative.
  - `previewUrl` object URLs are local browser references only; no storage credentials exposed.
  - Cleanup of object URLs reduces memory retention risk in long-lived chat sessions.

### Tester
- Verdict: Pass
- Commands run:
```bash
npm run lint:types
npm run lint
npm run test -- support-chat
```
- Verification notes:
  - `tsc --noEmit`: pass.
  - `eslint .`: pass.
  - support-chat suites: pass (7/7 suites, 42/42 tests).

## 2026-03-06 - Phase 4

### Lead
- Scope: Phase 4 only.
- Goal: Ensure TTL cleanup job for stale unlinked uploads is active and safe against race conditions.
- Definition of done for this phase:
  - stale selector targets only unlinked `UPLOADED` rows,
  - cleanup removes storage objects and deletes only still-unlinked uploaded DB rows,
  - concurrent relink race does not delete freshly linked attachments.

### Fix list (open/closed)
- Closed:
  - T3: Race window between stale selection and DB delete could remove attachments that were linked after selection.
- Open: none

### Coder
- Reused existing cleanup cron entrypoint:
  - `scripts/cleanup-support-chat-attachments.ts`
  - existing env/lock config in `src/shared/config/private.ts` and script command in `package.json` remained valid.
- Hardened repository stale selector:
  - `src/entities/support-chat/_repositories/chat-attachment-repository.ts`
  - `listStaleUploaded` now explicitly filters `messageId: null` in addition to `status: 'UPLOADED'` and `createdAt < olderThan`.
- Added race-safe deletion API:
  - `deleteUnlinkedUploadedByIds(ids)` in `ChatAttachmentRepository`,
  - deletes only rows matching `id IN (...) AND status='UPLOADED' AND messageId IS NULL`.
- Updated cleanup cron script to use race-safe delete method:
  - `scripts/cleanup-support-chat-attachments.ts`
  - switched from `deleteByIds` to `deleteUnlinkedUploadedByIds`,
  - added `skippedDbDelete` metric for rows skipped due to state change between selection and delete.
- Fixes addressed:
  - T3 (closed).

### Reviewer
- Verdict: Pass
- Notes:
  - Phase scope maintained: cleanup behavior only.
  - Existing message-delete path still uses generic `deleteByIds`, cleanup path now guarded by status/message linkage conditions.

### Security
- Verdict: Pass
- Notes:
  - Reduced accidental data loss risk under concurrent send/link operations.
  - Lock-based execution and storage-first deletion behavior preserved.

### Tester
- Verdict: Pass
- Commands run:
```bash
npm run lint:types
npm run lint
npm run test -- support-chat
```
- Verification notes:
  - `tsc --noEmit`: pass.
  - `eslint .`: pass.
  - support-chat suites: pass.

## 2026-03-06 - Phase 5

### Lead
- Scope: Phase 5 only.
- Goal: Close regression coverage gaps for staged upload flow, video preview guard, and cleanup safety behavior; sync implementation log.
- Definition of done for this phase:
  - tests cover client-side oversize reject before upload request,
  - tests cover video preview threshold behavior (`>10MB` file card, `<=10MB` inline video),
  - tests cover cleanup repository safeguards for unlinked uploaded rows,
  - lint/typecheck/support-chat test suite pass.

### Fix list (open/closed)
- Closed:
  - T4: Missing explicit regression tests for staged upload validation and preview threshold logic.
  - T5: Missing explicit regression tests for cleanup selector/delete guards introduced in Phase 4.
- Open: none

### Coder
- Added staged upload helper tests:
  - `src/features/support-chat/_ui/support-chat-attachments-upload.spec.ts`
  - Coverage:
    - oversize file rejects with `ATTACHMENT_TOO_LARGE` before any `fetch`,
    - successful upload returns attachment refs DTO,
    - pending attachments add `blob:` preview URL only for image/video and revoke helper releases it.
- Added preview guard tests:
  - `src/features/support-chat/_ui/support-chat-message-attachments.spec.tsx`
  - Coverage:
    - video `>10MB` renders file card and does not render inline `<video>`,
    - video `<=10MB` renders inline `<video>`.
- Added cleanup repository safety tests:
  - `src/entities/support-chat/_repositories/chat-attachment-repository.spec.ts`
  - Coverage:
    - `listStaleUploaded` queries only `status='UPLOADED'` with `messageId=null`,
    - `deleteUnlinkedUploadedByIds` applies same guard at delete stage.
- Fixes addressed:
  - T4 (closed)
  - T5 (closed)

### Reviewer
- Verdict: Pass
- Notes:
  - Added tests align with approved scope and target behavior changes from phases 3-4.
  - No unrelated production refactors were introduced.

### Security
- Verdict: Pass
- Notes:
  - Regression tests now explicitly guard against unsafe client upload behavior and over-aggressive cleanup deletion conditions.

### Tester
- Verdict: Pass
- Commands run:
```bash
npm run lint:types
npm run lint
npm run test -- support-chat
```
- Verification notes:
  - `tsc --noEmit`: pass.
  - `eslint .`: pass.
  - support-chat suites: pass (10/10 suites, 49/49 tests).
