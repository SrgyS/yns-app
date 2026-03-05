---
date: 2026-03-05
implementer: Codex
branch: feat/react-compiler
commit: f8271b9
feature: chat-optimistic-update
based_on: docs/ai/features/chat-optimistic-update/30-plan.md
---

# Implementation Log: chat-optimistic-update

## 2026-03-05 - Phase 1

### Lead
- Scope: Phase 1 only.
- Goal: Add Prisma persistence foundation for `clientMessageId` correlation/idempotency.
- Definition of done for this phase:
  - `ChatMessage` has nullable `clientMessageId`.
  - Uniqueness on `(dialogId, clientMessageId)` is enforced.
  - Migration is additive and preserves existing chat data.

### Fix list (open/closed)
- Open: none
- Closed: none

### Coder
- Updated `prisma/schema.prisma`:
  - added `clientMessageId String?` to `ChatMessage`.
  - added `@@unique([dialogId, clientMessageId])`.
- Added migration `prisma/migrations/20260305123000_chat_message_client_message_id/migration.sql`:
  - adds `clientMessageId` column,
  - backfills existing rows with `legacy_<id>`,
  - creates unique index `ChatMessage_dialogId_clientMessageId_key`.
- Fixes addressed:
  - None (no R#/S#/T# blocking items were raised in this phase).

### Reviewer
- Verdict: Pass
- Notes:
  - Changes are limited to Phase 1 scope (Prisma schema + migration only).
  - No runtime/API/UI changes introduced.
  - Migration and schema are consistent with plan/design for additive rollout.

### Security
- Verdict: Pass
- Notes:
  - No changes to authn/authz boundaries.
  - No new endpoints or secret handling changes.
  - Data migration does not broaden access to chat data.

### Tester
- Verdict: Pass
- Commands run:
```bash
npx prisma validate
npm run lint:types
npm run lint
```
- Verification notes:
  - `prisma validate`: schema valid.
  - `tsc --noEmit`: pass.
  - `eslint .`: pass.

## 2026-03-05 - Phase 2

### Lead
- Scope: Phase 2 only.
- Goal: Implement server-side `clientMessageId` contract and idempotent send path.
- Definition of done for this phase:
  - `sendMessage` accepts optional `clientMessageId`.
  - Service deduplicates by `(dialogId, clientMessageId)`.
  - Message-level DTO returns `clientMessageId`.

### Fix list (open/closed)
- Closed:
  - T1: Regenerate Prisma Client after schema update so runtime/type layer recognizes `clientMessageId`.
  - T2: Reset `fileStorage.uploadFile` mock in `beforeEach` to avoid cross-test call leakage.
- Open: none

### Coder
- Updated `src/features/support-chat/_domain/schemas.ts`:
  - added `clientMessageId?: string` to `sendMessageInputSchema` (trim/min/max/regex).
- Updated `src/features/support-chat/_controller.ts`:
  - forwarded `input.clientMessageId` into `SupportChatService.sendMessage`.
- Updated `src/entities/support-chat/_domain/types.ts`:
  - `ChatMessageEntity` now includes `clientMessageId: string | null`.
- Updated `src/entities/support-chat/_repositories/chat-message-repository.ts`:
  - `create()` accepts/persists `clientMessageId`.
  - added `findByDialogAndClientMessageId(dialogId, clientMessageId)`.
  - `toEntity()` maps `clientMessageId`.
- Updated `src/features/support-chat/_services/support-chat-service.ts`:
  - `sendMessage` input extended with `clientMessageId?: string`.
  - added `resolveClientMessageId()` with server fallback `srv_<cuid>`.
  - added idempotent branch: lookup existing message by `(dialogId, clientMessageId)` and return existing DTO without duplicate create.
  - unified response building via `buildSendMessageResult()`.
  - `userGetMessages()` response items now include `clientMessageId`.
- Updated `src/features/support-chat/_services/support-chat-service.spec.ts`:
  - added mock/reset for `findByDialogAndClientMessageId` and `fileStorage.uploadFile`.
  - updated attachment send test for new message field expectations.
  - added test: repeated `clientMessageId` returns existing message and avoids duplicate create/upload/event publish.
- Executed `npx prisma generate` to align generated client with new Prisma schema.
- Fixes addressed:
  - T1, T2 (both closed).

### Reviewer
- Verdict: Pass
- Notes:
  - Runtime changes are limited to planned Phase 2 files (schema/controller/service/repository/tests).
  - No UI/SSE payload redesign beyond phase scope.
  - Idempotent path follows approved design and preserves existing behavior for calls without `clientMessageId`.

### Security
- Verdict: Pass
- Notes:
  - Existing authz boundaries (`authorizedProcedure`, `assertDialogAccess`, staff permission checks) remain unchanged.
  - Dedupe lookup is scoped by `dialogId` and executed after dialog access check.
  - No new endpoints, secret usage, or storage ACL changes.

### Tester
- Verdict: Pass
- Commands run:
```bash
npx prisma generate
npm run lint:types
npm run lint
npm run test -- src/features/support-chat/_services/support-chat-service.spec.ts
```
- Verification notes:
  - `tsc --noEmit`: pass.
  - `eslint .`: pass.
  - support-chat service suite: pass (14/14).

## 2026-03-05 - Phase 3

### Lead
- Scope: Phase 3 only.
- Goal: Enrich `message.created` SSE payload with correlation fields and add client-side reconciliation path with legacy fallback.
- Definition of done for this phase:
  - `message.created` carries message-level data including `clientMessageId`.
  - Client SSE handler attempts merge/reconcile by `clientMessageId`.
  - Legacy payload still works via existing invalidation fallback.

### Fix list (open/closed)
- Closed:
  - T3: Relaxed SSE event message `senderType` typing to `ChatMessageSenderType` to avoid TS mismatch with enum domain.
  - R1: Moved reconcile helper into `useEffect` scope to satisfy `react-hooks/exhaustive-deps` and keep stable effect deps.
  - T4: Removed accidental duplicate reconcile block outside hook scope in `use-support-chat.ts`.
- Open: none

### Coder
- Updated `src/features/support-chat/_integrations/support-chat-events.ts`:
  - `SupportChatEvent` changed to discriminated union.
  - `message.created` now supports `message` payload with `id`, `clientMessageId`, `text`, `senderType`, `createdAt`.
- Updated `src/features/support-chat/_services/support-chat-service.ts`:
  - `sendMessage` now publishes enriched `message.created` payload using final message DTO values.
  - `createDialog` initial message creation now sets generated `clientMessageId` and publishes enriched `message.created` payload.
- Updated `src/features/support-chat/_vm/use-support-chat.ts`:
  - added parsing of SSE `message.created` JSON payload.
  - added reconcile path: if payload contains `message.clientMessageId`, update cached `userGetMessages` item by `clientMessageId`.
  - retained existing invalidate fallback for malformed/legacy payloads.
- Fixes addressed:
  - T3, R1, T4 (all closed).

### Reviewer
- Verdict: Pass
- Notes:
  - Runtime scope matches Phase 3 files (events/service/SSE client hook).
  - No Phase 4 UI status controls introduced.
  - Backward-compatible fallback invalidation remains in place.

### Security
- Verdict: Pass
- Notes:
  - SSE route authz/filtering logic unchanged.
  - No new network surfaces.
  - JSON parse failures in client are safely ignored with fallback behavior.

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
  - support-chat suites: pass (6/6 suites, 35/35 tests).

## 2026-03-05 - Phase 4

### Lead
- Scope: Phase 4 only.
- Goal: Implement optimistic UI lifecycle (`sending`/`failed`/`sent`) with retry/cancel UX and dedupe-safe resend using same `clientMessageId`.
- Definition of done for this phase:
  - Local optimistic message is inserted immediately on send.
  - Failed optimistic messages show `Повторить` and `Отмена`.
  - Retry uses the same `clientMessageId`; cancel removes failed message from cache.
  - Client reconciles optimistic item on mutation success/SSE.

### Fix list (open/closed)
- Closed:
  - T5: Added data-URL preview fallback for optimistic attachments (`attachment.path` starting with `data:`).
  - T6: Synced UI callback prop chain for failed-message actions across conversation list/bubble/meta.
  - T7: Unified optimistic cache item shape with server DTO (`deletedBy`, non-optional `clientMessageId`, typed `pageParams`).
- Open: none

### Coder
- Updated `src/features/support-chat/_vm/use-support-chat.ts`:
  - introduced optimistic lifecycle fields (`status`, `pendingAttachments`) in message cache flow.
  - `sendMessage` now always sends/uses `clientMessageId`; retry path keeps same id.
  - added `cancelFailedMessage({ dialogId, clientMessageId })` for explicit failed-message removal.
  - mutation hooks now:
    - `onMutate`: optimistic insert,
    - `onSuccess`: reconcile to final server message,
    - `onError`: mark optimistic message as `failed`.
- Updated `src/features/support-chat/_ui/support-chat-conversation-card.tsx`:
  - extended message model with optimistic fields.
  - added status indicators for `sending` and `failed`.
  - added `Повторить` + `Отмена` controls for failed items.
  - disabled edit/delete actions for `sending` and `failed` messages.
- Updated `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`:
  - wired retry/cancel handlers to use `clientMessageId` and `cancelFailedMessage`.
  - passes `optimisticSenderType: 'USER'` for optimistic sends.
- Updated `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`:
  - wired retry/cancel handlers for staff inbox flow.
  - passes `optimisticSenderType: 'STAFF'` for optimistic sends.
- Updated `src/features/support-chat/_ui/support-chat-message-attachments.tsx`:
  - `buildAttachmentUrl` now returns raw `data:` URL for optimistic preview attachments.
- Fixes addressed:
  - T5, T6, T7 (all closed).

### Reviewer
- Verdict: Pass
- Notes:
  - Scope remains within planned Phase 4 files (VM + chat UI pages/components).
  - Behavior aligns with approved plan/design updates (failed state keeps message until user action; cancel removes item).
  - No unrelated refactors introduced.

### Security
- Verdict: Pass
- Notes:
  - Authz boundaries unchanged (all server procedures remain under existing guards).
  - Retry keeps idempotency semantics via existing server dedupe on `(dialogId, clientMessageId)`.
  - Optimistic attachment data URLs are local client preview only and do not bypass server-side attachment validation/upload paths.

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
  - support-chat suites: pass (6/6 suites, 35/35 tests).
