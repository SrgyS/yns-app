# Implementation Log: chat-enhancements

## 2026-02-26 — Phase 1..5 (DB + API + UI + tests)

### Summary
Implemented support-chat enhancements end-to-end:
- Added unanswered aggregate badge support (`getUnansweredDialogsCount`) and unresolved indicators per dialog.
- Added message edit/delete with strict server checks: author-only + unread-by-counterparty-only.
- Added soft-delete lifecycle (`deletedAt`, `deletedBy`) and edit lifecycle (`editedAt`).
- Extended SSE with `message.updated` and wired targeted React Query invalidation.
- Updated admin inbox UX: unresolved-first ordering, lazy loading on scroll, mobile back flow.
- Added profile/admin navigation badges.

### Files changed
- `prisma/schema.prisma`
- `prisma/migrations/20260226154500_chat_message_edit_delete/migration.sql`
- `src/entities/support-chat/_domain/types.ts`
- `src/entities/support-chat/_repositories/chat-message-repository.ts`
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_domain/errors.ts`
- `src/features/support-chat/_domain/error-mapping.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/_integrations/support-chat-events.ts`
- `src/app/api/support-chat/events/route.ts`
- `src/features/sidebar/constants.ts`
- `src/features/sidebar/_ui/nav-main.tsx`
- `src/features/sidebar/admin-panel-sidebar.tsx`
- `src/features/support-chat/_ui/support-chat-profile-link.tsx`
- `src/app/platform/(profile)/profile/page.tsx`
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
- `src/features/support-chat/_services/support-chat-service.spec.ts`
- `docs/ai/features/chat-enhancements/10-research.md`
- `docs/ai/features/chat-enhancements/20-design.md`
- `docs/ai/features/chat-enhancements/30-plan.md`
- `docs/ai/features/chat-enhancements/40-impl-log.md`

### Commands run
- `npx prisma generate`
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat-service`
- `npm run test -- support-chat`
- `npx -y react-doctor@latest . --verbose --diff` (did not complete in this environment)

### Notes / issues
- `react-doctor` command from project skill did not return output in restricted environment (likely network/tooling fetch limitation).
- `ChatMessage` changes are additive and backward-compatible for existing rows.

## 2026-02-26 — Security remediation (S1, S2)

### Summary
Implemented security fixes from review:
- S1: removed internal sender identifiers (`senderUserId`, `senderStaffId`) from `userGetMessages` response DTO to avoid exposing staff/user internal IDs to clients.
- S2: replaced N+1 unanswered-count logic with aggregated SQL queries using `dbClient.$queryRaw` for both USER and STAFF/ADMIN flows.

### Files changed
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_services/support-chat-service.spec.ts`
- `docs/ai/features/chat-enhancements/40-impl-log.md`

### Commands run
- `npm run lint:types`
- `npm run lint`
- `npm run test -- support-chat-service`

### Notes / issues
- Aggregated count query keeps existing unresolved semantics:
  - USER: last message from STAFF and unread by USER.
  - STAFF/ADMIN: last message from USER and unread by current staff actor.
