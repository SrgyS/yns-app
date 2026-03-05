---
date: 2026-03-05
researcher: Codex
branch: feat/react-compiler
commit: f8271b9
feature: chat-optimistic-update
research_question: "Как в текущем коде support-chat реализованы sendMessage, SSE, React Query invalidation и схема данных относительно optimistic send/clientMessageId?"
---

# Research: chat-optimistic-update

## Summary
Текущий поток support-chat использует tRPC mutation `supportChat.sendMessage` без поля `clientMessageId` во входе и без `clientMessageId` в ответе. Валидация входа идет через `sendMessageInputSchema`, затем `SupportChatService.sendMessage()` создает запись `ChatMessage`, обновляет `ChatDialog.lastMessageAt`, считает unread и публикует событие `message.created` в in-memory event bus (`src/features/support-chat/_domain/schemas.ts:26-49`, `src/features/support-chat/_controller.ts:87-101`, `src/features/support-chat/_services/support-chat-service.ts:358-441`, `src/features/support-chat/_integrations/support-chat-events.ts:1-29`).

Клиентский слой чата (`useSupportChatActions`) не делает optimistic cache write в `onMutate`; после успешной мутации выполняется invalidate ключей (`userListDialogs`, `staffListDialogs`, `getUnansweredDialogsCount`, `userGetMessages`). SSE-подписка на `/api/support-chat/events` также приводит к invalidation тех же query-групп по `dialog.created`, `message.created`, `message.updated`, `read.updated` (`src/features/support-chat/_vm/use-support-chat.ts:73-135`, `src/features/support-chat/_vm/use-support-chat.ts:199-240`).

Схема БД для чата использует `ChatDialog` (канонический один диалог на пользователя через `userId @unique`), `ChatMessage`, `ChatAttachment`, `SupportReadState`. В `ChatMessage` отсутствует столбец `clientMessageId`, а event payload `SupportChatEvent` содержит только `type`, `dialogId`, `userId`, `occurredAt` (`prisma/schema.prisma:541-614`, `src/features/support-chat/_integrations/support-chat-events.ts:7-12`).

## Entry points (as-is)
- Next.js routes/pages:
  - `src/app/platform/(profile)/support-chat/page.tsx:8-25` — server route для user, проверяет feature flag и session role, рендерит `SupportChatUserPage`.
  - `src/app/(admin)/admin/support-chat/page.tsx:1-4` — admin route, рендерит `SupportChatAdminInboxPage`.
  - `src/app/api/support-chat/events/route.ts:167-328` — SSE endpoint с auth/rate-limit/connection limits.
  - `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:69-151` — private attachment download endpoint.
- tRPC procedures/routers:
  - `src/features/support-chat/_controller.ts:28-170` — router `supportChat.*` (`userListDialogs`, `userGetMessages`, `staffListDialogs`, `staffOpenDialogForUser`, `sendMessage`, `markDialogRead`, `getUnansweredDialogsCount`, `editMessage`, `deleteMessage`, `createDialog`).
  - `src/app/api/trpc/[trpc]/route.ts:10-18` — merge всех DI-контроллеров в `/api/trpc`.
- UI components:
  - `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:30-244` — user chat экран, отправка через `sendMessage/createDialog`.
  - `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:57-614` — staff/admin inbox, отправка через `sendMessage`.
  - `src/features/support-chat/_ui/support-chat-conversation-card.tsx:119-292` — общий conversation UI (список сообщений + composer).

## Detailed findings
### 1) DI container, auth, tRPC wiring
- Location: `src/app/server.ts:32-67`, `src/features/support-chat/module.ts:8-15`, `src/entities/support-chat/module.ts:8-15`, `src/kernel/lib/trpc/_procedure.ts:7-20`, `src/kernel/lib/trpc/_context-factory.ts:8-14`, `src/kernel/lib/next-auth/_session-service.ts:6-10`, `src/app/api/trpc/[trpc]/route.ts:10-18`.
- What it does: `createServer()` загружает feature/entity/kernel модули в Inversify; `SupportChatModule` регистрирует controller/service/read-service/notifier, `SupportChatEntityModule` регистрирует chat repositories. tRPC `authorizedProcedure` требует `ctx.session`; context строится из `SessionService.get()` (NextAuth session).
- Dependencies: Inversify `Container`, `Controller` abstraction, `ContextFactory`, `SessionService`, NextAuth config.
- Data flow: HTTP `/api/trpc` -> merged tRPC router -> `authorizedProcedure` session check -> controller procedure -> service.

### 2) Send message path (no optimistic write on client)
- Location: `src/features/support-chat/_domain/schemas.ts:26-49`, `src/features/support-chat/_controller.ts:87-101`, `src/features/support-chat/_services/support-chat-service.ts:358-441`, `src/entities/support-chat/_repositories/chat-message-repository.ts:29-45`, `src/entities/support-chat/_repositories/chat-dialog-repository.ts:107-118`, `src/features/support-chat/_vm/use-support-chat.ts:199-208`, `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:85-121`, `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:166-198`.
- What it does: `sendMessageInputSchema` принимает `dialogId`, `text?`, `attachments?`; `clientMessageId` отсутствует. Service проверяет доступ/валидность сообщения, загружает attachments, создает `ChatMessage`, touch `lastMessageAt`, считает unread, публикует `message.created`, возвращает `{message, dialog, unread}`. Клиент после success делает invalidate query-ключей; `onMutate` logic отсутствует.
- Dependencies: `ChatMessageRepository`, `ChatDialogRepository`, `SupportChatReadService`, `fileStorage`, `TelegramSupportNotifier`, `publishSupportChatEvent`.
- Data flow: UI submit -> tRPC mutation -> zod validation -> `SupportChatService.sendMessage()` -> Prisma/repositories + optional file storage + event publish -> mutation response -> React Query invalidation.

### 3) Realtime/SSE and cache invalidation behavior
- Location: `src/features/support-chat/_integrations/support-chat-events.ts:1-29`, `src/app/api/support-chat/events/route.ts:23-67`, `src/app/api/support-chat/events/route.ts:167-328`, `src/features/support-chat/_vm/use-support-chat.ts:73-135`, `src/features/support-chat/_vm/use-support-chat.ts:199-240`.
- What it does: In-memory listener set получает события `dialog.created|message.created|message.updated|read.updated`. SSE route подписывается на bus и шлет события авторизованному клиенту; для USER фильтрует по `event.userId`. Клиентские SSE handlers не мержат payload в кэш вручную, а вызывают invalidate queries.
- Dependencies: `EventSource`, `subscribeToSupportChatEvents`, React Query utils invalidation.
- Data flow: service `publishSupportChatEvent` -> SSE route listener -> browser EventSource event -> invalidate dialogs/messages queries -> refetch через tRPC.

### 4) Data model, storage, and attachment access
- Location: `prisma/schema.prisma:541-614`, `prisma/schema.prisma:556-575`, `prisma/migrations/20260304120000_canonicalize_chat_dialog_per_user/migration.sql:101-103`, `src/features/support-chat/_services/support-chat-service.ts:1024-1106`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:92-151`, `src/shared/lib/file-storage/_model/create-storage.ts:6-10`, `src/shared/lib/file-storage/_providers/minio.ts:16-216`, `src/shared/lib/file-storage/_providers/supabase.ts:11-137`, `src/shared/config/private.ts:19-31`, `AGENTS.md:11`.
- What it does: Chat persistence — `ChatDialog` (unique `userId`), `ChatMessage`, `ChatAttachment`, `SupportReadState`; `ChatMessage` не содержит `clientMessageId`. Attachments загружаются через `fileStorage.uploadFile(..., 'private')`, сохраняются в `ChatAttachment`, затем линкуются к message. Download endpoint проверяет session+ACL+rate-limit и stream’ит файл из storage provider.
- Dependencies: Prisma models/migrations, MinioStorage (dev), SupabaseStorage (non-dev), S3/Supabase env config.
- Data flow: UI selects file -> `toSupportChatAttachments` base64 -> `sendMessage/createDialog` -> `uploadAttachments` -> storage provider upload + `ChatAttachment` row -> message stores attachment metadata JSON -> attachment API route validates access -> `downloadStreamByPath` response.

## Data flow map (as-is)
UI (`SupportChatUserPage` / `SupportChatAdminInboxPage`) -> hook (`useSupportChatActions`) -> tRPC client (`supportChatApi`) -> `/api/trpc` handler merge -> `SupportChatController.sendMessage` -> `sendMessageInputSchema` validation -> `SupportChatService.sendMessage` -> repositories/Prisma (`ChatDialog`, `ChatMessage`, `ChatAttachment`, `SupportReadState`) + storage upload + optional Telegram -> in-memory `publishSupportChatEvent` -> SSE route forwards event -> client invalidates queries -> refetch response (`src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:85-121`, `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:166-198`, `src/features/support-chat/_vm/use-support-chat.ts:179-240`, `src/features/support-chat/_controller.ts:87-101`, `src/features/support-chat/_services/support-chat-service.ts:358-441`, `src/app/api/support-chat/events/route.ts:297-303`).

## Data & schema (as-is)
- Prisma models involved:
  - `ChatDialog` with `userId @unique`, `lastMessageAt`, timestamps (`prisma/schema.prisma:541-554`).
  - `ChatMessage` with sender refs, `text`, `attachments Json?`, `editedAt/deletedAt/deletedBy`, indexes (`prisma/schema.prisma:556-575`).
  - `ChatAttachment` with `storagePath`, `status`, metadata, indexes (`prisma/schema.prisma:577-598`).
  - `SupportReadState` unique composite `[dialogId, readerType, readerUserId]` (`prisma/schema.prisma:600-614`).
- Constraints:
  - one dialog per user enforced by schema (`ChatDialog.userId @unique`) and migration unique index (`prisma/schema.prisma:543`, `prisma/migrations/20260304120000_canonicalize_chat_dialog_per_user/migration.sql:101-103`).
  - read-state unique key (`prisma/schema.prisma:612`).
- Indexes (chat):
  - `ChatDialog.updatedAt`, `ChatDialog.lastMessageAt` (`prisma/schema.prisma:552-553`).
  - `ChatMessage.dialogId+createdAt`, `senderType+createdAt` (`prisma/schema.prisma:573-574`).
  - `ChatAttachment` and `SupportReadState` indexes (`prisma/schema.prisma:595-597`, `prisma/schema.prisma:613`).
- Migrations involved (chat):
  - initial support chat tables/enums (`prisma/migrations/20260224133000_add_support_chat/migration.sql:1-90`).
  - rename Support* constraints/index names toward Chat* (`prisma/migrations/20260225181847_rename_support_chat/migration.sql:1-201`).
  - attachments table (`prisma/migrations/20260225193000_add_support_attachment/migration.sql:1-42`).
  - message edit/delete columns (`prisma/migrations/20260226154500_chat_message_edit_delete/migration.sql:1-5`).
  - canonical one-dialog-per-user migration (`prisma/migrations/20260304120000_canonicalize_chat_dialog_per_user/migration.sql:1-103`).

## Caching & invalidation (as-is)
- Policy baseline: React Query cache strategy and invalidation principles are documented in `docs/caching-strategy.md:5-27` and constants in `src/shared/lib/cache/cache-constants.ts:10-37`.
- Support-chat query keys used:
  - `supportChat.userListDialogs`, `supportChat.userGetMessages`, `supportChat.staffListDialogs`, `supportChat.getUnansweredDialogsCount` (`src/features/support-chat/_vm/use-support-chat.ts:20-55`, `src/features/support-chat/_vm/use-support-chat.ts:142-177`).
- Invalidation sources:
  - Mutation success (`createDialog/sendMessage/markDialogRead/editMessage/deleteMessage/staffOpenDialogForUser`) invalidates corresponding chat keys (`src/features/support-chat/_vm/use-support-chat.ts:182-240`).
  - SSE handlers (`dialog.created/message.created/message.updated/read.updated`) invalidates dialog/message/unanswered queries (`src/features/support-chat/_vm/use-support-chat.ts:82-125`).
- Current state for optimistic updates:
  - No `onMutate`/manual cache insert/update in `useSupportChatActions` for `sendMessage` (`src/features/support-chat/_vm/use-support-chat.ts:199-208`).

## Error handling (as-is)
- Domain errors are represented by `SupportChatDomainError` + error codes (`src/features/support-chat/_domain/errors.ts:1-30`).
- Controller wrapper `runWithErrorMapping()` maps domain errors to `TRPCError` and falls back to `INTERNAL_SERVER_ERROR` (`src/features/support-chat/_controller.ts:173-186`).
- Mapping table (`NOT_FOUND/FORBIDDEN/BAD_REQUEST/...`) defined in `mapSupportChatDomainErrorToTrpc` (`src/features/support-chat/_domain/error-mapping.ts:5-49`).
- Input validation errors come from zod schemas for tRPC procedures (`src/features/support-chat/_domain/schemas.ts:7-88`).

## Security surface (as-is, facts only)
- authn: session read in tRPC context via `SessionService.get()` and `authorizedProcedure`; REST SSE/attachments routes use `getServerSession(server.get(NextAuthConfig).options)` (`src/kernel/lib/trpc/_context-factory.ts:8-14`, `src/kernel/lib/trpc/_procedure.ts:11-20`, `src/app/api/support-chat/events/route.ts:167-175`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:73-77`).
- authz:
  - Chat service access checks by role + `StaffPermission.canManageSupportChats` (`src/features/support-chat/_services/support-chat-service.ts:821-871`).
  - SSE route enforces staff access + per-user filtering for user role (`src/app/api/support-chat/events/route.ts:131-165`, `src/app/api/support-chat/events/route.ts:178-183`, `src/app/api/support-chat/events/route.ts:297-303`).
  - Attachment route checks dialog ownership for USER and staff permission for STAFF/ADMIN (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:23-63`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:94-97`).
- IDOR boundaries:
  - `assertDialogAccess()` in service checks dialog owner/role before read/write operations (`src/features/support-chat/_services/support-chat-service.ts:821-846`).
  - attachment endpoint returns `404` when access check fails (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:94-97`).
- file upload/download flows:
  - Upload: base64 -> mime check -> size check -> sanitized file name -> `fileStorage.uploadFile(..., 'private')` -> DB link (`src/features/support-chat/_services/support-chat-service.ts:1024-1106`).
  - Download: access check -> cache validators -> `fileStorage.downloadStreamByPath` -> response headers (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:106-151`).

## Dependencies (as-is)
- Internal modules:
  - DI and module composition (`src/app/server.ts:32-67`, `src/features/support-chat/module.ts:8-15`, `src/entities/support-chat/module.ts:8-15`).
  - Support-chat domain/services/repos/hooks (`src/features/support-chat/_controller.ts:28-170`, `src/features/support-chat/_services/support-chat-service.ts:103-1123`, `src/features/support-chat/_vm/use-support-chat.ts:19-299`, `src/entities/support-chat/_repositories/chat-*.ts`).
  - Storage and config (`src/shared/lib/file-storage/*`, `src/shared/config/private.ts:19-31`, `src/shared/config/public.ts:7-23`).
- External services/packages:
  - NextAuth (`next-auth`) for session/auth (`src/kernel/lib/next-auth/_next-auth-config.ts:27-147`).
  - tRPC (`@trpc/server`, `@trpc/react-query`) (`src/kernel/lib/trpc/_procedure.ts:2-5`).
  - Prisma/Postgres (`@prisma/client`, migrations) (`src/shared/lib/db.ts:1-11`, `prisma/schema.prisma`).
  - S3-compatible client in Minio provider (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`) (`src/shared/lib/file-storage/_providers/minio.ts:2-7`).
  - Supabase storage SDK (`@supabase/supabase-js`) (`src/shared/lib/file-storage/_providers/supabase.ts:2-15`).
  - Telegram Bot API via `fetch` in notifier (`src/features/support-chat/_integrations/telegram-support-notifier.ts:28-40`).

## Open questions
- Ответ от владельца задачи: `clientMessageId` вводится как internal correlation id для optimistic UI и дедупликации SSE/refetch.
- `clientMessageId` не является частью публичного API.
- Внедрение выполняется в рамках этого репозитория (`tRPC + DB + SSE`).
- Для совместимости серверный контракт должен принимать `clientMessageId` как optional, клиентский слой использует `clientMessageId` всегда.

## Files inspected
- `AGENTS.md`
- `docs/caching-strategy.md`
- `prisma/schema.prisma`
- `prisma/migrations/20260224133000_add_support_chat/migration.sql`
- `prisma/migrations/20260225181847_rename_support_chat/migration.sql`
- `prisma/migrations/20260225193000_add_support_attachment/migration.sql`
- `prisma/migrations/20260226154500_chat_message_edit_delete/migration.sql`
- `prisma/migrations/20260304120000_canonicalize_chat_dialog_per_user/migration.sql`
- `src/app/server.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/api/support-chat/events/route.ts`
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/app/(admin)/admin/support-chat/page.tsx`
- `src/app/platform/(profile)/support-chat/page.tsx`
- `src/app/_providers/app-provider.tsx`
- `src/kernel/lib/trpc/module.ts`
- `src/kernel/lib/trpc/_context-factory.ts`
- `src/kernel/lib/trpc/_controller.ts`
- `src/kernel/lib/trpc/_procedure.ts`
- `src/kernel/lib/trpc/client.ts`
- `src/kernel/lib/next-auth/module.ts`
- `src/kernel/lib/next-auth/_next-auth-config.ts`
- `src/kernel/lib/next-auth/_session-service.ts`
- `src/kernel/lib/next-auth/client.tsx`
- `src/features/support-chat/index.ts`
- `src/features/support-chat/module.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_services/support-chat-read-service.ts`
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/_api.ts`
- `src/features/support-chat/_integrations/support-chat-events.ts`
- `src/features/support-chat/_integrations/telegram-support-notifier.ts`
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_domain/errors.ts`
- `src/features/support-chat/_domain/error-mapping.ts`
- `src/features/support-chat/_domain/attachment-schema.ts`
- `src/features/support-chat/_domain/attachment-rate-limit.ts`
- `src/features/support-chat/_domain/attachment-http-cache.ts`
- `src/features/support-chat/_ui/support-chat-conversation-card.tsx`
- `src/features/support-chat/_ui/support-chat-attachments-upload.ts`
- `src/features/support-chat/_ui/support-chat-message-attachments.tsx`
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
- `src/entities/support-chat/module.ts`
- `src/entities/support-chat/_repositories/chat-dialog-repository.ts`
- `src/entities/support-chat/_repositories/chat-message-repository.ts`
- `src/entities/support-chat/_repositories/chat-read-state-repository.ts`
- `src/entities/support-chat/_repositories/chat-attachment-repository.ts`
- `src/shared/config/private.ts`
- `src/shared/config/public.ts`
- `src/shared/lib/db.ts`
- `src/shared/lib/cache/cache-constants.ts`
- `src/shared/lib/cache/cache-invalidation.ts`
- `src/shared/api/query-client.ts`
- `src/shared/api/server-helpers.ts`
- `src/shared/lib/file-storage/file-storage.ts`
- `src/shared/lib/file-storage/_model/create-storage.ts`
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/lib/file-storage/_providers/supabase.ts`
- `src/shared/lib/file-storage/types.ts`
- `src/shared/lib/file-storage/utils.ts`
