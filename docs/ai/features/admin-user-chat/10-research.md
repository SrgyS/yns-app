---
date: 2026-03-04
researcher: Codex
branch: feat/react-compiler
commit: a196fe3
feature: admin-user-chat
research_question: "How does the current codebase support starting an admin-to-user chat from the admin users area using the existing support-chat module?"
---

# Research: admin-user-chat

## Summary
The current admin users entrypoints are the users list route and the user detail route, both backed by `AdminUsersController` over tRPC. The list route renders a table of links to user detail pages and does not render a message action. The detail route renders an `AdminUserProfile` card that already includes a visible `Отправить сообщение` button, but that button currently has no click handler, no navigation target, and no permission binding in the component itself. `src/app/(admin)/admin/users/page.tsx:1-4`, `src/app/(admin)/admin/users/[id]/page.tsx:1-9`, `src/features/admin-panel/users/_ui/tables/users/columns.tsx:222-319`, `src/features/admin-panel/users/_ui/admin-user-profile.tsx:172-185`

The existing chat implementation is the `support-chat` feature. The admin chat UI is mounted at `/admin/support-chat` and loads dialogs through `supportChat.staffListDialogs`; the user chat UI is mounted at `/platform/(profile)/support-chat` and can create new dialogs through `supportChat.createDialog`. On the server, `SupportChatController` routes all chat actions into `SupportChatService`, which enforces access checks by role and by `StaffPermission.canManageSupportChats`. `src/app/(admin)/admin/support-chat/page.tsx:1-4`, `src/app/platform/(profile)/support-chat/page.tsx:8-24`, `src/features/support-chat/_controller.ts:27-157`, `src/features/support-chat/_services/support-chat-service.ts:262-349`, `src/features/support-chat/_services/support-chat-service.ts:694-817`

The current data model stores chats in `ChatDialog`, `ChatMessage`, `SupportReadState`, and `ChatAttachment`. `ChatDialog` is keyed by dialog `id`; it has an index on `(userId, updatedAt)` but no unique constraint on `userId`, and `SupportChatService.createDialog()` always inserts a new dialog row for the current user actor before creating the first message. This means the current codebase supports multiple dialogs per user at the schema and service level. `prisma/schema.prisma:541-614`, `src/entities/support-chat/_repositories/chat-dialog-repository.ts:13-25`, `src/features/support-chat/_services/support-chat-service.ts:694-765`

## Entry points (as-is)
- Next.js routes/pages: `src/app/(admin)/admin/users/page.tsx:1-4` mounts `AdminUsersPage` for the admin users list.
- Next.js routes/pages: `src/app/(admin)/admin/users/[id]/page.tsx:1-9` mounts `AdminUserDetailPage` for a specific user.
- Next.js routes/pages: `src/app/(admin)/admin/support-chat/page.tsx:1-4` mounts `SupportChatAdminInboxPage`.
- Next.js routes/pages: `src/app/platform/(profile)/support-chat/page.tsx:8-24` checks session/role and routes `USER` to `SupportChatUserPage`, otherwise redirects to `/admin/support-chat`.
- tRPC procedures/routers: `src/features/admin-panel/users/_controller.ts:118-233` exposes `admin.user.list`, `permissions`, `update`, `detail`, and access mutations.
- tRPC procedures/routers: `src/features/support-chat/_controller.ts:27-157` exposes `supportChat.userListDialogs`, `userGetMessages`, `staffListDialogs`, `sendMessage`, `markDialogRead`, `getUnansweredDialogsCount`, `editMessage`, `deleteMessage`, and `createDialog`.
- UI components: `src/features/admin-panel/users/_ui/admin-users-page.tsx:12-60` renders the users list table and pagination.
- UI components: `src/features/admin-panel/users/_ui/admin-user-detail-page.tsx:33-189` renders the detail shell and embeds `AdminUserProfile`.
- UI components: `src/features/admin-panel/users/_ui/admin-user-profile.tsx:36-189` renders profile controls, including the existing `Отправить сообщение` button.
- UI components: `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:56-305` renders the staff/admin inbox and conversation area.
- UI components: `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:30-244` renders the user chat conversation area.

## Detailed findings
### 1. Admin users surfaces and current message entry UI
- Location: `src/features/admin-panel/users/_ui/tables/users/columns.tsx:222-319`
- What it does: The users table defines columns for `id`, avatar, `email`, `name`, `phone`, `role`, and `hasActiveAccess`. Every interactive cell links to `/admin/users/<id>`. No action column or message trigger is defined in the list table.
- Dependencies: `next/link`, `@tanstack/react-table`, `ProfileAvatar`, `Badge`, `Input`, `Select`, `Button`.
- Data flow: Admin users data row -> column renderer -> link to detail route -> browser navigation.

- Location: `src/features/admin-panel/users/_ui/admin-user-detail-page.tsx:92-187`
- What it does: The detail page fetches user detail and viewer ability, blocks rendering when `viewerAbility.canManageUsers` is false, and renders `AdminUserProfile` in the sidebar.
- Dependencies: `useAdminUserDetail`, `useAdminAbility`, `AdminUserProfile`, `adminUsersApi`.
- Data flow: `userId` prop -> `admin.user.detail` and `admin.user.permissions` queries -> conditional access check -> sidebar/profile render.

- Location: `src/features/admin-panel/users/_ui/admin-user-profile.tsx:172-185`
- What it does: The profile card renders three outline buttons: `Войти под пользователем`, `Сбросить пароль`, and `Отправить сообщение`. The `Отправить сообщение` button has no `onClick`, `href`, `disabled`, or mutation binding in this component.
- Dependencies: `Button`, `Card`, `ProfileAvatar`, `adminUsersApi`.
- Data flow: `profile` and `viewerAbility` props -> card render -> static message button output.

### 2. Admin permissions and authorization boundaries
- Location: `src/features/admin-panel/users/_domain/staff-permission.ts:3-49`
- What it does: Defines `StaffPermissionFlags`, including `canManageSupportChats`, and default permission sets for `ADMIN`, `STAFF`, and `USER`.
- Dependencies: `ROLE` enum from Prisma.
- Data flow: Prisma role -> default permission record -> ability/service consumers.

- Location: `src/features/admin-panel/users/_services/staff-permissions.ts:21-43`
- What it does: Resolves effective permissions for a subject. Non-`STAFF` roles return role defaults immediately; `STAFF` reads persisted permissions from `StaffPermissionRepository` and falls back to role defaults if no row exists.
- Dependencies: `defaultPermissionsByRole`, `StaffPermissionRepository`.
- Data flow: `{id, role}` -> role default lookup -> optional `staffPermission` row lookup -> effective permission object.

- Location: `src/features/admin-panel/users/_domain/ability.ts:7-30`
- What it does: Builds `AdminAbility`. `ADMIN` receives `true` for all resolved flags; `STAFF` uses stored flags gated by `canVisitAdminPanel`; `canManageSupportChats` is included in the returned ability object.
- Dependencies: `SharedSession`, `StaffPermissionFlags`.
- Data flow: session + permission flags -> role booleans -> resolved ability flags.

- Location: `src/features/admin-panel/users/_controller.ts:98-116`, `src/features/admin-panel/users/_controller.ts:118-233`
- What it does: `AdminUsersController` restricts controller access to `ADMIN` or `STAFF` in `ensureAdmin()`, loads effective permissions in `createAbility()`, and applies `checkAbilityProcedure()` to user management procedures. The `permissions` procedure returns `ctx.ability` to the client.
- Dependencies: `checkAbilityProcedure`, `StaffPermissionService`, `createAdminAbility`.
- Data flow: session -> `ensureAdmin()` -> persisted permission lookup -> ability object -> procedure-level `FORBIDDEN` gating.

- Location: `src/features/support-chat/_services/support-chat-service.ts:794-817`
- What it does: `ensureStaffAccess()` allows `ADMIN` immediately. For `STAFF`, it reads `staffPermission.canManageSupportChats` from the database and throws `STAFF_PERMISSION_DENIED` when the flag is missing or false.
- Dependencies: `dbClient.staffPermission`, `createSupportChatError`.
- Data flow: actor role + user id -> `staffPermission` row lookup -> allow or domain error.

- Location: `src/app/api/support-chat/events/route.ts:131-183`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:23-42`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:44-97`
- What it does: The SSE route and attachment download route repeat staff support-chat access checks. `ADMIN` is allowed, `STAFF` requires `canManageSupportChats`, and `USER` is limited to own dialogs on attachment fetch.
- Dependencies: `dbClient.staffPermission`, `getServerSession`, `NextAuthConfig`.
- Data flow: request session -> role-specific permission lookup -> allow/deny response.

### 3. Existing support-chat flow for admin and user actors
- Location: `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:56-305`
- What it does: The admin inbox reads `useAdminAbility()`, blocks UI when `ability.canManageSupportChats` is false, loads dialogs through `useStaffDialogs()`, loads messages through `useStaffDialogMessages(selectedDialogId)`, and sends replies through `useSupportChatActions().sendMessage()`. It selects dialogs by `dialogId` from the dialog list only.
- Dependencies: `useAdminAbility`, `useStaffDialogs`, `useStaffDialogMessages`, `useSupportChatActions`, `useSupportChatStaffSse`.
- Data flow: admin/staff ability query -> support chat dialog query -> selected `dialogId` state -> message query -> send/edit/delete/read mutations.

- Location: `src/features/support-chat/_vm/use-support-chat.ts:141-177`, `src/features/support-chat/_vm/use-support-chat.ts:179-283`
- What it does: `useStaffDialogs()` calls `supportChat.staffListDialogs.useInfiniteQuery()`. `useSupportChatActions()` exposes `createDialog`, `sendMessage`, `markDialogRead`, `editMessage`, and `deleteMessage`, and invalidates `userListDialogs`, `staffListDialogs`, `getUnansweredDialogsCount`, and dialog messages after successful mutations.
- Dependencies: `supportChatApi`, `CACHE_SETTINGS.FREQUENT_UPDATE`.
- Data flow: React component -> tRPC React Query hook -> cache settings -> invalidate related query caches on mutation success.

- Location: `src/features/support-chat/_controller.ts:58-72`, `src/features/support-chat/_controller.ts:141-155`
- What it does: `staffListDialogs` and `createDialog` are both `authorizedProcedure`s. `staffListDialogs` forwards session actor data into `SupportChatService.staffListDialogs()`. `createDialog` forwards session actor data into `SupportChatService.createDialog()`.
- Dependencies: `authorizedProcedure`, Zod schemas, `SupportChatService`.
- Data flow: authenticated session -> input validation -> service call -> error mapping wrapper.

- Location: `src/features/support-chat/_services/support-chat-service.ts:262-349`
- What it does: `staffListDialogs()` requires staff access, lists all dialogs ordered by `lastMessageAt`, includes the dialog user profile, calculates unread counts for the current staff actor, and marks `hasUnansweredIncoming` from the last message/read state.
- Dependencies: `dbClient.chatDialog`, `SupportChatReadService`, `dbClient.chatMessage`.
- Data flow: actor + pagination -> DB dialog read -> unread/read-state calculations -> mapped dialog DTOs -> optional unanswered filter.

- Location: `src/features/support-chat/_services/support-chat-service.ts:694-765`
- What it does: `createDialog()` calls `ensureUserRole()`, so only a `USER` actor can create a dialog through this service. It always creates a new `ChatDialog`, uploads attachments, writes the first `ChatMessage`, publishes `dialog.created` and `message.created`, and triggers Telegram notification.
- Dependencies: `ChatDialogRepository`, `ChatMessageRepository`, `ChatAttachmentRepository`, `fileStorage`, `publishSupportChatEvent`, `TelegramSupportNotifier`.
- Data flow: `USER` actor + message payload -> role check -> new dialog insert -> optional attachment upload -> first message insert -> event publish -> response `{dialogId, createdAt, firstMessageId}`.

- Location: `src/features/support-chat/_services/support-chat-service.ts:351-433`, `src/features/support-chat/_services/support-chat-service.ts:436-486`
- What it does: `sendMessage()` first resolves dialog access for the actor, then stores a message in an existing dialog, updates `lastMessageAt`, recalculates unread counters, publishes `message.created`, and notifies Telegram only for user-originated messages. `markDialogRead()` upserts `SupportReadState` for the reader and publishes `read.updated`.
- Dependencies: `assertDialogAccess()`, `ChatMessageRepository`, `ChatReadStateRepository`, `SupportChatReadService`.
- Data flow: actor + dialog id -> dialog access check -> message/read-state write -> unread count recomputation -> event publish -> DTO response.

- Location: `src/features/support-chat/_services/support-chat-service.ts:767-792`
- What it does: `assertDialogAccess()` enforces ID-based access boundaries. `USER` can access only dialogs where `dialog.userId === actor.id`. `ADMIN` can access any dialog. `STAFF` can access any dialog only after `ensureStaffAccess()`.
- Dependencies: `ChatDialogRepository`, `ensureStaffAccess()`.
- Data flow: `dialogId` + actor -> dialog lookup -> role-specific ownership/permission checks -> dialog entity or domain error.

### 4. Data model, transport, and infrastructure around the chat
- Location: `prisma/schema.prisma:526-614`
- What it does: `StaffPermission` stores `canManageSupportChats`. `ChatDialog` stores `userId`, `lastMessageAt`, timestamps, and indexes on `(userId, updatedAt)` and `lastMessageAt`. `ChatMessage` stores sender identity, optional text, JSON `attachments`, optional `editedAt`/`deletedAt`/`deletedBy`, and indexes on `(dialogId, createdAt)` and `(senderType, createdAt)`. `ChatAttachment` stores uploaded file metadata and relation links to dialog/message. `SupportReadState` stores per-reader read pointers and has a unique constraint on `(dialogId, readerType, readerUserId)`.
- Dependencies: Prisma schema relations to `User`.
- Data flow: dialog row -> message rows -> attachment/read-state rows linked by foreign keys.

- Location: `src/entities/support-chat/_repositories/chat-dialog-repository.ts:13-65`, `src/entities/support-chat/_repositories/chat-message-repository.ts:29-118`, `src/entities/support-chat/_repositories/chat-read-state-repository.ts:17-122`, `src/entities/support-chat/_repositories/chat-attachment-repository.ts:26-168`
- What it does: The repositories wrap Prisma CRUD for dialogs, messages, read states, and attachments. `ChatDialogRepository.create()` always inserts a new row; no repository method searches for a single canonical dialog by user+staff pair.
- Dependencies: `dbClient`.
- Data flow: service input -> repository Prisma call -> entity mapping.

- Location: `src/app/server.ts:32-67`, `src/features/support-chat/module.ts:8-20`, `src/entities/support-chat/module.ts:8-20`, `src/features/admin-panel/users/module.ts:17-34`
- What it does: `createServer()` loads `NextAuthModule`, `TrpcModule`, `AdminUsersModule`, `SupportChatEntityModule`, and `SupportChatModule` into the Inversify container. `SupportChatModule` binds `SupportChatController`, `SupportChatService`, `SupportChatReadService`, and `TelegramSupportNotifier`. `SupportChatEntityModule` binds the four chat repositories.
- Dependencies: `inversify`, module exports from feature/entity layers.
- Data flow: module registration -> DI bindings -> controller/service resolution in API routes.

- Location: `src/app/api/trpc/[trpc]/route.ts:10-20`, `src/kernel/lib/trpc/_procedure.ts:7-42`, `src/kernel/lib/trpc/_context-factory.ts:5-14`, `src/kernel/lib/next-auth/_session-service.ts:6-10`
- What it does: The tRPC route collects all bound `Controller` instances, merges their routers, and builds context through `ContextFactory.createContext()`. `authorizedProcedure` throws `UNAUTHORIZED` when `ctx.session` is absent. `checkAbilityProcedure()` derives and injects `ctx.ability` before executing the procedure.
- Dependencies: Inversify `server`, `ContextFactory`, `SessionService`, `getServerSession`.
- Data flow: HTTP request -> `fetchRequestHandler` -> session lookup -> tRPC middleware -> controller procedure.

- Location: `src/features/support-chat/_vm/use-support-chat.ts:20-29`, `src/features/support-chat/_vm/use-support-chat.ts:45-55`, `src/features/support-chat/_vm/use-support-chat.ts:142-151`, `src/features/admin-panel/users/_hooks/use-admin-users.ts:137-140`, `src/features/admin-panel/users/_hooks/use-admin-user-detail.ts:5-11`, `src/features/admin-panel/users/_hooks/use-admin-ability.ts:5-8`, `docs/caching-strategy.md:5-27`, `src/shared/lib/cache/cache-constants.ts:10-36`
- What it does: The chat feature uses `CACHE_SETTINGS.FREQUENT_UPDATE` for infinite queries and the unanswered count query. Admin users list/detail/ability hooks use explicit `staleTime` values of 30 seconds. The repository caching guide states that React Query is used on the client, data is invalidated after successful updates, and cache settings are centralized in `cache-constants.ts`.
- Dependencies: React Query hooks generated by `createApi()`.
- Data flow: client hook -> cache policy -> server query -> post-mutation invalidation.

- Location: `src/features/support-chat/_services/support-chat-service.ts:970-1068`, `src/shared/lib/file-storage/file-storage.ts:1-3`, `src/shared/lib/file-storage/_model/create-storage.ts:4-10`, `src/shared/lib/file-storage/_providers/minio.ts:16-216`, `src/shared/lib/file-storage/_providers/supabase.ts:11-137`, `src/shared/config/private.ts:19-47`, `src/shared/config/public.ts:16-24`
- What it does: Chat attachments are uploaded through `fileStorage.uploadFile(..., 'support-chat', ownerUserId, 'private')`. `createFileStorage()` selects `MinioStorage` in `development` and `SupabaseStorage` otherwise. `MinioStorage` uses S3-compatible credentials from `privateConfig.S3_*`; `SupabaseStorage` uses `privateConfig.SUPABASE_*`. The public feature flag for route exposure is `NEXT_PUBLIC_ENABLE_SUPPORT_CHAT`, parsed as `publicConfig.ENABLE_SUPPORT_CHAT`.
- Dependencies: S3 client or Supabase client, environment-backed config.
- Data flow: attachment payload -> MIME/size validation -> storage provider upload -> persisted `ChatAttachment` metadata -> later stream download.

## Data flow map (as-is)
Admin user detail route `src/app/(admin)/admin/users/[id]/page.tsx:1-9` -> `AdminUserDetailPage` `src/features/admin-panel/users/_ui/admin-user-detail-page.tsx:33-189` -> `AdminUserProfile` button render `src/features/admin-panel/users/_ui/admin-user-profile.tsx:172-185` -> no current click handler in this surface.

Existing admin chat route `src/app/(admin)/admin/support-chat/page.tsx:1-4` -> `SupportChatAdminInboxPage` `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:56-305` -> `useStaffDialogs()` / `useStaffDialogMessages()` `src/features/support-chat/_vm/use-support-chat.ts:141-177` -> `supportChatApi` `src/features/support-chat/_api.ts:1-4` -> tRPC route merge `src/app/api/trpc/[trpc]/route.ts:10-20` -> `SupportChatController.staffListDialogs` / `userGetMessages` `src/features/support-chat/_controller.ts:58-72`, `src/features/support-chat/_controller.ts:43-57` -> `SupportChatService.staffListDialogs()` / `userGetMessages()` `src/features/support-chat/_services/support-chat-service.ts:208-260`, `src/features/support-chat/_services/support-chat-service.ts:262-349` -> repositories and `dbClient` `src/entities/support-chat/_repositories/*.ts` -> Prisma tables `ChatDialog`, `ChatMessage`, `SupportReadState` `prisma/schema.prisma:541-614` -> response DTOs back into React Query caches.

User-originated dialog creation flow `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:85-121` -> `useSupportChatActions().createDialog()` `src/features/support-chat/_vm/use-support-chat.ts:182-239` -> `SupportChatController.createDialog` `src/features/support-chat/_controller.ts:141-155` -> `SupportChatService.createDialog()` `src/features/support-chat/_services/support-chat-service.ts:694-765` -> `ChatDialogRepository.create()` + `ChatMessageRepository.create()` + optional `ChatAttachmentRepository.createUploaded()` `src/entities/support-chat/_repositories/chat-dialog-repository.ts:13-25`, `src/entities/support-chat/_repositories/chat-message-repository.ts:29-45`, `src/entities/support-chat/_repositories/chat-attachment-repository.ts:26-45` -> `ChatDialog` / `ChatMessage` / `ChatAttachment` rows -> SSE event publish `src/features/support-chat/_integrations/support-chat-events.ts:18-29`.

## Data & schema (as-is)
- Prisma models involved: `StaffPermission`, `ChatDialog`, `ChatMessage`, `ChatAttachment`, and `SupportReadState` define the chat and permission storage surface. `prisma/schema.prisma:526-614`
- Constraints: `StaffPermission.userId` is unique; `SupportReadState` has a unique key on `(dialogId, readerType, readerUserId)`. `ChatDialog.userId` is indexed but not unique. `prisma/schema.prisma:526-614`
- Indexes: `ChatDialog` has `@@index([userId, updatedAt])` and `@@index([lastMessageAt])`; `ChatMessage` has `@@index([dialogId, createdAt])` and `@@index([senderType, createdAt])`; `ChatAttachment` has indexes on `(dialogId, id)`, `messageId`, and `(status, createdAt)`; `SupportReadState` has `@@index([dialogId, readerType])`. `prisma/schema.prisma:541-614`
- Migrations involved: `20251117090853_add_staff_permissions` creates `StaffPermission`; `20251117184358_add_staff_permission` adds `canLoginAsUser`; `20260224133000_add_support_chat` adds `canManageSupportChats`, `SupportDialog`, `SupportMessage`, and `SupportReadState`; `20260225181847_rename_support_chat` renames support-chat constraints/indexes to `Chat*`; `20260225201500_rename_support_chat_to_chat` renames `SupportDialog`/`SupportMessage` tables and the sender enum to `Chat*`; `20260225193000_add_support_attachment` adds `ChatAttachment`; `20260226154500_chat_message_edit_delete` adds `editedAt`, `deletedAt`, and `deletedBy` to `ChatMessage`. `prisma/migrations/20251117090853_add_staff_permissions/migration.sql:1-19`, `prisma/migrations/20251117184358_add_staff_permission/migration.sql:1-2`, `prisma/migrations/20260224133000_add_support_chat/migration.sql:1-90`, `prisma/migrations/20260225181847_rename_support_chat/migration.sql:1-201`, `prisma/migrations/20260225201500_rename_support_chat_to_chat/migration.sql:1-48`, `prisma/migrations/20260225193000_add_support_attachment/migration.sql:1-42`, `prisma/migrations/20260226154500_chat_message_edit_delete/migration.sql:1-5`

## Caching & invalidation (as-is)
- React Query keys used: `supportChat.userListDialogs`, `supportChat.userGetMessages`, `supportChat.staffListDialogs`, and `supportChat.getUnansweredDialogsCount` are the active support-chat query keys exposed through `supportChatApi`. `src/features/support-chat/_vm/use-support-chat.ts:20-29`, `src/features/support-chat/_vm/use-support-chat.ts:45-55`, `src/features/support-chat/_vm/use-support-chat.ts:142-177`
- React Query keys used: `admin.user.list`, `admin.user.detail`, and `admin.user.permissions` are the admin-users query keys used by the admin users surfaces. `src/features/admin-panel/users/_hooks/use-admin-users.ts:137-140`, `src/features/admin-panel/users/_hooks/use-admin-user-detail.ts:5-11`, `src/features/admin-panel/users/_hooks/use-admin-ability.ts:5-8`
- Invalidations used: support-chat mutations invalidate dialog lists, unanswered count, and dialog messages on success. `src/features/support-chat/_vm/use-support-chat.ts:182-230`
- Invalidations used: the admin user detail screen invalidates `admin.user.detail` after freeze/unfreeze and user profile update mutations. `src/features/admin-panel/users/_ui/admin-user-detail-page.tsx:212-221`, `src/features/admin-panel/users/_ui/admin-user-detail-page.tsx:388-396`, `src/features/admin-panel/users/_ui/admin-user-profile.tsx:41-52`
- SSE-triggered invalidation: the support-chat SSE client invalidates dialog lists, unanswered count, and current dialog messages on `dialog.created`, `message.created`, `message.updated`, and `read.updated`. `src/features/support-chat/_vm/use-support-chat.ts:73-135`

## Error handling (as-is)
- Error types: support-chat defines `SupportChatDomainError` with codes such as `DIALOG_NOT_FOUND`, `DIALOG_ACCESS_DENIED`, `STAFF_PERMISSION_DENIED`, `INVALID_MESSAGE`, and message mutation errors. `src/features/support-chat/_domain/errors.ts:1-28`
- Mapping location: `SupportChatController.runWithErrorMapping()` passes `SupportChatDomainError` into `mapSupportChatDomainErrorToTrpc()` and falls back to `INTERNAL_SERVER_ERROR` for unknown errors. `src/features/support-chat/_controller.ts:159-173`
- Mapping behavior: not found errors map to `TRPCError` `NOT_FOUND`; access and permission errors map to `FORBIDDEN`; invalid message and already-read/deleted message states map to `BAD_REQUEST`. `src/features/support-chat/_domain/error-mapping.ts:5-44`
- Admin users controller errors: `AdminUsersController.ensureAdmin()` throws `FORBIDDEN` for non-`ADMIN`/`STAFF`; `update` also throws `FORBIDDEN` when the acting user is not `ADMIN`. `src/features/admin-panel/users/_controller.ts:98-102`, `src/features/admin-panel/users/_controller.ts:136-149`

## Security surface (as-is, facts only)
- authn: tRPC context reads the NextAuth server session via `SessionService.get()` -> `getServerSession(this.nextAuthConfig.options)`. `src/kernel/lib/trpc/_context-factory.ts:8-14`, `src/kernel/lib/next-auth/_session-service.ts:6-10`
- authn: the SSE and attachment routes read the server session directly with `getServerSession(server.get(NextAuthConfig).options)`. `src/app/api/support-chat/events/route.ts:167-175`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:69-77`
- authz: admin users tRPC procedures use `checkAbilityProcedure()` plus `createAdminAbility()`, which carries `canManageSupportChats` in the ability payload. `src/kernel/lib/trpc/_procedure.ts:22-42`, `src/features/admin-panel/users/_controller.ts:104-115`, `src/features/admin-panel/users/_domain/ability.ts:18-29`
- authz: support-chat service gates staff access with `canManageSupportChats` and rejects non-staff/non-admin access via `STAFF_PERMISSION_DENIED`. `src/features/support-chat/_services/support-chat-service.ts:794-817`
- IDOR boundaries: `SupportChatService.assertDialogAccess()` checks `dialog.userId === actor.id` for `USER`, allows any dialog for `ADMIN`, and allows any dialog for permitted `STAFF`. `src/features/support-chat/_services/support-chat-service.ts:767-792`
- IDOR boundaries: attachment download checks dialog ownership for `USER` and staff support-chat permission for staff/admin before loading the attachment by `dialogId` + `attachmentId`. `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:44-63`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:92-104`
- file upload/download flows: uploads are validated by Zod size limits and MIME-type allowlist, then stored through `fileStorage` as private files before `ChatAttachment` metadata is linked to a message. Downloads stream through the attachment route with per-user rate limiting, private cache headers, `Vary: Cookie`, and `X-Content-Type-Options: nosniff`. `src/features/support-chat/_domain/attachment-schema.ts:3-60`, `src/features/support-chat/_services/support-chat-service.ts:970-1052`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:79-150`
- SSE access control: the events route requires authentication, rate-limits per `userId:clientIp`, caps concurrent connections, and filters user events to `event.userId === userId`. `src/app/api/support-chat/events/route.ts:102-129`, `src/app/api/support-chat/events/route.ts:155-165`, `src/app/api/support-chat/events/route.ts:167-328`

## Dependencies (as-is)
- Internal modules: `AdminUsersController` depends on `ListAdminUsersService`, `GetAdminUserDetailService`, `StaffPermissionService`, and access-management services. `src/features/admin-panel/users/_controller.ts:83-94`
- Internal modules: `SupportChatController` depends on `SupportChatService`. `src/features/support-chat/_controller.ts:21-25`
- Internal modules: `SupportChatService` depends on `ChatAttachmentRepository`, `ChatDialogRepository`, `ChatMessageRepository`, `ChatReadStateRepository`, `SupportChatReadService`, and `TelegramSupportNotifier`. `src/features/support-chat/_services/support-chat-service.ts:97-106`
- Internal modules: file storage depends on `createFileStorage()`, which selects `MinioStorage` or `SupabaseStorage`. `src/shared/lib/file-storage/file-storage.ts:1-3`, `src/shared/lib/file-storage/_model/create-storage.ts:4-10`
- External services/packages: tRPC (`@trpc/server`, `@trpc/react-query`, `@trpc/client`), NextAuth (`next-auth`, providers, Prisma adapter), Prisma/Postgres, AWS S3-compatible client for MinIO (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`), Supabase storage client (`@supabase/supabase-js`), and Telegram Bot HTTP API via `fetch`. `src/kernel/lib/trpc/_procedure.ts:2-5`, `src/kernel/lib/next-auth/_next-auth-config.ts:1-18`, `src/shared/lib/file-storage/_providers/minio.ts:1-8`, `src/shared/lib/file-storage/_providers/supabase.ts:1-15`, `src/features/support-chat/_integrations/telegram-support-notifier.ts:28-40`

## Open questions
- The codebase does not define a route contract, query string, or state mechanism for opening `/admin/support-chat` with a preselected user or dialog. `src/app/(admin)/admin/support-chat/page.tsx:1-4`, `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:61-70`
- The codebase does not encode whether one user should have one canonical chat or multiple chats; the schema and `createDialog()` path currently allow multiple `ChatDialog` rows for the same `userId`. `prisma/schema.prisma:541-554`, `src/features/support-chat/_services/support-chat-service.ts:694-709`

## Files inspected
- `docs/ai/features/admin-user-chat/00-brief.md`
- `docs/ai/commands/research-codebase.md`
- `docs/caching-strategy.md`
- `prisma/schema.prisma`
- `prisma/migrations/20251117090853_add_staff_permissions/migration.sql`
- `prisma/migrations/20251117184358_add_staff_permission/migration.sql`
- `prisma/migrations/20260224133000_add_support_chat/migration.sql`
- `prisma/migrations/20260225181847_rename_support_chat/migration.sql`
- `prisma/migrations/20260225193000_add_support_attachment/migration.sql`
- `prisma/migrations/20260225201500_rename_support_chat_to_chat/migration.sql`
- `prisma/migrations/20260226154500_chat_message_edit_delete/migration.sql`
- `src/app/server.ts`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/api/support-chat/events/route.ts`
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/app/(admin)/admin/users/page.tsx`
- `src/app/(admin)/admin/users/[id]/page.tsx`
- `src/app/(admin)/admin/support-chat/page.tsx`
- `src/app/platform/(profile)/support-chat/page.tsx`
- `src/features/admin-panel/users/module.ts`
- `src/features/admin-panel/users/_api.ts`
- `src/features/admin-panel/users/_controller.ts`
- `src/features/admin-panel/users/_domain/ability.ts`
- `src/features/admin-panel/users/_domain/staff-permission.ts`
- `src/features/admin-panel/users/_domain/user-detail.ts`
- `src/features/admin-panel/users/_hooks/use-admin-ability.ts`
- `src/features/admin-panel/users/_hooks/use-admin-user-detail.ts`
- `src/features/admin-panel/users/_hooks/use-admin-users.ts`
- `src/features/admin-panel/users/_repositories/admin-users.ts`
- `src/features/admin-panel/users/_repositories/staff-permissions.ts`
- `src/features/admin-panel/users/_services/get-admin-user-detail.ts`
- `src/features/admin-panel/users/_services/staff-permissions.ts`
- `src/features/admin-panel/users/_services/update-admin-user.ts`
- `src/features/admin-panel/users/_services/users-list.ts`
- `src/features/admin-panel/users/_ui/admin-user-detail-page.tsx`
- `src/features/admin-panel/users/_ui/admin-user-profile.tsx`
- `src/features/admin-panel/users/_ui/admin-users-page.tsx`
- `src/features/admin-panel/users/_ui/tables/users/columns.tsx`
- `src/features/support-chat/index.ts`
- `src/features/support-chat/module.ts`
- `src/features/support-chat/_api.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_domain/attachment-http-cache.ts`
- `src/features/support-chat/_domain/attachment-rate-limit.ts`
- `src/features/support-chat/_domain/attachment-schema.ts`
- `src/features/support-chat/_domain/error-mapping.ts`
- `src/features/support-chat/_domain/errors.ts`
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_integrations/support-chat-events.ts`
- `src/features/support-chat/_integrations/telegram-support-notifier.ts`
- `src/features/support-chat/_services/support-chat-read-service.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/entities/support-chat/module.ts`
- `src/entities/support-chat/_repositories/chat-attachment-repository.ts`
- `src/entities/support-chat/_repositories/chat-dialog-repository.ts`
- `src/entities/support-chat/_repositories/chat-message-repository.ts`
- `src/entities/support-chat/_repositories/chat-read-state-repository.ts`
- `src/kernel/lib/trpc/module.ts`
- `src/kernel/lib/trpc/_controller.ts`
- `src/kernel/lib/trpc/_procedure.ts`
- `src/kernel/lib/trpc/_context-factory.ts`
- `src/kernel/lib/trpc/client.ts`
- `src/kernel/lib/next-auth/module.ts`
- `src/kernel/lib/next-auth/_session-service.ts`
- `src/kernel/lib/next-auth/_next-auth-config.ts`
- `src/kernel/lib/next-auth/client.tsx`
- `src/shared/config/public.ts`
- `src/shared/config/private.ts`
- `src/shared/lib/cache/cache-constants.ts`
- `src/shared/lib/file-storage/file-storage.ts`
- `src/shared/lib/file-storage/_model/create-storage.ts`
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/lib/file-storage/_providers/supabase.ts`
