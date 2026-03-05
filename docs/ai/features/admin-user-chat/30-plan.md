---
date: 2026-03-04
planner: Codex
branch: feat/react-compiler
commit: a196fe3
feature: admin-user-chat
based_on: docs/ai/features/admin-user-chat/20-design.md
---

# Plan: admin-user-chat

## Summary
Implementation should proceed in four atomic phases: first enforce the canonical one-dialog-per-user data model, then add the staff bootstrap API in `support-chat`, then connect the admin inbox to bootstrap and preselect dialogs, and finally expose entry triggers from the admin users surfaces. This order keeps schema guarantees in place before application logic depends on them and keeps each phase independently testable and committable.

## Definition of Done
- Functional:
  - A user with `canManageSupportChats` can start a chat from the admin users area and land in `/admin/support-chat` with the correct dialog selected.
  - If a dialog for the target user already exists, it is reused.
  - If no dialog exists, one canonical dialog is created and then used by the existing admin inbox.
  - The user sees unread state through the existing `sendMessage` and read-state flow after the first admin message is sent.
- Technical:
  - `ChatDialog` is canonicalized to one row per `userId`.
  - The new behavior is implemented inside existing FSD boundaries and existing DI registrations.
  - New server behavior is exposed through tRPC under the existing `SupportChatController`.
  - Local lint and typecheck pass for each phase.
- Docs:
  - `10-research.md`, `20-design.md`, and `30-plan.md` are present for the feature branch.
  - Implementation details and validation results can be appended later to `40-impl-log.md`.

## Phase 1: Canonicalize chat dialogs in persistence
Goal:
Establish a canonical one-dialog-per-user storage model so later API and UI work can rely on deterministic dialog lookup.

Files to change:
- `prisma/schema.prisma`
- `prisma/migrations/<new_migration>/migration.sql`
- `src/entities/support-chat/_repositories/chat-dialog-repository.ts`
- Optional tests if repository coverage is added: `src/entities/support-chat/**` or `src/features/support-chat/_services/*.spec.ts`

Steps:
1. Update `ChatDialog` in `prisma/schema.prisma` to enforce uniqueness for `userId` while preserving inbox ordering indexes needed by the feature.
2. Create a Prisma migration that backfills duplicate dialogs by `userId`, chooses one canonical dialog, reassigns dependent `ChatMessage`, `ChatAttachment`, and `SupportReadState` rows, recomputes `lastMessageAt`, removes duplicate dialogs, and adds the unique constraint.
3. Extend `ChatDialogRepository` with canonical lookup helpers such as `findByUserIdUnique()` and a repository-level create-or-return path that matches the new uniqueness contract.
4. Add or update tests around canonical lookup behavior if the repository/service layer already has suitable test coverage points.

Local tests:
- `npm run lint`
- `npm run lint:types`
- If repository/service tests are updated: targeted Jest tests for support-chat repositories/services

Acceptance criteria:
- The schema defines one canonical dialog per `userId`.
- The migration can run on existing data without leaving orphaned `ChatMessage`, `ChatAttachment`, or `SupportReadState` rows.
- Repository code can deterministically read the canonical dialog for a user.

Commit message:
- `feat(chat): canonicalize support dialogs per user`

## Phase 2: Add staff bootstrap dialog API in support-chat
Goal:
Expose a protected server-side mutation that finds or creates the canonical dialog for a target user and returns the dialog identifier to the admin inbox.

Files to change:
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_domain/errors.ts`
- `src/features/support-chat/_domain/error-mapping.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- Optional supporting user lookup abstraction if needed within existing boundaries:
  - `src/entities/user/_repositories/user.ts` or an existing user-domain service already used in the repo
- Optional tests:
  - `src/features/support-chat/_services/support-chat-service.spec.ts`
  - `src/features/support-chat/_domain/error-mapping.spec.ts`

Steps:
1. Add a new Zod input schema for `staffOpenDialogForUser` in the support-chat domain.
2. Extend support-chat domain error codes for invalid target user resolution, only if the current error model cannot express those cases cleanly.
3. Add `supportChat.staffOpenDialogForUser` to `SupportChatController` as an `authorizedProcedure`.
4. Implement `SupportChatService.staffOpenDialogForUser` to:
   - enforce `ensureStaffAccess()`
   - validate target user existence
   - validate target user role is `USER`
   - read the canonical dialog by `userId`
   - create a new canonical dialog only when missing
   - publish `dialog.created` only when creation occurs
   - return `{ dialogId, userId, created, createdAt }`
5. Map the new domain errors into `TRPCError` responses.
6. Add service/controller tests that cover: existing dialog reused, new dialog created, unauthorized staff access, target user not found, and invalid target role.

Local tests:
- `npm run lint`
- `npm run lint:types`
- Targeted Jest tests for `support-chat` service/domain mappings

Acceptance criteria:
- The new mutation is available under `trpc.supportChat.staffOpenDialogForUser`.
- The mutation never creates more than one dialog per user.
- Unauthorized staff/admin actors receive the correct forbidden behavior.
- The mutation returns existing dialogs without creating new rows.

Commit message:
- `feat(chat): add staff dialog bootstrap mutation`

## Phase 3: Integrate bootstrap flow into admin support chat inbox
Goal:
Allow `/admin/support-chat?userId=<id>` to resolve the target dialog and open the existing admin inbox with the correct conversation selected.

Files to change:
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
- Optional utility file if a small parser/helper is extracted within feature scope
- Optional tests:
  - `src/features/support-chat/**` component or hook tests if present in repo patterns

Steps:
1. Add a dedicated client-side mutation wrapper in `use-support-chat.ts` for `staffOpenDialogForUser`, including the invalidation policy from the design.
2. Update `SupportChatAdminInboxPage` to read `userId` from search params after permission is known.
3. Trigger the bootstrap mutation once per target user value and set `selectedDialogId` from the server response.
4. Preserve the current manual dialog selection flow and ensure invalid or failed bootstrap does not block normal inbox usage.
5. Keep the current `sendMessage`, `markDialogRead`, SSE, and message-loading behavior unchanged after a dialog is selected.
6. Add targeted tests for: successful preselection, mutation failure fallback, and no bootstrap when the user lacks `canManageSupportChats`.

Local tests:
- `npm run lint`
- `npm run lint:types`
- Targeted UI/hook tests if added

Acceptance criteria:
- Opening `/admin/support-chat?userId=<id>` selects the correct dialog when the actor is permitted.
- If the dialog does not exist, it is created once and then selected.
- If bootstrap fails, the inbox still renders and can be used manually.

Commit message:
- `feat(chat): support preselected admin inbox dialog`

## Phase 4: Add admin users entry triggers
Goal:
Expose the new chat entrypoint from the admin users surfaces without changing the existing admin users data flow beyond permission-aware navigation.

Files to change:
- `src/features/admin-panel/users/_ui/admin-user-profile.tsx`
- `src/features/admin-panel/users/_ui/tables/users/columns.tsx`
- `src/features/admin-panel/users/_ui/admin-users-page.tsx`
- Potentially `src/features/admin-panel/users/_hooks/use-admin-ability.ts` only if existing usage needs to be threaded into the list table
- Optional UI tests if present in the existing admin users testing pattern

Steps:
1. Wire the existing `Отправить сообщение` button in `AdminUserProfile` to navigate to `/admin/support-chat?userId=<id>`.
2. Gate that button on `viewerAbility.canManageSupportChats` according to the approved UX decision (hide or disable, based on implementation choice).
3. Add a users-list entry trigger that navigates to the same route and only renders when the viewer has `canManageSupportChats`.
4. Ensure the users list can access the current viewer ability in a way that does not duplicate permission-fetch logic unnecessarily.
5. Verify the added UI does not change existing users-list filtering, sorting, or detail navigation behavior.

Local tests:
- `npm run lint`
- `npm run lint:types`
- Targeted component tests if added

Acceptance criteria:
- From the user detail screen, the actor can enter the admin inbox for that user.
- From the users list, the actor can enter the admin inbox for that user.
- Users without `canManageSupportChats` do not get an active entry trigger.

Commit message:
- `feat(admin-users): add support chat entry actions`

## Test plan (consolidated)
- Unit:
  - Repository/service tests for canonical dialog lookup and create-or-return behavior
  - Support-chat error mapping tests for new target-user failure cases
  - Hook/component tests for admin inbox bootstrap behavior if local test coverage exists for the feature
- Integration:
  - Manual or automated verification that `staffOpenDialogForUser` returns the same `dialogId` on repeated calls for the same user
  - Manual or automated verification that sending the first admin message updates existing unread indicators for the user
  - Prisma migration verification against a dataset with duplicate dialogs for one user
- E2E:
  - Admin/staff with `canManageSupportChats` opens from admin user detail -> lands in selected dialog -> sends message
  - Admin/staff with `canManageSupportChats` opens from users list -> lands in selected dialog
  - Staff without `canManageSupportChats` cannot bootstrap a dialog through URL manipulation

## Security checklist
- AuthZ:
  - Verify `staffOpenDialogForUser` reuses `ensureStaffAccess()` and does not trust client-side visibility checks.
- IDOR:
  - Verify the query parameter only carries `userId`; all dialog resolution happens server-side and returns only dialogs the actor may access.
  - Verify subsequent message access still relies on `assertDialogAccess()`.
- Validation:
  - Verify `userId` is validated both client-side (empty guard) and server-side (Zod).
  - Verify target user role is checked as `USER`.
- Storage (if applicable):
  - Confirm the new bootstrap flow does not touch attachment upload/download logic.
- Secrets:
  - Confirm no new environment variables or secret-bearing integrations are introduced.

## Rollout / migration steps
- Steps:
  - Deploy the canonical-dialog migration in an environment with a backup/snapshot available.
  - Validate the backfill result on duplicate-dialog users before enabling application changes.
  - Deploy Phase 2 and Phase 3 application code.
  - Deploy Phase 4 UI entrypoints.
  - Run post-deploy smoke checks for user chat, admin inbox, and the new admin entry flow.
- Rollback:
  - If the application release fails after the migration, roll back application code only; the canonical schema remains compatible with the previous behavior.
  - If the migration fails before completion, stop deployment, restore from backup if needed, and rerun with corrected migration logic before shipping app changes.

## Risks
- R1: Duplicate-dialog backfill can mis-merge historical data if canonical selection and row reassignment logic are not deterministic.
- R2: The admin users list may require extra ability plumbing to render a permission-aware action without regressing existing list interactions.
- R3: Client bootstrap logic can accidentally retrigger the mutation multiple times if the search-param effect and selected-dialog state are not carefully scoped.

## Out-of-scope follow-ups
- F1: Add explicit telemetry dashboards or metrics for support-chat bootstrap actions.
- F2: Add a dedicated route segment or deep-link format beyond `?userId=` if product later wants richer chat navigation.
- F3: Add system markers for historical merged dialogs if support requests need visible migration provenance.
