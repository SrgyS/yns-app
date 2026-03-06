---
date: 2026-03-06
researcher: Codex
branch: feat/react-compiler
commit: 90d25da
feature: fix-upload-attach
research_question: "Как сейчас устроен flow вложений support-chat (выбор файла, валидация, optimistic state, отправка, хранение, рендер, download), и где именно возникают base64/data URL и ограничения по размеру/типам для сценария падения при больших видео?"
---

# Research: fix-upload-attach

## Summary
Текущий клиентский flow вложений в `support-chat` конвертирует каждый выбранный `File` в base64 Data URL через `FileReader.readAsDataURL`, а затем отправляет base64 в tRPC input (`base64` поле в attachment DTO). Это происходит в `toSupportChatAttachments`, который вызывается на submit и в user, и в admin UI (`src/features/support-chat/_ui/support-chat-attachments-upload.ts:21-59`, `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:103-118`, `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:188-196`).

Optimistic сообщение при `sendMessage.onMutate` содержит attachment `path: attachment.base64`; это же поле затем используется рендером вложений как `src`, потому что `buildAttachmentUrl` возвращает `attachmentPath` без проксирования, если строка начинается с `data:`. Для видео-прикреплений рендерится `<video><source src={attachmentUrl} .../></video>`, поэтому pending message может отображать inline `data:` video source (`src/features/support-chat/_vm/use-support-chat.ts:400-407`, `src/features/support-chat/_ui/support-chat-message-attachments.tsx:24-34`, `src/features/support-chat/_ui/support-chat-message-attachments.tsx:200-218`).

На сервере attachments валидируются Zod-схемой и доменной проверкой MIME; размер ограничен `25 * 1024 * 1024` через schema `.max(MAX_ATTACHMENT_SIZE_BYTES)`. Далее `SupportChatService.uploadAttachments` декодирует base64, сверяет размер с `sizeBytes`, создает `File`, загружает в storage provider и сохраняет metadata в `ChatAttachment`, а в `ChatMessage.attachments` пишет JSON-массив с `id/name/path/type/sizeBytes` (`src/features/support-chat/_domain/attachment-schema.ts:3-23`, `src/features/support-chat/_services/support-chat-service.ts:1124-1182`, `prisma/schema.prisma:556-600`).

## Entry points (as-is)
- Next.js routes/pages:
- `src/app/platform/(profile)/support-chat/page.tsx:8-25` проверяет feature flag, session и role, затем рендерит `SupportChatUserPage`.
- `src/app/(admin)/admin/support-chat/page.tsx:1-5` рендерит `SupportChatAdminInboxPage`.
- `src/app/api/trpc/[trpc]/route.ts:10-20` собирает все DI-контроллеры в merged tRPC router.
- `src/app/api/support-chat/events/route.ts:90-249` SSE endpoint для chat events.
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:69-151` attachment download endpoint с проверкой доступа.
- tRPC procedures/routers:
- `src/features/support-chat/_controller.ts:30-179` router `supportChat` с процедурами `userListDialogs`, `userGetMessages`, `staffListDialogs`, `staffOpenDialogForUser`, `sendMessage`, `markDialogRead`, `getUnansweredDialogsCount`, `editMessage`, `deleteMessage`, `createDialog`.
- UI components:
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:33-292` user chat page.
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:60-755` admin inbox + conversation.
- `src/features/support-chat/_ui/support-chat-conversation-card.tsx:127-1094` общий чат-компонент и composer.
- `src/features/support-chat/_ui/support-chat-message-attachments.tsx:260-324` message attachment renderer.

## Detailed findings
### 1) Client attachment preparation and optimistic state
- Location: `src/features/support-chat/_ui/support-chat-attachments-upload.ts:1-62`, `src/features/support-chat/_ui/support-chat-conversation-card.tsx:238-333`, `src/features/support-chat/_vm/use-support-chat.ts:373-557`.
- What it does: тип input attachment на клиенте включает `base64` (`src/features/support-chat/_ui/support-chat-attachments-upload.ts:1-6`). При submit `toSupportChatAttachments` формирует массив `{ filename, mimeType, sizeBytes, base64 }`, где `base64` получается через `FileReader.readAsDataURL` (`src/features/support-chat/_ui/support-chat-attachments-upload.ts:28-35`, `src/features/support-chat/_ui/support-chat-attachments-upload.ts:40-59`).
- Dependencies: `FileReader`, `supportChatApi.supportChat.sendMessage` mutation hook, React Query cache utils (`src/features/support-chat/_ui/support-chat-attachments-upload.ts:40-59`, `src/features/support-chat/_vm/use-support-chat.ts:351-373`).
- Data flow: `Input[type=file]` -> `mergeSelectedFiles` dedupe+count limit (`MAX_ATTACHMENTS_PER_MESSAGE=5`) -> `toSupportChatAttachments(files)` -> mutation variables with `attachments[].base64` -> `onMutate` writes optimistic message with `attachments[].path = attachment.base64` and `pendingAttachments = variables.attachments` (`src/features/support-chat/_ui/support-chat-conversation-card.tsx:652-660`, `src/features/support-chat/_ui/support-chat-conversation-card.tsx:306-333`, `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:103-113`, `src/features/support-chat/_vm/use-support-chat.ts:400-418`).

### 2) Server-side validation, upload, and persistence
- Location: `src/features/support-chat/_domain/schemas.ts:26-55`, `src/features/support-chat/_domain/attachment-schema.ts:3-54`, `src/features/support-chat/_services/support-chat-service.ts:361-451`, `src/features/support-chat/_services/support-chat-service.ts:1124-1222`, `src/entities/support-chat/_repositories/chat-attachment-repository.ts:31-190`, `src/entities/support-chat/_repositories/chat-message-repository.ts:30-144`.
- What it does: `sendMessageInputSchema` принимает attachments как массив `supportChatAttachmentSchema` (включая `base64`) с лимитом количества (`src/features/support-chat/_domain/schemas.ts:26-40`, `src/features/support-chat/_domain/attachment-schema.ts:18-23`). Максимальный размер каждого вложения задан в schema `.max(MAX_ATTACHMENT_SIZE_BYTES)` (25MB) (`src/features/support-chat/_domain/attachment-schema.ts:3-4`, `src/features/support-chat/_domain/attachment-schema.ts:21`).
- Dependencies: `assertAttachmentMimeType`, `fileStorage.uploadFile`, `sanitizeFileName`, `ChatAttachmentRepository`, `ChatMessageRepository`, Prisma JSON field `ChatMessage.attachments` (`src/features/support-chat/_services/support-chat-service.ts:18-23`, `src/features/support-chat/_services/support-chat-service.ts:1133-1170`, `prisma/schema.prisma:567-569`, `prisma/schema.prisma:579-600`).
- Data flow: tRPC `sendMessage` -> `assertDialogAccess` and text/attachment checks -> `uploadAttachments` loop: MIME check, `decodeAttachment(base64)`, byte-size equality check, `new File([...])`, storage upload, `chatAttachment.createUploaded` -> message create with `attachments: uploadedAttachments as Prisma.InputJsonValue` -> `linkUploadedAttachmentsToMessage` updates attachment status to `LINKED` (`src/features/support-chat/_services/support-chat-service.ts:361-407`, `src/features/support-chat/_services/support-chat-service.ts:1124-1182`, `src/features/support-chat/_services/support-chat-service.ts:1184-1206`, `src/entities/support-chat/_repositories/chat-attachment-repository.ts:52-81`).

### 3) Attachment rendering and retrieval
- Location: `src/features/support-chat/_ui/support-chat-message-attachments.tsx:24-257`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:69-151`, `src/features/support-chat/_domain/attachment-http-cache.ts:53-92`, `src/shared/lib/file-storage/_providers/minio.ts:83-144`.
- What it does: attachment renderer читает `message.attachments` через `parseStoredSupportChatAttachments`. Если `attachment.path` начинается с `data:`, URL возвращается напрямую; иначе используется API route `/api/support-chat/attachments/{dialogId}/{attachmentId}` (`src/features/support-chat/_ui/support-chat-message-attachments.tsx:24-34`, `src/features/support-chat/_ui/support-chat-message-attachments.tsx:265-281`). Для `video/*` всегда рендерится inline `<video preload="metadata">` с `<source src={attachmentUrl}>` (`src/features/support-chat/_ui/support-chat-message-attachments.tsx:40-42`, `src/features/support-chat/_ui/support-chat-message-attachments.tsx:200-219`).
- Dependencies: `ChatAttachmentRepository.findByDialogAndId`, `fileStorage.downloadStreamByPath`, conditional 304 by `isAttachmentNotModified`, per-user rate limit for download requests (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:99-127`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:110-121`, `src/features/support-chat/_domain/attachment-rate-limit.ts:30-52`).
- Data flow: UI asks attachment URL -> Next API route authorizes session and dialog access -> repository fetches attachment metadata -> storage returns stream -> response includes `Content-Type`, `Content-Length`, cache headers (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:73-97`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:131-150`).

### 4) Platform wiring: DI, auth/session, tRPC, caching, storage, schema
- Location: `src/app/server.ts:32-67`, `src/features/support-chat/module.ts:8-15`, `src/entities/support-chat/module.ts:8-15`, `src/kernel/lib/trpc/_procedure.ts:7-21`, `src/kernel/lib/trpc/_context-factory.ts:9-25`, `src/kernel/lib/next-auth/_session-service.ts:6-10`, `src/shared/lib/cache/cache-constants.ts:10-37`, `src/shared/lib/file-storage/_model/create-storage.ts:4-10`, `prisma/schema.prisma:541-616`.
- What it does: DI container загружает entity и feature modules (`SupportChatEntityModule`, `SupportChatModule`) в `createServer()`. `authorizedProcedure` требует `ctx.session`; контекст создается через `SessionService.get()` и пробрасывает request headers meta. Клиентская часть использует React Query и tRPC provider в `AppProvider`. Support chat hooks используют `CACHE_SETTINGS.FREQUENT_UPDATE` для dialog/message queries и выполняют invalidation на success/SSE (`src/app/_providers/app-provider.tsx:15-33`, `src/features/support-chat/_vm/use-support-chat.ts:101-111`, `src/features/support-chat/_vm/use-support-chat.ts:127-137`, `src/features/support-chat/_vm/use-support-chat.ts:512-517`).
- Dependencies: NextAuth config/session callbacks, Inversify Controller pattern, Prisma chat models and indexes, storage strategy selector (`development -> MinioStorage`, otherwise `SupabaseStorage`) (`src/kernel/lib/next-auth/_next-auth-config.ts:27-91`, `src/app/api/trpc/[trpc]/route.ts:10-18`, `prisma/schema.prisma:574-616`, `src/shared/lib/file-storage/_model/create-storage.ts:6-10`).
- Data flow: Next route -> page/session gating -> client hook -> tRPC query/mutation -> `SupportChatService` -> repositories/Prisma + storage + event publish -> SSE route subscription invalidates and reconciles message status by `clientMessageId` (`src/app/platform/(profile)/support-chat/page.tsx:13-24`, `src/features/support-chat/_controller.ts:90-106`, `src/features/support-chat/_services/support-chat-service.ts:418-430`, `src/features/support-chat/_vm/use-support-chat.ts:199-261`, `src/app/api/support-chat/events/route.ts:218-224`).

## Data flow map (as-is)
UI file picker and composer (`src/features/support-chat/_ui/support-chat-conversation-card.tsx:652-672`) -> `toSupportChatAttachments` converts to base64 (`src/features/support-chat/_ui/support-chat-attachments-upload.ts:28-59`) -> tRPC client mutation `supportChat.sendMessage` (`src/features/support-chat/_vm/use-support-chat.ts:373-391`) -> optimistic cache writes `attachments.path = base64` (`src/features/support-chat/_vm/use-support-chat.ts:400-407`) -> server router/procedure (`src/features/support-chat/_controller.ts:90-106`) -> service `uploadAttachments/decodeAttachment/uploadFile` (`src/features/support-chat/_services/support-chat-service.ts:1124-1170`, `src/features/support-chat/_services/support-chat-service.ts:1208-1221`) -> repositories + Prisma (`src/entities/support-chat/_repositories/chat-attachment-repository.ts:31-50`, `src/entities/support-chat/_repositories/chat-message-repository.ts:30-47`) -> event publish (`src/features/support-chat/_services/support-chat-service.ts:418-430`) -> SSE client reconcile by `clientMessageId` (`src/features/support-chat/_vm/use-support-chat.ts:210-242`) -> final attachment rendering using API URL or `data:` URL (`src/features/support-chat/_ui/support-chat-message-attachments.tsx:24-34`, `src/features/support-chat/_ui/support-chat-message-attachments.tsx:200-218`).

## Data & schema (as-is)
- Prisma models involved:
- `ChatDialog` (`userId @unique`, indexes `updatedAt`, `lastMessageAt`) (`prisma/schema.prisma:541-554`).
- `ChatMessage` (`clientMessageId` nullable + `@@unique([dialogId, clientMessageId])`, `attachments Json?`, edit/delete fields) (`prisma/schema.prisma:556-577`).
- `ChatAttachment` (`storagePath`, `mimeType`, `sizeBytes`, `originalName`, `status`, `etag`, `lastModified`) with indexes on `(dialogId,id)`, `messageId`, `(status,createdAt)` (`prisma/schema.prisma:579-600`).
- `SupportReadState` unique key `(dialogId, readerType, readerUserId)` (`prisma/schema.prisma:602-616`).
- constraints (unique/FK): FKs declared in schema relations for dialog->user, message->dialog/user, attachment->dialog/message/user, readState->dialog/user (`prisma/schema.prisma:541-616`).
- indexes: listed above and created in migrations for support-chat evolution (`prisma/migrations/20260224133000_add_support_chat/migration.sql:50-67`, `prisma/migrations/20260225193000_add_support_attachment/migration.sql:23-30`, `prisma/migrations/20260304120000_canonicalize_chat_dialog_per_user/migration.sql:101-103`).
- migrations involved (chat attachments/clientMessageId/canonical dialog):
- `20260224133000_add_support_chat` creates base tables and read-state indexes (`prisma/migrations/20260224133000_add_support_chat/migration.sql:12-90`).
- `20260225193000_add_support_attachment` creates `ChatAttachment` and indexes (`prisma/migrations/20260225193000_add_support_attachment/migration.sql:1-42`).
- `20260226154500_chat_message_edit_delete` adds `editedAt/deletedAt/deletedBy` (`prisma/migrations/20260226154500_chat_message_edit_delete/migration.sql:1-5`).
- `20260304120000_canonicalize_chat_dialog_per_user` canonicalizes one dialog per user and enforces unique `ChatDialog.userId` (`prisma/migrations/20260304120000_canonicalize_chat_dialog_per_user/migration.sql:1-103`).
- `20260305123000_chat_message_client_message_id` adds `clientMessageId` and unique index (`prisma/migrations/20260305123000_chat_message_client_message_id/migration.sql:1-12`).

## Caching & invalidation (as-is)
- React Query settings source: `CACHE_SETTINGS.FREQUENT_UPDATE` (`staleTime=1m`, `gcTime=5m`, `refetchOnMount='always'`) (`src/shared/lib/cache/cache-constants.ts:12-18`).
- support-chat queries using it:
- `userListDialogs.useInfiniteQuery` (`src/features/support-chat/_vm/use-support-chat.ts:101-111`).
- `userGetMessages.useInfiniteQuery` (`src/features/support-chat/_vm/use-support-chat.ts:127-137`).
- `staffListDialogs.useInfiniteQuery` (`src/features/support-chat/_vm/use-support-chat.ts:312-323`).
- `getUnansweredDialogsCount.useQuery` (`src/features/support-chat/_vm/use-support-chat.ts:344-348`).
- invalidations:
- on send success invalidates user/staff dialogs, unread count, and current dialog messages (`src/features/support-chat/_vm/use-support-chat.ts:512-517`).
- SSE handlers invalidate dialogs/messages and can reconcile optimistic message state directly by `clientMessageId` (`src/features/support-chat/_vm/use-support-chat.ts:177-197`, `src/features/support-chat/_vm/use-support-chat.ts:199-261`, `src/features/support-chat/_vm/use-support-chat.ts:280-291`).

## Error handling (as-is)
- Domain errors: `SupportChatDomainError` with codes (`INVALID_MESSAGE`, `DIALOG_ACCESS_DENIED`, etc.) (`src/features/support-chat/_domain/errors.ts:1-29`).
- Mapping to TRPCError: `mapSupportChatDomainErrorToTrpc` maps to `NOT_FOUND`/`FORBIDDEN`/`BAD_REQUEST`/`INTERNAL_SERVER_ERROR` (`src/features/support-chat/_domain/error-mapping.ts:5-49`).
- Controller-level wrapping: `runWithErrorMapping` catches unknown errors and throws `INTERNAL_SERVER_ERROR` (`src/features/support-chat/_controller.ts:182-195`).
- Client-side message mapping for toasts: `resolveSupportChatClientErrorMessage` maps by `error.message` code string and uses fallback/default text (`src/features/support-chat/_domain/client-error-message.ts:1-29`).

## Security surface (as-is, facts only)
- authn: tRPC protected by `authorizedProcedure` session check (`src/kernel/lib/trpc/_procedure.ts:11-21`); NextAuth session read in context factory (`src/kernel/lib/trpc/_context-factory.ts:9-16`) and API routes via `getServerSession` (`src/app/api/support-chat/events/route.ts:90-95`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:73-77`).
- authz:
- dialog access for messages/send/read/edit/delete via `assertDialogAccess` + role checks (`src/features/support-chat/_services/support-chat-service.ts:905-930`, `src/features/support-chat/_services/support-chat-service.ts:932-963`).
- staff privilege via `StaffPermission.canManageSupportChats` (`src/features/support-chat/_services/support-chat-service.ts:941-954`, `src/app/api/support-chat/events/route.ts:54-64`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:23-42`).
- mutation origin checks in controller (`assertTrustedMutationRequest`) and SSE request origin check (`isTrustedEventsRequestOrigin`) (`src/features/support-chat/_controller.ts:198-227`, `src/app/api/support-chat/events/route.ts:78-99`).
- IDOR boundaries:
- user role can only access own dialog (`src/features/support-chat/_services/support-chat-service.ts:912-915`).
- attachment API validates dialog access before attachment fetch and returns 404 for disallowed access (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:44-63`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:94-104`).
- file upload/download flows:
- upload path: client base64 -> server decode -> storage upload (`src/features/support-chat/_ui/support-chat-attachments-upload.ts:33`, `src/features/support-chat/_services/support-chat-service.ts:1141-1159`).
- download path: API route -> repository metadata -> `fileStorage.downloadStreamByPath` -> stream response (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:99-150`).

## Dependencies (as-is)
- internal modules:
- DI: `src/app/server.ts`, `src/features/support-chat/module.ts`, `src/entities/support-chat/module.ts`.
- auth: `src/kernel/lib/next-auth/_next-auth-config.ts`, `src/kernel/lib/next-auth/_session-service.ts`.
- tRPC: `src/kernel/lib/trpc/_procedure.ts`, `src/kernel/lib/trpc/_context-factory.ts`, `src/app/api/trpc/[trpc]/route.ts`.
- storage: `src/shared/lib/file-storage/_model/create-storage.ts`, `src/shared/lib/file-storage/_providers/minio.ts`, `src/shared/lib/file-storage/_providers/supabase.ts`.
- external services/packages:
- NextAuth + providers (`next-auth`, Google/GitHub/Credentials) (`src/kernel/lib/next-auth/_next-auth-config.ts:1-8`, `src/kernel/lib/next-auth/_next-auth-config.ts:100-146`).
- tRPC (`@trpc/server`, `@trpc/react-query`) (`src/kernel/lib/trpc/_procedure.ts:2-5`, `src/kernel/lib/trpc/client.ts:1-3`).
- Prisma (`@prisma/client`) in service/repositories and schema (`src/features/support-chat/_services/support-chat-service.ts:1-6`, `prisma/schema.prisma:11-15`).
- Storage SDKs: AWS S3 client for MinIO provider; Supabase client for Supabase provider (`src/shared/lib/file-storage/_providers/minio.ts:2-7`, `src/shared/lib/file-storage/_providers/supabase.ts:2-3`).

## Open questions
- В репозитории отсутствует файл `src/features/support-chat/_domain/client-error-message.spec.ts`, хотя он был указан в IDE context пользователя; в дереве `_domain` есть только `client-error-message.ts` (line unknown for IDE tab context, confirmed by file listing in `src/features/support-chat/_domain`).

## Files inspected
- `docs/ai/commands/research-codebase.md`
- `docs/ai/fix/fix-upload-attach.md`
- `src/app/server.ts`
- `src/app/_providers/app-provider.tsx`
- `src/app/platform/(profile)/support-chat/page.tsx`
- `src/app/(admin)/admin/support-chat/page.tsx`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/support-chat/events/route.ts`
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/features/support-chat/index.ts`
- `src/features/support-chat/module.ts`
- `src/features/support-chat/_api.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/_ui/support-chat-attachments-upload.ts`
- `src/features/support-chat/_ui/support-chat-conversation-card.tsx`
- `src/features/support-chat/_ui/support-chat-message-attachments.tsx`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_services/support-chat-read-service.ts`
- `src/features/support-chat/_integrations/support-chat-events.ts`
- `src/features/support-chat/_integrations/support-chat-sse-security.ts`
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_domain/attachment-schema.ts`
- `src/features/support-chat/_domain/attachment-http-cache.ts`
- `src/features/support-chat/_domain/attachment-rate-limit.ts`
- `src/features/support-chat/_domain/errors.ts`
- `src/features/support-chat/_domain/error-mapping.ts`
- `src/features/support-chat/_domain/client-error-message.ts`
- `src/features/support-chat/_domain/attachment-schema.spec.ts`
- `src/features/support-chat/_services/support-chat-service.spec.ts`
- `src/features/support-chat/_services/support-chat-read-service.spec.ts`
- `src/entities/support-chat/module.ts`
- `src/entities/support-chat/_domain/types.ts`
- `src/entities/support-chat/_repositories/chat-dialog-repository.ts`
- `src/entities/support-chat/_repositories/chat-message-repository.ts`
- `src/entities/support-chat/_repositories/chat-attachment-repository.ts`
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
- `src/kernel/domain/user.ts`
- `src/shared/config/public.ts`
- `src/shared/config/private.ts`
- `src/shared/lib/cache/cache-constants.ts`
- `src/shared/lib/file-storage/file-storage.ts`
- `src/shared/lib/file-storage/types.ts`
- `src/shared/lib/file-storage/utils.ts`
- `src/shared/lib/file-storage/_model/create-storage.ts`
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/lib/file-storage/_providers/supabase.ts`
- `docs/caching-strategy.md`
- `prisma/schema.prisma`
- `prisma/migrations/20260224133000_add_support_chat/migration.sql`
- `prisma/migrations/20260225193000_add_support_attachment/migration.sql`
- `prisma/migrations/20260225201500_rename_support_chat_to_chat/migration.sql`
- `prisma/migrations/20260226154500_chat_message_edit_delete/migration.sql`
- `prisma/migrations/20260304120000_canonicalize_chat_dialog_per_user/migration.sql`
- `prisma/migrations/20260305123000_chat_message_client_message_id/migration.sql`
