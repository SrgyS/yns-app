---
date: 2026-02-25
researcher: Codex
branch: feat/react-compiler
commit: c304731
feature: preview-img-support-chat
research_question: "How is support-chat attachment preview/download implemented as-is, including authz, storage access (public/private buckets), tRPC/UI integration, and operational constraints in the current codebase?"
---

# Research: preview-img-support-chat

## Summary
Support-chat is wired through the shared Inversify container in `createServer()` and registered as both entity repositories and feature services/controllers. The tRPC API is composed by collecting all `Controller` bindings and merging routers under `/api/trpc` (`src/app/server.ts:32-65`, `src/features/support-chat/module.ts:8-15`, `src/entities/support-chat/module.ts:7-13`, `src/app/api/trpc/[trpc]/route.ts:10-20`).

Attachment upload for support-chat is handled inside `SupportChatService.uploadAttachments()`, which validates MIME and size metadata, converts base64 to bytes, and stores files via `fileStorage.uploadFile(..., 'private')` using tag `support-chat` and owner user id (`src/features/support-chat/_services/support-chat-service.ts:538-585`). The resulting metadata (`id/name/path/type/sizeBytes`) is stored in `ChatMessage.attachments` JSON (`src/features/support-chat/_services/support-chat-service.ts:273-280`, `prisma/schema.prisma:549-560`).

Attachment preview/download is served through a dedicated Next.js route `/api/support-chat/attachments/[dialogId]/[attachmentId]` that reads server session, checks dialog access by role/ownership, scans message attachments JSON for `attachmentId`, downloads bytes from storage by path, and returns inline HTTP response with content headers (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:85-129`). UI components render image/video/pdf previews and file links using this route (`src/features/support-chat/_ui/support-chat-message-attachments.tsx:16-139`).

## Entry points (as-is)
- Next.js routes/pages:
  - `src/app/platform/(profile)/support-chat/page.tsx:8-25` — user entrypoint for support-chat, gated by feature flag and session role.
  - `src/app/(admin)/admin/support-chat/page.tsx:3-5` — admin entrypoint rendering staff inbox page.
  - `src/app/api/trpc/[trpc]/route.ts:12-20` — tRPC HTTP handler (`GET`/`POST`) with merged routers.
  - `src/app/api/support-chat/events/route.ts:166-327` — SSE stream for support-chat events.
  - `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:85-129` — private attachment read endpoint.
- tRPC procedures/routers:
  - `src/features/support-chat/_controller.ts:25-116` — `supportChat` router with procedures: `userListDialogs`, `userGetMessages`, `staffListDialogs`, `sendMessage`, `markDialogRead`, `createDialog`.
  - `src/kernel/lib/trpc/_procedure.ts:11-20` — `authorizedProcedure` session guard.
- UI components:
  - `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:28-347` — user dialogs/thread/composer.
  - `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:29-383` — staff inbox/thread/composer.
  - `src/features/support-chat/_ui/support-chat-message-attachments.tsx:102-139` — attachment preview rendering.

## Detailed findings
### 1 DI container, module loading, and tRPC composition
- Location: `src/app/server.ts:32-65`, `src/features/support-chat/module.ts:8-15`, `src/entities/support-chat/module.ts:7-13`, `src/app/api/trpc/[trpc]/route.ts:10-20`
- What it does: `createServer()` loads all container modules, including `SupportChatEntityModule` and `SupportChatModule`. tRPC route collects every bound `Controller` and merges their routers with `sharedRouter`.
- Dependencies: Inversify `Container`, `Controller` abstraction, `fetchRequestHandler`.
- Data flow: Container module load -> controller bindings resolved -> merged router in `/api/trpc` handler -> request dispatched to procedure.

### 2 Auth/session and authorization enforcement
- Location: `src/kernel/lib/next-auth/_session-service.ts:6-10`, `src/kernel/lib/next-auth/_next-auth-config.ts:27-91`, `src/kernel/lib/trpc/_context-factory.ts:8-14`, `src/kernel/lib/trpc/_procedure.ts:11-20`, `src/features/support-chat/_services/support-chat-service.ts:462-520`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:89-100`
- What it does:
  - NextAuth uses JWT session strategy and populates `session.user.id/role` in callbacks.
  - tRPC context fetches server session and `authorizedProcedure` rejects requests without session.
  - Support-chat service enforces role/permission checks (`USER` ownership, `ADMIN` allow, `STAFF` requires `canManageSupportChats`).
  - Attachment route uses `getServerSession` and dialog ownership/role checks before file read.
- Dependencies: `getServerSession`, Prisma `staffPermission`, support-chat service/domain errors.
- Data flow: HTTP/tRPC request -> server session read -> role/ownership check -> proceed or reject.

### 3 Support-chat procedures, services, and repositories
- Location: `src/features/support-chat/_controller.ts:25-133`, `src/features/support-chat/_services/support-chat-service.ts:91-602`, `src/features/support-chat/_services/support-chat-read-service.ts:15-106`, `src/entities/support-chat/_repositories/support-conversation-repository.ts:13-82`, `src/entities/support-chat/_repositories/support-message-repository.ts:29-112`, `src/entities/support-chat/_repositories/support-read-state-repository.ts:17-122`
- What it does:
  - Controller maps tRPC inputs to service methods and wraps domain errors.
  - Service handles dialog/message CRUD, unread counts, read markers, staff access checks, attachment upload, SSE publish, and Telegram notifications.
  - Repositories encapsulate Prisma operations for `ChatDialog`, `ChatMessage`, and `SupportReadState`.
- Dependencies: `dbClient`, entity repositories, `fileStorage`, `publishSupportChatEvent`, `TelegramSupportNotifier`, domain schemas/errors.
- Data flow: Procedure input -> zod validation -> service authz/business logic -> repository/db writes/reads -> side effects (SSE/Telegram) -> response DTO.

### 4 Attachment validation, storage, and retrieval path
- Location: `src/features/support-chat/_domain/attachment-schema.ts:3-54`, `src/features/support-chat/_services/support-chat-service.ts:538-585`, `src/shared/lib/file-storage/_providers/minio.ts:18-129`, `src/shared/lib/file-storage/_providers/supabase.ts:12-96`, `src/shared/lib/file-storage/_model/create-storage.ts:6-10`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:61-129`, `src/features/support-chat/_ui/support-chat-message-attachments.tsx:16-139`
- What it does:
  - Incoming attachment payloads are schema-validated and MIME-checked against allowlist.
  - Upload uses storage abstraction with `accessLevel` (`public`/`private`) and tag-based key format `${tag}/${userId}/...` in both providers.
  - Support-chat uploads call `uploadFile(..., 'private')` with tag `support-chat`.
  - Attachment read route resolves metadata from message JSON, fetches file bytes by storage path, and returns `inline` response.
  - UI builds preview/open URLs to the attachment route for image/video/pdf/file link rendering.
- Dependencies: MinIO S3 client, Supabase storage client, Next.js API route, message attachments JSON metadata.
- Data flow: Browser file -> base64 payload -> service validation -> storage upload -> metadata JSON in message -> UI URL -> attachment route authz -> storage download -> browser preview.

### 5 Realtime events, caching, and invalidation
- Location: `src/app/api/support-chat/events/route.ts:14-327`, `src/features/support-chat/_integrations/support-chat-events.ts:14-25`, `src/features/support-chat/_vm/use-support-chat.ts:72-252`, `src/shared/lib/cache/cache-constants.ts:10-37`, `docs/caching-strategy.md:5-27`
- What it does:
  - SSE endpoint publishes `connected/heartbeat/dialog.created/message.created/read.updated` with rate limiting, per-user/per-IP connection caps, max duration, idle timeout, and cleanup on close/abort.
  - In-memory event bus (`listeners` set) is used for publish/subscribe.
  - React Query hooks use `CACHE_SETTINGS.FREQUENT_UPDATE` and invalidate dialog/message queries on SSE events and mutation success.
- Dependencies: `EventSource`, tRPC React Query utils, in-memory listener set/maps.
- Data flow: service emits event -> SSE route forwards event to subscribed clients -> client invalidates queries -> refetch over tRPC.

### 6 Prisma schema and migration state for support-chat
- Location: `prisma/schema.prisma:154-163`, `prisma/schema.prisma:520-580`, `prisma/migrations/20260224133000_add_support_chat/migration.sql:1-90`, `prisma/migrations (directory listing)`
- What it does:
  - Defines enums `ChatMessageSenderType`, `SupportReadType`.
  - Defines models `ChatDialog`, `ChatMessage`, `SupportReadState` and `StaffPermission.canManageSupportChats`.
  - Migration `20260224133000_add_support_chat` creates enums/tables/indexes/FKs and alters `StaffPermission`.
  - Migration folders use timestamped naming (`YYYYMMDDHHMMSS_*`) in `prisma/migrations`.
- Dependencies: PostgreSQL schema managed through Prisma migrations.
- Data flow: Prisma model definitions -> migration SQL -> runtime repository queries.

## Data flow map (as-is)
- Chat message flow:
  - UI (`support-chat-user-page` / `support-chat-admin-inbox-page`) -> tRPC hook (`supportChatApi.*`) -> `/api/trpc` handler -> `SupportChatController` procedure -> `SupportChatService` -> repositories/Prisma (`ChatDialog`, `ChatMessage`, `SupportReadState`) -> response (`src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:104-140`, `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:103-136`, `src/features/support-chat/_controller.ts:25-116`, `src/features/support-chat/_services/support-chat-service.ts:257-460`).
- Attachment upload flow:
  - UI file input -> base64 payload -> `sendMessage/createDialog` attachment input -> `uploadAttachments()` -> `fileStorage.uploadFile(..., 'private')` -> metadata JSON in `ChatMessage.attachments` (`src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:308-347`, `src/features/support-chat/_services/support-chat-service.ts:538-585`, `src/entities/support-chat/_repositories/support-message-repository.ts:33-41`).
- Attachment preview/download flow:
  - UI preview component -> `/api/support-chat/attachments/:dialogId/:attachmentId` -> session/authz checks -> find attachment in message JSON -> `fileStorage.downloadByPath(path)` -> binary response (`src/features/support-chat/_ui/support-chat-message-attachments.tsx:16-139`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:61-129`).

## Data & schema (as-is)
- Prisma models involved:
  - `ChatDialog` (`prisma/schema.prisma:535-547`)
  - `ChatMessage` (`prisma/schema.prisma:549-564`)
  - `SupportReadState` (`prisma/schema.prisma:566-580`)
  - `StaffPermission` with `canManageSupportChats` (`prisma/schema.prisma:520-533`)
- Constraints:
  - `SupportReadState` unique composite `(dialogId, readerType, readerUserId)` (`prisma/schema.prisma:578`)
  - FKs in migration SQL from support tables to `User`/`ChatDialog` (`prisma/migrations/20260224133000_add_support_chat/migration.sql:68-90`)
- Indexes:
  - `ChatDialog(userId, updatedAt)`, `ChatDialog(lastMessageAt)` (`prisma/schema.prisma:545-546`)
  - `ChatMessage(dialogId, createdAt)`, `ChatMessage(senderType, createdAt)` (`prisma/schema.prisma:562-563`)
  - `SupportReadState(dialogId, readerType)` (`prisma/schema.prisma:579`)
- Migrations involved:
  - `20260224133000_add_support_chat` (`prisma/migrations/20260224133000_add_support_chat/migration.sql:1-90`)

## Caching & invalidation (as-is)
- React Query policy constants:
  - `CACHE_SETTINGS.FREQUENT_UPDATE` etc. (`src/shared/lib/cache/cache-constants.ts:10-37`)
- Support-chat query keys/hooks:
  - `userListDialogs`, `userGetMessages`, `staffListDialogs` infinite queries (`src/features/support-chat/_vm/use-support-chat.ts:18-141`)
- Invalidations:
  - On SSE events (`dialog.created/message.created/read.updated`) (`src/features/support-chat/_vm/use-support-chat.ts:72-192`)
  - On mutation success (`createDialog/sendMessage/markDialogRead`) (`src/features/support-chat/_vm/use-support-chat.ts:197-219`)
- Caching strategy document:
  - shared policy text in `docs/caching-strategy.md:5-27`.

## Error handling (as-is)
- Domain errors:
  - `SupportChatDomainError` and codes (`src/features/support-chat/_domain/errors.ts:1-25`)
- Mapping:
  - domain error -> `TRPCError` (`src/features/support-chat/_domain/error-mapping.ts:5-36`)
- Controller wrapper:
  - `runWithErrorMapping()` handles known domain errors and falls back to `INTERNAL_SERVER_ERROR` (`src/features/support-chat/_controller.ts:118-131`)
- Attachment route HTTP errors:
  - `401` unauthorized, `404` for no access/not found/storage miss (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:91-112`).

## Security surface (as-is, facts only)
- authn:
  - Session retrieval via `getServerSession` in tRPC context and API routes (`src/kernel/lib/trpc/_context-factory.ts:8-14`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:89`, `src/app/api/support-chat/events/route.ts:167`).
- authz:
  - tRPC requires `authorizedProcedure` (`src/kernel/lib/trpc/_procedure.ts:11-20`).
  - Staff permission check `canManageSupportChats` in service and routes (`src/features/support-chat/_services/support-chat-service.ts:489-511`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:15-34`, `src/app/api/support-chat/events/route.ts:130-152`).
- IDOR boundaries:
  - Dialog ownership check for `USER` in service and attachment route (`src/features/support-chat/_services/support-chat-service.ts:469-475`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:50-54`).
- file upload/download flows:
  - Upload validation allowlist (`src/features/support-chat/_domain/attachment-schema.ts:5-14`, `src/features/support-chat/_services/support-chat-service.ts:546-557`).
  - Download headers include `Content-Type`, `Content-Disposition`, `Cache-Control: private`, `X-Content-Type-Options` (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:121-127`).
  - SSE route contains rate limiting, connection caps, timeout/cleanup handling (`src/app/api/support-chat/events/route.ts:17-21`, `src/app/api/support-chat/events/route.ts:101-128`, `src/app/api/support-chat/events/route.ts:194-207`, `src/app/api/support-chat/events/route.ts:217-315`).

## Dependencies (as-is)
- Internal modules:
  - DI and module bindings in `src/app/server.ts:32-65`.
  - support-chat feature/entity modules (`src/features/support-chat/module.ts:8-15`, `src/entities/support-chat/module.ts:7-13`).
  - tRPC core (`src/kernel/lib/trpc/_procedure.ts:7-75`, `src/app/api/trpc/[trpc]/route.ts:10-20`).
- External services/packages:
  - NextAuth (`next-auth`) for sessions (`src/kernel/lib/next-auth/_session-service.ts:1-10`).
  - Prisma (`@prisma/client`) for DB operations (repositories and services).
  - AWS SDK S3 (`@aws-sdk/client-s3`, `@aws-sdk/lib-storage`) via `MinioStorage` (`src/shared/lib/file-storage/_providers/minio.ts:2-4`).
  - Supabase storage client (`@supabase/supabase-js`) via `SupabaseStorage` (`src/shared/lib/file-storage/_providers/supabase.ts:2-3`).
  - Telegram Bot API via `fetch` (`src/features/support-chat/_integrations/telegram-support-notifier.ts:28-40`).

## Open questions
- Production storage strategy has two as-is sources in repository docs/code:
  - `AGENTS.md` states "Storage: MinIO in dev, S3 in prod" (`AGENTS.md:11`),
  - `createFileStorage()` currently selects `MinioStorage` for `NODE_ENV=development`, otherwise `SupabaseStorage` (`src/shared/lib/file-storage/_model/create-storage.ts:6-10`).
  The code does not contain an explicit environment mapping note that reconciles these two statements.

## Files inspected
- `docs/ai/commands/research-codebase.md`
- `docs/ai/features/preview-img-support-chat/00-brief.md`
- `AGENTS.md`
- `docs/caching-strategy.md`
- `src/app/server.ts`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/api/support-chat/events/route.ts`
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/app/platform/(profile)/support-chat/page.tsx`
- `src/app/(admin)/admin/support-chat/page.tsx`
- `src/kernel/lib/next-auth/module.ts`
- `src/kernel/lib/next-auth/_session-service.ts`
- `src/kernel/lib/next-auth/_next-auth-config.ts`
- `src/kernel/lib/trpc/module.ts`
- `src/kernel/lib/trpc/_controller.ts`
- `src/kernel/lib/trpc/_context-factory.ts`
- `src/kernel/lib/trpc/_procedure.ts`
- `src/kernel/lib/trpc/client.ts`
- `src/features/support-chat/index.ts`
- `src/features/support-chat/module.ts`
- `src/features/support-chat/_api.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_domain/errors.ts`
- `src/features/support-chat/_domain/error-mapping.ts`
- `src/features/support-chat/_domain/attachment-schema.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_services/support-chat-read-service.ts`
- `src/features/support-chat/_integrations/support-chat-events.ts`
- `src/features/support-chat/_integrations/telegram-support-notifier.ts`
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/_ui/support-chat-message-attachments.tsx`
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
- `src/entities/support-chat/module.ts`
- `src/entities/support-chat/_repositories/support-conversation-repository.ts`
- `src/entities/support-chat/_repositories/support-message-repository.ts`
- `src/entities/support-chat/_repositories/support-read-state-repository.ts`
- `src/shared/config/private.ts`
- `src/shared/config/public.ts`
- `src/shared/lib/cache/cache-constants.ts`
- `src/shared/lib/file-storage/types.ts`
- `src/shared/lib/file-storage/_model/create-storage.ts`
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/lib/file-storage/_providers/supabase.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20260224133000_add_support_chat/migration.sql`
- `prisma/migrations` (directory listing)
