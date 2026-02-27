---
date: 2026-02-27
researcher: Codex
branch: feat/react-compiler
commit: 64a3fe3
feature: chat-avatar
research_question: "Как устроен support-chat сейчас и какие данные avatar/fullName уже доступны в текущем UI/tRPC/БД для списка диалогов и шапки чата без изменения контрактов?"
---

# Research: chat-avatar

## Summary
Support-chat подключается через Inversify container в `createServer()`: загружаются `SupportChatEntityModule` (репозитории чата) и `SupportChatModule` (tRPC controller + сервисы) (`src/app/server.ts:32-62`, `src/entities/support-chat/module.ts:8-15`, `src/features/support-chat/module.ts:8-15`). tRPC endpoint собирает все контроллеры из контейнера и мерджит их в единый router (`src/app/api/trpc/[trpc]/route.ts:10-17`).

Пользовательский и админский UI используют `SupportChatConversationCard` как общий компонент ленты/формы сообщений (`src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:169-205`, `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:463-506`). В текущем виде card принимает только текстовый `title` и back button; отдельного API для avatar/fullName в header у card нет (`src/features/support-chat/_ui/support-chat-conversation-card.tsx:71-102`, `src/features/support-chat/_ui/support-chat-conversation-card.tsx:238-241`).

Серверный слой support-chat уже возвращает имя пользователя для staff inbox (`staffListDialogs -> user: { id, name }`), но не возвращает аватар (`src/features/support-chat/_services/support-chat-service.ts:236-243`, `src/features/support-chat/_services/support-chat-service.ts:288-293`). Для user dialogs возвращаются только `dialogId/title/preview/unread/isUnanswered/updatedAt`, без user profile объекта (`src/features/support-chat/_services/support-chat-service.ts:161-168`).

## Entry points (as-is)
- Next.js routes/pages:
- `src/app/platform/(profile)/support-chat/page.tsx:8-24` — включает user support-chat страницу после проверки feature flag и user session/role.
- `src/app/platform/(profile)/support-chat/layout.tsx:12-33` — layout для user support-chat с теми же проверками роли/сессии.
- `src/app/(admin)/admin/support-chat/page.tsx:3-4` — рендерит `SupportChatAdminInboxPage`.
- `src/app/api/trpc/[trpc]/route.ts:10-20` — tRPC fetch handler для всех controller routers.
- `src/app/api/support-chat/events/route.ts:167-328` — SSE поток событий чата с auth/rate-limit/connection-limit.
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:69-151` — скачивание вложений с проверкой доступа к dialog.
- tRPC procedures/routers:
- `src/features/support-chat/_controller.ts:27-157` — router `supportChat.*` (`userListDialogs`, `userGetMessages`, `staffListDialogs`, `sendMessage`, `markDialogRead`, `getUnansweredDialogsCount`, `editMessage`, `deleteMessage`, `createDialog`).
- UI components:
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:29-208` — user chat screen.
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:54-595` — admin/staff inbox + conversation.
- `src/features/support-chat/_ui/support-chat-conversation-card.tsx:104-665` — общий UI ленты и ввода сообщений.
- `src/entities/user/_ui/profile-avatar.tsx:6-29` — reusable avatar component, работает от `profile.image/name`.

## Detailed findings
### 1) DI container, module wiring, layering facts
- Location: `src/app/server.ts:32-67`, `src/features/support-chat/module.ts:8-20`, `src/entities/support-chat/module.ts:8-20`, `src/kernel/lib/trpc/module.ts:18-23`, `src/kernel/lib/next-auth/module.ts:7-14`.
- What it does: `createServer()` создает Inversify container и загружает модули, включая `SupportChatEntityModule` и `SupportChatModule`; `SupportChatModule` регистрирует `SupportChatController`, `SupportChatService`, `SupportChatReadService`, `TelegramSupportNotifier`; entity module регистрирует 4 chat repository класса.
- Dependencies: `Controller` token из tRPC модуля, `SessionService`/`NextAuthConfig` из next-auth модуля.
- Data flow: Next.js request -> `server.getAll(Controller)` -> merged tRPC router (`src/app/api/trpc/[trpc]/route.ts:10-17`) -> support-chat controller/service/repository.

### 2) UI composition and current profile data availability
- Location: `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:345-406`, `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:466-470`, `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:169-205`, `src/features/support-chat/_ui/support-chat-conversation-card.tsx:71-102`, `src/features/support-chat/_ui/support-chat-conversation-card.tsx:238-241`, `src/entities/user/_ui/profile-avatar.tsx:6-27`, `src/shared/ui/avatar.tsx:25-37`.
- What it does:
- В admin dialogs list отображается имя пользователя как `dialog.user.name ?? dialog.user.id`.
- В admin chat header передается строка `Диалог: ${selectedDialog.user.name ?? selectedDialog.user.id}` через проп `title`.
- В user page header передается только back button, без `title` и без profile data.
- `SupportChatConversationCard` отображает `title` как plain text; avatar slot/props отсутствуют.
- `ProfileAvatar` уже существует и рендерит `AvatarImage`/`AvatarFallback` из профиля.
- Dependencies: hooks `useStaffDialogs`, `useDialogMessages`, `useSupportChatActions`; `ProfileAvatar` зависит от `Profile` type и `getProfileLetters`.
- Data flow: UI page -> chat hooks (`src/features/support-chat/_vm/use-support-chat.ts`) -> tRPC query result -> mapping to list/header text in page components.

### 3) tRPC contracts and support-chat service outputs
- Location: `src/features/support-chat/_domain/schemas.ts:4-75`, `src/features/support-chat/_controller.ts:27-157`, `src/features/support-chat/_services/support-chat-service.ts:108-176`, `src/features/support-chat/_services/support-chat-service.ts:232-317`, `src/features/support-chat/_services/support-chat-service.ts:178-230`.
- What it does:
- Input validation выполняется zod-схемами (`pagination`, `sendMessage`, `createDialog` и др.).
- `userListDialogs` возвращает элементы без вложенного user profile (`dialogId`, `title`, `lastMessagePreview`, `unreadCount`, `isUnanswered`, `updatedAt`).
- `staffListDialogs` делает include `user: { id, name }`; в response у каждого dialog есть `user.id/user.name`, unread flags, preview, timestamps.
- `userGetMessages` возвращает сообщения с `senderType`, `text`, `attachments`, `canEdit`, `canDelete`, `readAt`.
- Dependencies: Prisma client (`dbClient`), `SupportChatReadService`, chat repositories, domain error mapping.
- Data flow: tRPC procedure (`authorizedProcedure`) -> actor from `ctx.session.user` -> `SupportChatService` methods -> Prisma/repositories -> mapped DTO -> tRPC response.

### 4) Auth/session, authorization, storage and integrations
- Location:
- Session + context: `src/kernel/lib/next-auth/_session-service.ts:6-10`, `src/kernel/lib/trpc/_context-factory.ts:8-13`, `src/kernel/lib/trpc/_procedure.ts:11-20`.
- Support-chat page guards: `src/app/platform/(profile)/support-chat/page.tsx:13-22`, `src/app/platform/(profile)/support-chat/layout.tsx:16-25`, `src/app/(admin)/admin/layout.tsx:19-31`.
- Staff support-chat permissions: `src/features/support-chat/_services/support-chat-service.ts:762-785`, `src/app/api/support-chat/events/route.ts:131-153`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:23-42`.
- Ability API used by admin UI: `src/features/admin-panel/users/_hooks/use-admin-ability.ts:5-8`, `src/features/admin-panel/users/_controller.ts:132-135`, `src/features/admin-panel/users/_domain/ability.ts:27-29`.
- Storage provider selection: `src/shared/lib/file-storage/_model/create-storage.ts:6-10`; MinIO provider (`_providers/minio.ts:17-25`); Supabase provider (`_providers/supabase.ts:12-15`).
- What it does:
- tRPC auth проверяется middleware `authorizedProcedure` (требует `ctx.session`).
- User route допускает только role `USER`; admin layout допускает `ADMIN|STAFF`; finer ACL `canManageSupportChats` проверяется в сервисе и API routes.
- Вложения support-chat загружаются через `fileStorage.uploadFile(..., 'private')` и записываются в `ChatAttachment`.
- Для dev storage создается `MinioStorage`; для non-development создается `SupabaseStorage`.
- Dependencies: NextAuth callbacks/session token mapping (`src/kernel/lib/next-auth/_next-auth-config.ts:60-90`), private/public env config (`src/shared/config/private.ts:19-26`, `src/shared/config/public.ts:3-24`).
- Data flow: session -> role/ACL checks -> service/API route -> storage adapter + DB attachment records -> response/stream.

## Data flow map (as-is)
User/Admin page (`support-chat/*page.tsx`) -> React hooks (`use-support-chat`) -> tRPC client (`supportChatApi`) -> `/api/trpc` handler -> merged router -> `SupportChatController` procedure (`authorizedProcedure` + zod input) -> `SupportChatService` / `SupportChatReadService` -> repositories (`ChatDialogRepository`, `ChatMessageRepository`, `ChatReadStateRepository`, `ChatAttachmentRepository`) and/or direct Prisma queries -> Prisma/Postgres (`ChatDialog`, `ChatMessage`, `SupportReadState`, `ChatAttachment`) -> mapped response DTO -> React Query cache update + UI render.

Attachment read flow (separate): message attachment link -> `/api/support-chat/attachments/[dialogId]/[attachmentId]` -> NextAuth session + dialog access check -> `ChatAttachmentRepository.findByDialogAndId` -> `fileStorage.downloadStreamByPath` -> streamed response.

SSE flow (separate): UI `EventSource('/api/support-chat/events')` -> authenticated SSE route -> `subscribeToSupportChatEvents` -> service publishes events (`publishSupportChatEvent`) -> client invalidates related tRPC queries.

## Data & schema (as-is)
- Prisma models involved:
- `ChatDialog` with FK `userId -> User`, indexes `[userId, updatedAt]`, `[lastMessageAt]` (`prisma/schema.prisma:541-554`).
- `ChatMessage` with FK `dialogId -> ChatDialog`, optional sender FKs to `User`, attachments JSON, indexes `[dialogId, createdAt]`, `[senderType, createdAt]` (`prisma/schema.prisma:556-575`).
- `ChatAttachment` with FKs to dialog/message/user, status enum, cache fields `etag/lastModified`, indexes `[dialogId,id]`, `[messageId]`, `[status,createdAt]` (`prisma/schema.prisma:577-598`).
- `SupportReadState` with unique `[dialogId, readerType, readerUserId]` and index `[dialogId, readerType]` (`prisma/schema.prisma:600-614`).
- `User` contains `name`, `image`, and chat relations (`chatDialogs`, `chatUserMessages`, `chatStaffMessages`, `chatReadStates`, `chatAttachments`) (`prisma/schema.prisma:496-524`).
- `StaffPermission` includes `canManageSupportChats` (`prisma/schema.prisma:526-539`).
- Constraints/indexes (chat-specific): перечислены выше в schema и также создаются миграциями (`prisma/migrations/20260224133000_add_support_chat/migration.sql:50-90`, `prisma/migrations/20260225193000_add_support_attachment/migration.sql:23-42`).
- Migrations involved (chat):
- `20260224133000_add_support_chat` — создаёт support-chat таблицы и enum sender/read (`.../migration.sql:1-90`).
- `20260225181847_rename_support_chat` — переименовывает constraints/indexes `Support* -> Chat*` (`.../migration.sql:1-201`).
- `20260225193000_add_support_attachment` — добавляет `ChatAttachment` (`.../migration.sql:1-42`).
- `20260225201500_rename_support_chat_to_chat` — rename enum/table names (`.../migration.sql:1-48`).
- `20260226154500_chat_message_edit_delete` — добавляет `editedAt/deletedAt/deletedBy` в `ChatMessage` (`.../migration.sql:1-5`).

## Caching & invalidation (as-is)
- Shared policy doc указывает use React Query + частые/редкие/статические категории и инвалидации (`docs/caching-strategy.md:5-23`).
- Runtime constants для кеша определены в `CACHE_SETTINGS` (`src/shared/lib/cache/cache-constants.ts:10-37`), и support-chat hooks используют `CACHE_SETTINGS.FREQUENT_UPDATE` для dialog/message/unanswered queries (`src/features/support-chat/_vm/use-support-chat.ts:20-29`, `src/features/support-chat/_vm/use-support-chat.ts:45-55`, `src/features/support-chat/_vm/use-support-chat.ts:142-151`, `src/features/support-chat/_vm/use-support-chat.ts:174-176`).
- Invalidation в mutations:
- `createDialog` invalidates `userListDialogs`, `getUnansweredDialogsCount` (`src/features/support-chat/_vm/use-support-chat.ts:182-187`).
- `sendMessage`, `markDialogRead`, `editMessage`, `deleteMessage` invalidates user/staff dialogs, unanswered count, and `userGetMessages({dialogId})` (`src/features/support-chat/_vm/use-support-chat.ts:189-230`).
- SSE invalidation:
- client EventSource подписан на `dialog.created`, `message.created`, `message.updated`, `read.updated` (`src/features/support-chat/_vm/use-support-chat.ts:122-125`), и по событиям invalidates dialogs/messages (`src/features/support-chat/_vm/use-support-chat.ts:82-120`).

## Error handling (as-is)
- Domain errors задаются `SupportChatDomainError` и `SupportChatErrorCode` (`src/features/support-chat/_domain/errors.ts:1-28`).
- Mapping domain -> TRPCError выполняется в `mapSupportChatDomainErrorToTrpc` (`src/features/support-chat/_domain/error-mapping.ts:5-44`).
- Controller оборачивает все support-chat handlers через `runWithErrorMapping`, где:
- rethrow `TRPCError`,
- map domain error,
- fallback `INTERNAL_SERVER_ERROR` (`src/features/support-chat/_controller.ts:159-172`).
- Client toast-месседжи формируются через `resolveSupportChatClientErrorMessage` (`src/features/support-chat/_domain/client-error-message.ts:11-29`) и используются в user/admin pages (`src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:24-27`, `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:46-52`).

## Security surface (as-is, facts only)
- authn: session читается через `SessionService.get()` (`src/kernel/lib/next-auth/_session-service.ts:8-10`) и/или `getServerSession(server.get(NextAuthConfig).options)` в API routes (`src/app/api/support-chat/events/route.ts:168`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:73`).
- authz: 
- tRPC level: `authorizedProcedure` требует session (`src/kernel/lib/trpc/_procedure.ts:11-20`).
- Service level: `assertDialogAccess`, `ensureStaffAccess`, `ensureUserRole` (`src/features/support-chat/_services/support-chat-service.ts:735-793`, `src/features/support-chat/_services/support-chat-service.ts:762-785`).
- Route level: support-chat page/layout redirects by role (`src/app/platform/(profile)/support-chat/page.tsx:20-22`, `src/app/platform/(profile)/support-chat/layout.tsx:23-25`), admin layout checks `ADMIN|STAFF` (`src/app/(admin)/admin/layout.tsx:26-31`).
- Admin ability API returns `canManageSupportChats` flag (`src/features/admin-panel/users/_controller.ts:132-135`, `src/features/admin-panel/users/_domain/ability.ts:28`).
- IDOR boundaries:
- Dialog ownership/staff access checks in `assertDialogAccess` (`src/features/support-chat/_services/support-chat-service.ts:742-759`).
- Attachment download checks dialog membership via `hasDialogAccess` and returns 404 when denied/missing (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:44-63`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:94-104`).
- file upload/download flows:
- Upload: `SupportChatService.uploadAttachments` validates mime/size, uploads to storage, creates `ChatAttachment`, then links to message (`src/features/support-chat/_services/support-chat-service.ts:938-1020`).
- Download: attachments route reads DB metadata + storage stream and returns with cache/security headers (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:106-149`).
- Rate limits / connection controls:
- SSE has per-user+ip rate-limit and max-connections (`src/app/api/support-chat/events/route.ts:17-21`, `src/app/api/support-chat/events/route.ts:185-208`).
- Attachment route has process-local per-user limiter (`src/features/support-chat/_domain/attachment-rate-limit.ts:1-57`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:82-90`).

## Dependencies (as-is)
- Internal modules:
- Support-chat feature: controller/service/hooks/UI/domain/integrations (`src/features/support-chat/**`).
- Support-chat entity repositories (`src/entities/support-chat/**`).
- Auth/tRPC kernel libs (`src/kernel/lib/next-auth/**`, `src/kernel/lib/trpc/**`).
- Config and storage abstractions (`src/shared/config/**`, `src/shared/lib/file-storage/**`).
- External services/packages:
- NextAuth (`next-auth`) for session and auth providers (`src/kernel/lib/next-auth/_next-auth-config.ts:1-8`, `src/kernel/lib/next-auth/_session-service.ts:1-10`).
- Prisma/Postgres (`@prisma/client`, schema/migrations).
- tRPC (`@trpc/server`, `@trpc/react-query`, `@trpc/client`) (`src/kernel/lib/trpc/_procedure.ts:2-5`, `src/kernel/lib/trpc/client.ts:1-4`).
- Storage providers:
- MinIO/S3-compatible via AWS SDK (`src/shared/lib/file-storage/_providers/minio.ts:3-7`, `src/shared/lib/file-storage/_providers/minio.ts:17-25`).
- Supabase Storage (`src/shared/lib/file-storage/_providers/supabase.ts:2-15`).
- Telegram Bot HTTP API for notifications (`src/features/support-chat/_integrations/telegram-support-notifier.ts:28-40`).

## Open questions
- Для user-side шапки чата в текущем support-chat UX кто должен считаться “собеседником” для avatar/fullName (сам пользователь, поддержка, конкретный staff) — это не определяется текущими DTO и текущим UI, где header у user page без title/profile (`src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:169-205`, `src/features/support-chat/_services/support-chat-service.ts:161-168`).
- Ответ: у пользователя отображается аватар и имя сотрудника, который ему ответил справа от кнопки "назад"
- В `docs/caching-strategy.md` указаны пути `src/lib/cache/*`, а фактические runtime файлы находятся в `src/shared/lib/cache/*` (`docs/caching-strategy.md:15`, `docs/caching-strategy.md:27`, `src/shared/lib/cache/cache-constants.ts:1-37`, `src/shared/lib/cache/cache-invalidation.ts:1-38`). Документ не уточняет причину расхождения пути.
- Ответ: пути исправил.

## Files inspected
- `AGENTS.md`
- `docs/ai/commands/research-codebase.md`
- `docs/ai/features/chat-avatar/00-brief.md`
- `docs/caching-strategy.md`
- `prisma/schema.prisma`
- `prisma/migrations/migration_lock.toml`
- `prisma/migrations/20260224133000_add_support_chat/migration.sql`
- `prisma/migrations/20260225181847_rename_support_chat/migration.sql`
- `prisma/migrations/20260225193000_add_support_attachment/migration.sql`
- `prisma/migrations/20260225201500_rename_support_chat_to_chat/migration.sql`
- `prisma/migrations/20260226154500_chat_message_edit_delete/migration.sql`
- `src/app/server.ts`
- `src/app/_providers/app-provider.tsx`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/api/support-chat/events/route.ts`
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(admin)/admin/support-chat/page.tsx`
- `src/app/platform/(profile)/support-chat/layout.tsx`
- `src/app/platform/(profile)/support-chat/page.tsx`
- `src/features/support-chat/index.ts`
- `src/features/support-chat/module.ts`
- `src/features/support-chat/_api.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_services/support-chat-read-service.ts`
- `src/features/support-chat/_integrations/support-chat-events.ts`
- `src/features/support-chat/_integrations/telegram-support-notifier.ts`
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_domain/errors.ts`
- `src/features/support-chat/_domain/error-mapping.ts`
- `src/features/support-chat/_domain/client-error-message.ts`
- `src/features/support-chat/_domain/attachment-schema.ts`
- `src/features/support-chat/_domain/attachment-http-cache.ts`
- `src/features/support-chat/_domain/attachment-rate-limit.ts`
- `src/features/support-chat/_ui/support-chat-conversation-card.tsx`
- `src/features/support-chat/_ui/support-chat-profile-link.tsx`
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
- `src/entities/support-chat/module.ts`
- `src/entities/support-chat/_domain/types.ts`
- `src/entities/support-chat/_repositories/chat-dialog-repository.ts`
- `src/entities/support-chat/_repositories/chat-message-repository.ts`
- `src/entities/support-chat/_repositories/chat-read-state-repository.ts`
- `src/entities/support-chat/_repositories/chat-attachment-repository.ts`
- `src/entities/user/_ui/profile-avatar.tsx`
- `src/features/admin-panel/users/_hooks/use-admin-ability.ts`
- `src/features/admin-panel/users/_controller.ts`
- `src/features/admin-panel/users/_domain/ability.ts`
- `src/features/admin-panel/users/_domain/staff-permission.ts`
- `src/features/admin-panel/users/_repositories/staff-permissions.ts`
- `src/features/admin-panel/users/_services/staff-permissions.ts`
- `src/kernel/domain/user.ts`
- `src/kernel/lib/next-auth/module.ts`
- `src/kernel/lib/next-auth/_session-service.ts`
- `src/kernel/lib/next-auth/_next-auth-config.ts`
- `src/kernel/lib/next-auth/client.tsx`
- `src/kernel/lib/trpc/module.ts`
- `src/kernel/lib/trpc/_controller.ts`
- `src/kernel/lib/trpc/_context-factory.ts`
- `src/kernel/lib/trpc/_procedure.ts`
- `src/kernel/lib/trpc/client.ts`
- `src/shared/api/query-client.ts`
- `src/shared/api/server-helpers.ts`
- `src/shared/config/private.ts`
- `src/shared/config/public.ts`
- `src/shared/config/kinescope.ts`
- `src/shared/lib/cache/cache-constants.ts`
- `src/shared/lib/cache/cache-invalidation.ts`
- `src/shared/lib/file-storage/file-storage.ts`
- `src/shared/lib/file-storage/_model/create-storage.ts`
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/lib/file-storage/_providers/supabase.ts`
- `src/shared/lib/file-storage/types.ts`
- `src/shared/lib/file-storage/utils.ts`
- `src/shared/ui/avatar.tsx`
