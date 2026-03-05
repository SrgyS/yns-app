# Implementation Log: admin-user-chat

## 2026-03-04 - Phase 1

### Lead
- Scope: Phase 1 only.
- Goal: Canonicalize `ChatDialog` to one row per user before any API/UI changes depend on deterministic dialog lookup.
- Definition of done for this phase:
  - `ChatDialog.userId` is unique in Prisma schema.
  - A migration backfills duplicate dialogs and preserves dependent data.
  - `ChatDialogRepository` exposes canonical lookup helpers.

### Coder
- Updated `prisma/schema.prisma` to make `ChatDialog.userId` unique and replaced the composite `(userId, updatedAt)` index with an `updatedAt` index.
- Added migration `prisma/migrations/20260304120000_canonicalize_chat_dialog_per_user/migration.sql` to:
  - choose one canonical dialog per user,
  - merge `SupportReadState` rows safely,
  - reassign `ChatMessage` and `ChatAttachment` rows,
  - recompute `lastMessageAt`,
  - delete duplicate dialogs,
  - add the unique index and updated-at index.
- Extended `src/entities/support-chat/_repositories/chat-dialog-repository.ts` with:
  - `findByUserIdUnique()`
  - `createOrReturnCanonical()`
- Fixes addressed:
  - T1: Replaced `findUnique({ where: { userId } })` with `findFirst({ where: { userId } })` so `lint:types` stays green before Prisma client regeneration.

### Reviewer
- Pass
- No blocking scope or design deviations identified for Phase 1.

### Security
- Pass
- Migration keeps existing ownership boundaries intact and does not expand runtime access.

### Tester
- Pass
- Commands run:
  - `npm run lint`
  - `npm run lint:types`
- Verification notes:
  - `npm run lint` completed with one pre-existing unrelated warning in `src/app/(site)/courses/_ui/blocks/testimonials-block.tsx` for an unused `Badge` import.
  - `npm run lint:types` completed successfully after the repository lookup was adjusted to avoid depending on regenerated Prisma client types.

## 2026-03-04 - Phase 2

### Lead
- Scope: Phase 2 only.
- Goal: Add a protected support-chat mutation that resolves or creates the canonical dialog for a target user.
- Definition of done for this phase:
  - `trpc.supportChat.staffOpenDialogForUser` exists.
  - The service validates staff permission, target user existence, and target user role.
  - Existing dialog reuse vs. actual creation is distinguished correctly.

### Coder
- Added `staffOpenDialogForUserInputSchema` to support-chat domain schemas.
- Extended support-chat domain errors with:
  - `TARGET_USER_NOT_FOUND`
  - `TARGET_USER_INVALID_ROLE`
- Updated support-chat TRPC error mapping for the new domain errors.
- Added `supportChat.staffOpenDialogForUser` to `SupportChatController`.
- Extended `SupportChatService` to:
  - inject `UserRepository`
  - validate target users
  - resolve existing canonical dialogs
  - create a canonical dialog when missing
  - publish `dialog.created` only when a dialog is actually created
- Added service tests covering:
  - existing dialog reuse
  - new dialog creation
  - missing target user
  - invalid target role
- Fixes addressed:
  - R1: Avoided false-positive `dialog.created` publication in unique-conflict races by returning `{ dialog, created }` from `createOrReturnCanonical()` and branching on the real creation flag.

### Reviewer
- Pass
- Runtime scope stayed within Phase 2 and reused the existing support-chat architecture.

### Security
- Pass
- New mutation reuses existing `ensureStaffAccess()` checks and validates the target account role before returning a dialog identifier.

### Tester
- Pass
- Commands run:
  - `npm run lint`
  - `npm run lint:types`
  - `npm run test -- src/features/support-chat/_services/support-chat-service.spec.ts`
- Verification notes:
  - `npm run lint` completed with the same pre-existing unrelated warning in `src/app/(site)/courses/_ui/blocks/testimonials-block.tsx`.
  - `npm run lint:types` completed successfully.

## 2026-03-04 - Phase 4

### Lead
- Scope: Phase 4 only.
- Goal: Expose the new admin-chat entrypoint from the admin users list and user detail surfaces.
- Definition of done for this phase:
  - The detail page has a permission-aware message entry link.
  - The users list can render a message action when the viewer may manage support chats.
  - Existing users list filtering, pagination, and detail navigation continue to work.

### Coder
- Updated `AdminUserProfile` so `Отправить сообщение`:
  - navigates to `/admin/support-chat?userId=<id>` when `viewerAbility.canManageSupportChats` is true
  - renders as a disabled button when the viewer lacks that permission
- Updated `AdminUsersPage` to:
  - load `useAdminAbility()`
  - derive `canManageSupportChats`
  - memoize a permission-aware users table column set
- Replaced the fixed users table columns export with `createAdminUsersColumns(canManageSupportChats)`.
- Added a conditional `Действия` column in the users table with a `Сообщение` link button to `/admin/support-chat?userId=<id>`.
- Updated the users table barrel export to re-export `createAdminUsersColumns`.
- Fixes addressed:
  - T2: Updated `tables/users/index.ts` to export the new column factory so `tsc` resolves imports correctly.
  - R2: Replaced `asChild` + `disabled` on the detail-page message button with explicit conditional rendering so disabled state remains semantically valid.

### Reviewer
- Pass
- The UI change stays inside Phase 4 and does not modify the previously implemented chat bootstrap behavior.

### Security
- Pass
- UI visibility remains permission-aware, while actual dialog access control is still enforced server-side by the existing protected mutation.

### Tester
- Pass
- Commands run:
  - `npm run lint`
  - `npm run lint:types`
- Verification notes:
  - `npm run lint` completed with the same pre-existing unrelated warning in `src/app/(site)/courses/_ui/blocks/testimonials-block.tsx`.
  - `npm run lint:types` completed successfully.
  - The targeted `SupportChatService` Jest suite passed with 13/13 tests.

## 2026-03-04 - Phase 3

### Lead
- Scope: Phase 3 only.
- Goal: Let `/admin/support-chat?userId=<id>` bootstrap the target dialog and open the existing admin inbox with that dialog selected.
- Definition of done for this phase:
  - The admin inbox can read `userId` from search params.
  - The page calls the new bootstrap mutation once per target user value.
  - The resolved dialog is selected without changing the existing message flow.

### Coder
- Extended `useSupportChatActions()` with:
  - `openStaffDialogForUser()`
  - `isOpeningStaffDialog`
- Added client invalidation for the new bootstrap mutation:
  - `supportChat.staffListDialogs`
  - `supportChat.getUnansweredDialogsCount`
- Updated `SupportChatAdminInboxPage` to:
  - read `userId` via `useSearchParams()`
  - bootstrap the dialog when `canManageSupportChat` is available
  - keep a ref guard so the bootstrap call does not loop for the same target
  - set `selectedDialogId` and open the mobile conversation view after bootstrap
  - show an existing error toast if bootstrap fails
  - keep existing send/edit/delete/read behavior intact
- No new test files were added in this phase.

### Reviewer
- Pass
- The change stays within Phase 3 and reuses the existing admin inbox state model.

### Security
- Pass
- The client only forwards `userId`; the actual dialog resolution remains server-side behind the existing protected mutation.

### Tester
- Pass
- Commands run:
  - `npm run lint`
  - `npm run lint:types`
- Verification notes:
  - `npm run lint` completed with the same pre-existing unrelated warning in `src/app/(site)/courses/_ui/blocks/testimonials-block.tsx`.
  - `npm run lint:types` completed successfully.
