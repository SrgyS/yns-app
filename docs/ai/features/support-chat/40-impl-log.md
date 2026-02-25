# Implementation Log: support-chat

## 2026-02-24 — Phase 0 (Setup / scaffolding)

### Summary
Implemented support-chat scaffolding only: added feature module with placeholder bindings (controller/service/repositories), registered module in DI container, and added `ENABLE_SUPPORT_CHAT` config gates (public/private) with default-off behavior.

### Files changed
- `src/app/server.ts`
- `src/shared/config/public.ts`
- `src/shared/config/private.ts`
- `src/features/support-chat/index.ts`
- `src/features/support-chat/module.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_repositories/support-chat-conversation-repository.ts`
- `src/features/support-chat/_repositories/support-chat-message-repository.ts`
- `src/features/support-chat/_repositories/support-chat-read-state-repository.ts`

### Commands run
- `npm run lint` (failed on pre-existing unrelated lint error)
- `npm run lint:types` (passed)

### Notes / issues
- `npm run lint` failure is unrelated to Phase 0 changes:
  - `src/features/practices/_lib/image-path.spec.ts:9` (`@typescript-eslint/no-require-imports`)
- Existing warning unrelated to Phase 0:
  - `src/features/update-profile/_ui/avatar-field.tsx:62` (`@next/next/no-img-element`)

## 2026-02-24 — Phase 1 (Prisma schema and entity persistence)

### Summary
Implemented support-chat persistence layer: added Prisma enums/models (`SupportDialog`, `SupportMessage`, `SupportReadState`), added `canManageSupportChats` to `StaffPermission`, created additive migration SQL, added entity repositories in `src/entities/support-chat`, and registered `SupportChatEntityModule` in DI container.

### Files changed
- `prisma/schema.prisma`
- `prisma/migrations/20260224133000_add_support_chat/migration.sql`
- `src/entities/support-chat/module.ts`
- `src/entities/support-chat/_domain/types.ts`
- `src/entities/support-chat/_repositories/support-conversation-repository.ts`
- `src/entities/support-chat/_repositories/support-message-repository.ts`
- `src/entities/support-chat/_repositories/support-read-state-repository.ts`
- `src/app/server.ts`
- `src/features/support-chat/module.ts`
- `src/features/admin-panel/users/_domain/staff-permission.ts`
- `src/features/admin-panel/users/_domain/ability.ts`
- `src/features/admin-panel/users/_controller.ts`
- `src/features/admin-panel/users/_services/staff-permissions.ts`
- `src/features/admin-panel/users/_services/update-admin-user.ts`
- `src/features/admin-panel/users/_ui/admin-user-profile.tsx`
- `src/features/admin-panel/users/_domain/ability.spec.ts`
- `src/features/admin-panel/users/_services/staff-permissions.spec.ts`

### Commands run
- `npx prisma validate` (passed)
- `npx prisma generate` (passed)
- `npx prisma migrate dev --name add_support_chat` (failed in local environment)
- `npm run lint:types` (passed)
- `npm run lint` (failed on pre-existing unrelated lint error)

### Notes / issues
- `npx prisma migrate dev --name add_support_chat` failed with local schema engine error against `localhost:5432` in this environment.
- `npm run lint` failure remains unrelated to support-chat changes:
  - `src/features/practices/_lib/image-path.spec.ts:9` (`@typescript-eslint/no-require-imports`)
- Existing warning unrelated to support-chat:
  - `src/features/update-profile/_ui/avatar-field.tsx:62` (`@next/next/no-img-element`)

## 2026-02-24 — Phase 2 (tRPC contracts and core use-cases)

### Summary
Implemented support-chat tRPC router and service layer: added procedures `createDialog`, `sendMessage`, `markDialogRead`, `userListDialogs`, `userGetMessages`, `staffListDialogs`; added zod input schemas; added domain error model with deterministic mapping to TRPC errors; implemented role/ownership authz (`USER` ownership, `ADMIN` full access, `STAFF` with `canManageSupportChats`); added unread helpers and `hasUnansweredIncoming` computation for staff inbox.

### Files changed
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_services/support-chat-read-service.ts`
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_domain/errors.ts`
- `src/features/support-chat/module.ts`

### Commands run
- `npm run lint:types` (passed)
- `npm run lint` (passed)
- `npm run test -- support-chat` (no tests found for this pattern)

### Notes / issues
- `npm run test -- support-chat` exits with code 1 because no `support-chat` test files exist yet.
- Realtime/SSE and Telegram side effects are intentionally not added in this phase (planned for Phase 3).

## 2026-02-24 — Phase 3 (Attachments, SSE realtime, Telegram notifier)

### Summary
Implemented Phase 3 integrations for support-chat: attachment validation and upload pipeline via shared file-storage abstraction, SSE event stream endpoint and event publishing for `dialog.created`/`message.created`/`read.updated`, and Telegram notifications for new user messages with fail-safe behavior (notification errors are logged and do not break message persistence).

### Files changed
- `src/features/support-chat/_domain/attachment-schema.ts`
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_integrations/telegram-support-notifier.ts`
- `src/features/support-chat/_integrations/support-chat-events.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/module.ts`
- `src/app/api/support-chat/events/route.ts`

### Commands run
- `npm run lint:types` (passed)
- `npm run lint` (passed)
- `npm run test -- support-chat` (no tests found for this pattern)

### Notes / issues
- `npm run test -- support-chat` exits with code 1 because support-chat specific test files are not added yet.
- Attachment storage currently persists metadata (`id/name/path/type/sizeBytes`) in message JSON and uses existing storage provider strategy.

## 2026-02-24 — Phase 4 (User chat UI)

### Summary
Implemented user support-chat UI for platform profile area: dialogs list, message thread, composer with attachments, API hooks and React Query invalidation wiring, SSE subscription with targeted invalidation, and mark-as-read trigger on latest incoming message/open thread. Added feature-flag-gated entrypoint page and profile navigation button.

### Files changed
- `src/features/support-chat/_api.ts`
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/app/platform/(profile)/support-chat/page.tsx`
- `src/app/platform/(profile)/profile/page.tsx`

### Commands run
- `npm run lint:types` (passed)
- `npm run lint` (passed)
- `npm run test -- support-chat` (no tests found for this pattern)

### Notes / issues
- `npm run test -- support-chat` exits with code 1 because support-chat specific test files are not added yet.
- SSE invalidation is wired for `dialog.created`, `message.created`, `read.updated` and scoped to current dialog for message-thread refetch.

## 2026-02-24 — Phase 5 (Staff inbox UI)

### Summary
Implemented admin support-chat inbox UI with shared dialogs view and message thread, including visual `hasUnansweredIncoming` marker and filter, permission gate via admin ability (`canManageSupportChats`), and staff SSE-driven invalidation for realtime updates. Added admin route entrypoint and sidebar navigation item.

### Files changed
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
- `src/app/(admin)/admin/support-chat/page.tsx`
- `src/features/sidebar/constants.ts`

### Commands run
- `npm run lint:types` (passed)
- `npm run lint` (passed)
- `npm run test -- support-chat` (no tests found for this pattern)

### Notes / issues
- `npm run test -- support-chat` exits with code 1 because support-chat specific test files are not added yet.
- Access control enforced on both layers: UI gate via `admin.user.permissions` and API gate via `supportChatService.ensureStaffAccess`.

## 2026-02-24 — Phase 6 (Hardening, tests, docs, rollout prep)

### Summary
Completed hardening and verification artifacts: added support-chat unit/integration-oriented tests for authz/idor/read-logic/error-mapping, added e2e smoke skeleton (skipped), updated environment example with support-chat flags, and created final review artifact.

### Files changed
- `src/features/support-chat/_services/support-chat-read-service.spec.ts`
- `src/features/support-chat/_services/support-chat-service.spec.ts`
- `src/features/support-chat/_domain/error-mapping.ts`
- `src/features/support-chat/_domain/error-mapping.spec.ts`
- `tests/support-chat.smoke.spec.ts`
- `.env.example`
- `src/features/support-chat/_controller.ts`
- `docs/ai/features/support-chat/50-review.md`

### Commands run
- `npm run test -- support-chat` (passed)
- `npm run lint:types` (passed)
- `npm run lint` (passed)

### Notes / issues
- `tests/support-chat.smoke.spec.ts` is `describe.skip` because runtime e2e fixtures (seeded users + storageState) are not prepared in this phase.
