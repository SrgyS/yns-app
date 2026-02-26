---
date: 2026-02-26
researcher: Codex
branch: feat/react-compiler
commit: cca0789
feature: chat-enhancements
research_question: "Как реализовать расширение существующего support-chat: unanswered badges, edit/delete непрочитанных сообщений, и новый адаптивный inbox UI без смены базовой архитектуры?"
---

# Research: chat-enhancements

## Summary
Текущий support-chat уже полностью интегрирован в DI + tRPC + Prisma: модули подключаются через `createServer()` и `Controller`-bindings (`src/app/server.ts:32`, `src/features/support-chat/module.ts:8`, `src/entities/support-chat/module.ts:8`). API доступен через merged-router `/api/trpc` и использует `authorizedProcedure` с NextAuth-session в контексте (`src/app/api/trpc/[trpc]/route.ts:12`, `src/kernel/lib/trpc/_procedure.ts:11`, `src/kernel/lib/trpc/_context-factory.ts:8`).

Поддержка realtime реализована SSE-роутом `/api/support-chat/events` с authn/authz, rate-limit, connection caps и publish/subscribe in-memory шиной (`src/app/api/support-chat/events/route.ts:166`, `src/app/api/support-chat/events/route.ts:185`, `src/features/support-chat/_integrations/support-chat-events.ts:14`). Client invalidation строится через React Query utilities в `use-support-chat` (`src/features/support-chat/_vm/use-support-chat.ts:72`, `src/features/support-chat/_vm/use-support-chat.ts:147`).

Данные чата хранятся в моделях `ChatDialog`, `ChatMessage`, `SupportReadState`, `ChatAttachment` в Postgres/Prisma (`prisma/schema.prisma:541`, `prisma/schema.prisma:556`, `prisma/schema.prisma:597`, `prisma/schema.prisma:574`). Бизнес-правила доступа уже есть: ownership для user, staff permission `canManageSupportChats`, проверка dialog access в сервисе (`src/features/support-chat/_services/support-chat-service.ts:621`, `src/features/support-chat/_services/support-chat-service.ts:648`, `src/features/support-chat/_services/support-chat-service.ts:670`).

## Entry points (as-is)
- Next.js routes/pages:
- `src/app/platform/(profile)/support-chat/page.tsx:8` — user entrypoint c role redirects.
- `src/app/(admin)/admin/support-chat/page.tsx:3` — admin entrypoint.
- `src/app/api/trpc/[trpc]/route.ts:12` — tRPC HTTP adapter.
- `src/app/api/support-chat/events/route.ts:166` — SSE stream endpoint.
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:69` — private attachment delivery.
- tRPC procedures/routers:
- `src/features/support-chat/_controller.ts:25` — `supportChat` router namespace.
- `src/features/support-chat/_controller.ts:27` — `userListDialogs`.
- `src/features/support-chat/_controller.ts:41` — `userGetMessages`.
- `src/features/support-chat/_controller.ts:56` — `staffListDialogs`.
- `src/features/support-chat/_controller.ts:71` — `sendMessage`.
- `src/features/support-chat/_controller.ts:86` — `markDialogRead`.
- `src/features/support-chat/_controller.ts:100` — `createDialog`.
- UI components:
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:29` — user chat UI.
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:42` — staff inbox UI.
- `src/features/sidebar/admin-panel-sidebar.tsx:18` + `src/features/sidebar/_ui/nav-main.tsx:14` — admin sidebar navigation.
- `src/app/platform/(profile)/profile/page.tsx:24` — profile buttons including support chat link.

## Detailed findings
### 1 DI container, auth, tRPC wiring
- Location: `src/app/server.ts:32`, `src/features/support-chat/module.ts:8`, `src/entities/support-chat/module.ts:8`, `src/kernel/lib/next-auth/module.ts:7`, `src/kernel/lib/trpc/_procedure.ts:11`.
- What it does: server container loads feature/entity modules; tRPC controllers are discovered via `Controller` multi-bindings and merged into one router; `authorizedProcedure` enforces authenticated session.
- Dependencies: Inversify `ContainerModule`; NextAuth `SessionService`; tRPC context factory.
- Data flow: HTTP `/api/trpc` -> merged routers -> authorized procedure -> support chat service.

### 2 Support chat domain/service/repository flow
- Location: `src/features/support-chat/_services/support-chat-service.ts:105`, `src/entities/support-chat/_repositories/chat-dialog-repository.ts:12`, `src/entities/support-chat/_repositories/chat-message-repository.ts:27`, `src/entities/support-chat/_repositories/chat-read-state-repository.ts:16`, `src/entities/support-chat/_repositories/chat-attachment-repository.ts:25`.
- What it does: service orchestrates list/get/send/read/create operations, calls repositories + direct Prisma queries, publishes SSE events and triggers Telegram notifications.
- Dependencies: `dbClient`, repositories, `SupportChatReadService`, `fileStorage`, notifier.
- Data flow: controller input -> zod validation -> `SupportChatService` -> repositories/Prisma -> event publish -> DTO response.

### 3 Realtime, caching, and client invalidation
- Location: `src/app/api/support-chat/events/route.ts:209`, `src/features/support-chat/_vm/use-support-chat.ts:72`, `src/features/support-chat/_vm/use-support-chat.ts:194`, `docs/caching-strategy.md:5`, `src/shared/lib/cache/cache-constants.ts:10`.
- What it does: SSE stream sends `dialog.created`/`message.created`/`read.updated`; client hooks subscribe with `EventSource` and invalidate targeted queries; support chat queries use `CACHE_SETTINGS.FREQUENT_UPDATE`.
- Dependencies: Event bus (`support-chat-events`), React Query utils.
- Data flow: service publish -> SSE stream -> browser event listener -> invalidate specific query keys.

### 4 Current UI composition and navigation points
- Location: `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx:145`, `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx:281`, `src/features/sidebar/constants.ts:11`, `src/app/platform/(profile)/profile/page.tsx:92`.
- What it does: user and staff UIs are two-pane cards with list + thread; admin sidebar has static support-chat nav item; profile page has static support-chat button.
- Dependencies: shared UI primitives (card/button/badge/textarea), support chat hooks.
- Data flow: page render -> hooks fetch dialogs/messages -> mutation actions -> invalidate + SSE refresh.

## Data flow map (as-is)
UI (`support-chat-user-page.tsx` / `support-chat-admin-inbox-page.tsx`) -> tRPC client (`_api.ts`) -> router (`_controller.ts`) -> procedure (`authorizedProcedure`) -> service (`support-chat-service.ts`) -> repositories (`chat-*-repository.ts`) + Prisma (`dbClient`) -> SSE/Telegram integrations -> response DTO -> React Query cache/update.

## Data & schema (as-is)
- Prisma models involved:
- `ChatDialog` (`prisma/schema.prisma:541`) with indexes on `[userId, updatedAt]` and `[lastMessageAt]`.
- `ChatMessage` (`prisma/schema.prisma:556`) with indexes on `[dialogId, createdAt]`, `[senderType, createdAt]`.
- `SupportReadState` (`prisma/schema.prisma:597`) with unique `[dialogId, readerType, readerUserId]`.
- `ChatAttachment` (`prisma/schema.prisma:574`) with status/indexes and FK to dialog/message/user.
- Migrations involved:
- `prisma/migrations/20260224133000_add_support_chat/migration.sql:11` (initial support chat tables/enums).
- `prisma/migrations/20260225181847_rename_support_chat/migration.sql:1` + `20260225201500_rename_support_chat_to_chat/migration.sql:17` (rename to `Chat*`).
- `prisma/migrations/20260225193000_add_support_attachment/migration.sql:5` (attachments).

## Caching & invalidation (as-is)
- Query hooks:
- `useUserDialogs` -> `supportChat.userListDialogs.useInfiniteQuery` (`src/features/support-chat/_vm/use-support-chat.ts:19`).
- `useDialogMessages` -> `supportChat.userGetMessages.useInfiniteQuery` (`src/features/support-chat/_vm/use-support-chat.ts:44`).
- `useStaffDialogs` -> `supportChat.staffListDialogs.useInfiniteQuery` (`src/features/support-chat/_vm/use-support-chat.ts:120`).
- Invalidations:
- On mutations in `useSupportChatActions` invalidates dialogs/messages (`src/features/support-chat/_vm/use-support-chat.ts:197`, `:203`, `:212`).
- On SSE events invalidates list/thread queries (`src/features/support-chat/_vm/use-support-chat.ts:78`, `:87`, `:153`, `:162`).

## Error handling (as-is)
- Domain errors: `SupportChatDomainError` with codes (`src/features/support-chat/_domain/errors.ts:1`).
- Mapping: domain -> TRPCError (`src/features/support-chat/_domain/error-mapping.ts:5`).
- Controller fallback: wraps unknown exceptions as `INTERNAL_SERVER_ERROR` (`src/features/support-chat/_controller.ts:118`).

## Security surface (as-is, facts only)
- AuthN:
- Session is loaded via NextAuth `getServerSession` in `SessionService` (`src/kernel/lib/next-auth/_session-service.ts:8`) and SSE/attachment routes (`src/app/api/support-chat/events/route.ts:167`, `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:73`).
- AuthZ:
- tRPC protected procedures use `authorizedProcedure` (`src/kernel/lib/trpc/_procedure.ts:11`).
- Dialog ownership and staff permissions enforced in service `assertDialogAccess` + `ensureStaffAccess` (`src/features/support-chat/_services/support-chat-service.ts:621`, `:648`).
- Attachment access checks role + dialog ownership (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:44`).
- IDOR boundaries:
- User dialog access check compares `dialog.userId === session.user.id` (`src/features/support-chat/_services/support-chat-service.ts:629`).
- Attachment route returns `404` for non-access (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:95`).
- Upload/download:
- Uploads use `fileStorage.uploadFile(..., 'private')` in service (`src/features/support-chat/_services/support-chat-service.ts:727`).
- Download streams from storage by path through server route (`src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts:124`).

## Dependencies (as-is)
- Internal modules:
- DI modules: `src/app/server.ts`, `src/features/support-chat/module.ts`, `src/entities/support-chat/module.ts`.
- Shared infra: `src/shared/lib/db`, `src/shared/lib/file-storage/*`, `src/shared/config/public.ts`, `src/shared/config/private.ts`.
- External services/packages:
- NextAuth, tRPC, Prisma, React Query, Radix/shadcn UI.
- Telegram Bot API (`src/features/support-chat/_integrations/telegram-support-notifier.ts:28`).
- S3/MinIO/Supabase providers for storage (`src/shared/lib/file-storage/_providers/minio.ts:17`, `src/shared/lib/file-storage/_providers/supabase.ts:12`).

## Open questions
- В коде нет отдельной процедуры для aggregated badge count в sidebar/profile (только dialog lists и unread counters per dialog).
- В текущем `ChatMessage` до изменений не было полей soft-delete/edit lifecycle.

## Files inspected
- `docs/caching-strategy.md`
- `prisma/schema.prisma`
- `prisma/migrations/20260224133000_add_support_chat/migration.sql`
- `prisma/migrations/20260225181847_rename_support_chat/migration.sql`
- `prisma/migrations/20260225193000_add_support_attachment/migration.sql`
- `prisma/migrations/20260225201500_rename_support_chat_to_chat/migration.sql`
- `src/app/server.ts`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/api/support-chat/events/route.ts`
- `src/app/api/support-chat/attachments/[dialogId]/[attachmentId]/route.ts`
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(admin)/admin/support-chat/page.tsx`
- `src/app/platform/(profile)/profile/page.tsx`
- `src/app/platform/(profile)/support-chat/page.tsx`
- `src/app/_providers/app-provider.tsx`
- `src/kernel/lib/trpc/module.ts`
- `src/kernel/lib/trpc/_context-factory.ts`
- `src/kernel/lib/trpc/_procedure.ts`
- `src/kernel/lib/trpc/_controller.ts`
- `src/kernel/lib/trpc/client.ts`
- `src/kernel/lib/next-auth/module.ts`
- `src/kernel/lib/next-auth/_session-service.ts`
- `src/kernel/lib/next-auth/_next-auth-config.ts`
- `src/kernel/lib/next-auth/client.tsx`
- `src/entities/support-chat/module.ts`
- `src/entities/support-chat/_domain/types.ts`
- `src/entities/support-chat/_repositories/chat-dialog-repository.ts`
- `src/entities/support-chat/_repositories/chat-message-repository.ts`
- `src/entities/support-chat/_repositories/chat-read-state-repository.ts`
- `src/entities/support-chat/_repositories/chat-attachment-repository.ts`
- `src/features/support-chat/module.ts`
- `src/features/support-chat/index.ts`
- `src/features/support-chat/_controller.ts`
- `src/features/support-chat/_api.ts`
- `src/features/support-chat/_vm/use-support-chat.ts`
- `src/features/support-chat/_services/support-chat-service.ts`
- `src/features/support-chat/_services/support-chat-read-service.ts`
- `src/features/support-chat/_integrations/support-chat-events.ts`
- `src/features/support-chat/_integrations/telegram-support-notifier.ts`
- `src/features/support-chat/_domain/schemas.ts`
- `src/features/support-chat/_domain/errors.ts`
- `src/features/support-chat/_domain/error-mapping.ts`
- `src/features/support-chat/_domain/attachment-schema.ts`
- `src/features/support-chat/_domain/client-error-message.ts`
- `src/features/support-chat/_domain/attachment-http-cache.ts`
- `src/features/support-chat/_domain/attachment-rate-limit.ts`
- `src/features/support-chat/_ui/support-chat-message-attachments.tsx`
- `src/features/support-chat/user-chat/_ui/support-chat-user-page.tsx`
- `src/features/support-chat/admin-chat/_ui/support-chat-admin-inbox-page.tsx`
- `src/features/sidebar/constants.ts`
- `src/features/sidebar/admin-panel-sidebar.tsx`
- `src/features/sidebar/_ui/nav-main.tsx`
- `src/shared/lib/cache/cache-constants.ts`
- `src/shared/lib/file-storage/file-storage.ts`
- `src/shared/lib/file-storage/_model/create-storage.ts`
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/lib/file-storage/_providers/supabase.ts`
- `src/shared/config/public.ts`
- `src/shared/config/private.ts`
