---
date: 2026-02-23
researcher: Codex
branch: feat/react-compiler
commit: 1562d21
feature: support-chat
research_question: "Как в текущем коде реализованы существующие архитектурные и интеграционные паттерны для фичи support-chat (user<->support, realtime/SSE, вложения, Telegram, read indicators)?"
---

# Research: support-chat

## Summary
Кодовая база использует DI-контейнер Inversify, который загружается в `createServer()` и объединяет entity/feature модули, включая auth и tRPC инфраструктуру (`src/app/server.ts:30`, `src/app/server.ts:33`). tRPC-роуты собираются динамически из всех зарегистрированных контроллеров и обслуживаются через `/api/trpc` (`src/app/api/trpc/[trpc]/route.ts:10`, `src/app/api/trpc/[trpc]/route.ts:16`).

Аутентификация построена на NextAuth с JWT-сессией: `SessionService` читает серверную сессию через `getServerSession`, а tRPC `authorizedProcedure` и `checkAbilityProcedure` используют `ctx.session`/ability для доступа (`src/kernel/lib/next-auth/_session-service.ts:8`, `src/kernel/lib/trpc/_procedure.ts:11`, `src/kernel/lib/trpc/_procedure.ts:22`). Роли и staff permissions присутствуют в схеме и в admin-контроллерах (`prisma/schema.prisma:17`, `prisma/schema.prisma:505`, `src/features/admin-panel/users/_controller.ts:97`).

Для сценариев, близких к support-chat, в коде уже есть: форма обращения с отправкой в Telegram (`src/features/lead-request/_controller.ts:14`, `src/features/lead-request/_services/lead-request-service.ts:87`), паттерны list/detail и tabs в админке (`src/app/(admin)/admin/users/page.tsx:3`, `src/features/admin-panel/users/_ui/admin-user-detail-page.tsx:153`), client notifications через `sonner` (`src/app/_providers/app-provider.tsx:36`, `src/features/lead-request/_ui/lead-request-dialog.tsx:90`), а также file upload flows через MinIO/Supabase провайдеры (`src/shared/lib/file-storage/_model/create-storage.ts:6`, `src/shared/lib/file-storage/_providers/minio.ts:18`, `src/shared/lib/file-storage/_providers/supabase.ts:12`).

## Entry points (as-is)
- Next.js routes/pages:
  - `src/app/(admin)/admin/users/page.tsx:3` рендерит список пользователей (`AdminUsersPage`) как admin list entry.
  - `src/app/(admin)/admin/users/[id]/page.tsx:3` рендерит detail view пользователя (`AdminUserDetailPage`).
  - `src/app/(admin)/admin/layout.tsx:22` проверяет сессию и роль (`ADMIN|STAFF`) для доступа в admin route group.
  - `src/app/(site)/individual-support/page.tsx:57` и `src/app/(site)/nutrition-support/page.tsx:160` используют `LeadRequestDialog` для пользовательского обращения.
- tRPC procedures/routers:
  - `src/features/lead-request/_controller.ts:12` содержит `leadRequest.submit` (public mutation).
  - `src/features/admin-panel/users/_controller.ts:117` содержит admin user router (list/detail/access operations).
  - `src/features/course-enrollment/_controller.ts:70` содержит user-scoped access/enrollment router.
- UI components:
  - `src/features/lead-request/_ui/lead-request-dialog.tsx:36` — диалог отправки заявки с валидацией и toast.
  - `src/features/admin-panel/users/_ui/admin-users-page.tsx:12` — list/table/pagination экран.
  - `src/features/admin-panel/users/_ui/admin-user-detail-page.tsx:153` — detail экран с `Tabs`.

## Detailed findings
### 1) DI container, auth, tRPC composition
- Location: `src/app/server.ts:30`, `src/kernel/lib/next-auth/module.ts:7`, `src/kernel/lib/trpc/module.ts:18`, `src/app/api/trpc/[trpc]/route.ts:10`
- What it does:
  - `createServer()` создаёт контейнер и загружает модули домена/фич (`src/app/server.ts:33`).
  - `NextAuthModule` биндингует `NextAuthConfig`, `SessionService` и auth controller (`src/kernel/lib/next-auth/module.ts:9`).
  - `TrpcModule` биндингует `ContextFactory` (`src/kernel/lib/trpc/module.ts:20`).
  - TRPC route handler мержит `sharedRouter` + routers всех DI-контроллеров (`src/app/api/trpc/[trpc]/route.ts:16`).
- Dependencies: Inversify ContainerModule, NextAuthConfig/SessionService, ContextFactory, tRPC fetch adapter.
- Data flow: HTTP `/api/trpc` -> `fetchRequestHandler` -> merged router -> controller procedure -> service/repository.

### 2) Auth/session + authorization patterns
- Location: `src/kernel/lib/next-auth/_next-auth-config.ts:27`, `src/kernel/lib/next-auth/_session-service.ts:8`, `src/kernel/lib/trpc/_procedure.ts:11`, `src/features/admin-panel/users/_domain/ability.ts:7`
- What it does:
  - NextAuth настроен на JWT strategy; callbacks добавляют `id`, `role`, `image`, `name` в `session.user` (`src/kernel/lib/next-auth/_next-auth-config.ts:60`, `src/kernel/lib/next-auth/_next-auth-config.ts:79`).
  - `SessionService.get()` читает серверную сессию (`src/kernel/lib/next-auth/_session-service.ts:8`).
  - `authorizedProcedure` блокирует запросы без сессии; `checkAbilityProcedure` блокирует по policy check (`src/kernel/lib/trpc/_procedure.ts:12`, `src/kernel/lib/trpc/_procedure.ts:32`).
  - Admin ability выводится из `role + staff permissions` (`src/features/admin-panel/users/_domain/ability.ts:11`, `src/features/admin-panel/users/_domain/ability.ts:22`).
  - Route-level admin gate: layout допускает только `ADMIN|STAFF` (`src/app/(admin)/admin/layout.tsx:27`).
- Dependencies: NextAuth, TRPCError, staff permission service, admin ability factory.
- Data flow: session cookie -> NextAuth callbacks -> `SessionService` -> tRPC ctx -> procedure guards -> ability gates.

### 3) Data model and integrations relevant to support-chat checklist
- Location: `prisma/schema.prisma:17`, `prisma/schema.prisma:505`, `prisma/schema.prisma:629`, `src/features/lead-request/_services/lead-request-service.ts:74`, `src/shared/lib/file-storage/_providers/minio.ts:7`, `src/shared/lib/file-storage/_providers/supabase.ts:6`
- What it does:
  - В схеме есть `ROLE`, `User`, `StaffPermission`, `UserAccess`, `UserFreeze`, `UserAccessHistory`, `UserActivity`; отдельные chat/thread/message модели в `schema.prisma` отсутствуют (полный файл просмотрен: `prisma/schema.prisma:1-684`).
  - Telegram интеграция реализована в `LeadRequestService.sendToTelegram()` через Bot API `sendMessage` и `chat_id` (`src/features/lead-request/_services/lead-request-service.ts:87`, `src/features/lead-request/_services/lead-request-service.ts:94`).
  - File storage выбирает MinIO в development и Supabase иначе (`src/shared/lib/file-storage/_model/create-storage.ts:7`).
  - MinIO провайдер использует `S3Client`/`Upload` и bucket из env (`src/shared/lib/file-storage/_providers/minio.ts:8`, `src/shared/lib/file-storage/_providers/minio.ts:19`).
  - Supabase провайдер загружает в storage bucket и возвращает путь (`src/shared/lib/file-storage/_providers/supabase.ts:29`).
  - Upload flows вызываются из server actions (avatar/course image/knowledge file) и из adminRecipes `uploadPhoto` mutation (`src/features/update-profile/_actions/upload-avatar.ts:23`, `src/features/admin-panel/courses/_actions/upload-course-image.ts:28`, `src/features/admin-panel/knowledge/_actions/upload-file.ts:24`, `src/features/admin-panel/recipes/_controller.ts:209`).
- Dependencies: Prisma/Postgres, Telegram Bot HTTP API, AWS SDK S3, Supabase Storage, Next server actions.
- Data flow:
  - Lead request UI -> `leadRequest.submit` -> `LeadRequestService.submit` -> `sendToTelegram` -> Telegram API.
  - Upload action -> session check -> file validation/sanitize -> fileStorage provider -> returned file path.

### 4) UI, list/detail, tabs, notifications, pagination patterns
- Location: `src/features/admin-panel/users/_ui/admin-users-page.tsx:12`, `src/features/admin-panel/users/_ui/admin-user-detail-page.tsx:153`, `src/features/admin-panel/workouts/admin-workouts-page.tsx:37`, `src/app/_providers/app-provider.tsx:36`
- What it does:
  - Есть list/detail admin pattern: users list page + user detail page (`src/app/(admin)/admin/users/page.tsx:3`, `src/app/(admin)/admin/users/[id]/page.tsx:9`).
  - Detail экран использует вкладки (`accesses/payments/activity/freezes`) через `Tabs` (`src/features/admin-panel/users/_ui/admin-user-detail-page.tsx:74`, `src/features/admin-panel/users/_ui/admin-user-detail-page.tsx:167`).
  - Есть infinite pagination pattern с `useInfiniteQuery + IntersectionObserver` в admin workouts и workout picker (`src/features/admin-panel/workouts/admin-workouts-page.tsx:37`, `src/features/admin-panel/workouts/admin-workouts-page.tsx:103`, `src/features/admin-panel/courses/_ui/workout-picker-dialog.tsx:67`, `src/features/admin-panel/courses/_ui/workout-picker-dialog.tsx:111`).
  - Global toast notifications через `Toaster` в `AppProvider`, и множественные `toast.*` в фичах (`src/app/_providers/app-provider.tsx:36`, `src/shared/ui/sonner.tsx:6`, `src/features/lead-request/_ui/lead-request-dialog.tsx:90`).
- Dependencies: TanStack React Query, shadcn Tabs/Dialog, Sonner toasts.
- Data flow: query hook -> UI table/cards -> user actions -> mutations -> invalidate/refetch + toast.

## Required searches (chat-related)
- `telegram|bot|chat_id|sendMessage|tg`:
  - Telegram bot send path найден в `LeadRequestService` (`src/features/lead-request/_services/lead-request-service.ts:75`, `src/features/lead-request/_services/lead-request-service.ts:87`, `src/features/lead-request/_services/lead-request-service.ts:94`).
  - Telegram env keys есть в конфиге (`src/shared/config/private.ts:32`).
- `message|messages|conversation|thread|inbox|support`:
  - Матчей `conversation|thread|inbox` в `src`/`prisma` не найдено (поиск выполнен).
  - В коде присутствуют `message` в error/validation текстах и Telegram payload, но не как отдельная chat-domain сущность (`src/features/lead-request/_services/lead-request-service.ts:47`, `src/features/lead-request/_services/lead-request-service.ts:113`).
- `unread|read|seen|badge|counter`:
  - `unread` как domain поле/enum не найдено.
  - `seen` используется как локальный Set для дедупликации в UI списках (`src/features/admin-panel/workouts/admin-workouts-page.tsx:56`, `src/features/admin-panel/courses/_ui/workout-picker-dialog.tsx:92`).
  - `badge` используется как UI-компонент/метка в разных экранах (`src/shared/ui/badge.tsx:28`, `src/features/admin-panel/users/_ui/tables/users/columns.tsx:299`).
- `attachment|upload|presign|signed|s3|minio|object storage`:
  - `attachments` хранится в knowledge article (`prisma/schema.prisma:213`).
  - Upload реализован через file storage providers (`src/shared/lib/file-storage/_providers/minio.ts:18`, `src/shared/lib/file-storage/_providers/supabase.ts:12`).
  - Presigned URL flow в текущем коде не найден; upload выполняется server-side actions/TRPC (`src/features/admin-panel/recipes/_controller.ts:209`, `src/features/admin-panel/courses/_actions/upload-course-image.ts:28`).
- `admin|staff|role|permission|isAdmin`:
  - Роль и staff permissions присутствуют в Prisma (`prisma/schema.prisma:17`, `prisma/schema.prisma:505`).
  - Admin ability и controller checks используют `role + permissions` (`src/features/admin-panel/users/_domain/ability.ts:11`, `src/features/admin-panel/users/_controller.ts:97`).
- `notification|toast`:
  - Global toaster подключён в app provider (`src/app/_providers/app-provider.tsx:36`).
  - UI уведомления через `toast` широко применяются в feature UI (`src/features/lead-request/_ui/lead-request-dialog.tsx:90`, `src/features/admin-panel/workouts/admin-workouts-page.tsx:77`).

## Data flow map (as-is)
1. General TRPC flow:
UI hook (`createApi` consumers) -> TRPC client provider (`src/app/_providers/app-provider.tsx:28`) -> `/api/trpc` handler (`src/app/api/trpc/[trpc]/route.ts:13`) -> merged controller routers (`src/app/api/trpc/[trpc]/route.ts:16`) -> procedure guard (`src/kernel/lib/trpc/_procedure.ts:11`) -> service/repository -> Prisma (`src/shared/lib/db.ts:1`) -> response.

2. Lead request flow:
`LeadRequestDialog` submit (`src/features/lead-request/_ui/lead-request-dialog.tsx:76`) -> `leadRequest.submit` mutation (`src/features/lead-request/_controller.ts:14`) -> rate limit + honeypot check (`src/features/lead-request/_services/lead-request-service.ts:15`, `src/features/lead-request/_services/lead-request-service.ts:37`) -> Telegram HTTP call (`src/features/lead-request/_services/lead-request-service.ts:87`) -> `{ ok: true }`.

3. SSR helper flow used by paid day page:
`createControllerHelpers` (`src/shared/api/server-helpers.ts:62`) -> prefill query cache with `setQueryData` (`src/app/platform/(paid)/day/[courseSlug]/page.tsx:90`) -> dehydrate (`src/app/platform/(paid)/day/[courseSlug]/page.tsx:146`) -> hydrated client page.

## Data & schema (as-is)
- Prisma models involved for auth/admin/access/logging:
  - `ROLE`, `User`, `StaffPermission` (`prisma/schema.prisma:17`, `prisma/schema.prisma:480`, `prisma/schema.prisma:505`).
  - `UserAccess`, `UserFreeze`, `UserAccessHistory`, `UserActivity`, `UserPaidActivity` (`prisma/schema.prisma:629`, `prisma/schema.prisma:647`, `prisma/schema.prisma:663`, `prisma/schema.prisma:519`, `prisma/schema.prisma:530`).
- Constraints / FK / indexes:
  - `StaffPermission.userId` unique + FK (`prisma/schema.prisma:507`, `prisma/migrations/20251117090853_add_staff_permissions/migration.sql:16`).
  - `UserAccessHistory` index by `userAccessId` + FK to `UserAccess` (`prisma/schema.prisma:671`, `prisma/migrations/20251118160249_add_user_access_history/migration.sql:14`).
  - `KnowledgeArticle.attachments` JSONB (`prisma/schema.prisma:213`, `prisma/migrations/20251210093914_add_knowledge/migration.sql:27`).
- Migrations involved:
  - Role introduction (`prisma/migrations/20250618164246_add_role/migration.sql:2`).
  - Staff permissions + additional flags (`prisma/migrations/20251117090853_add_staff_permissions/migration.sql:2`, `prisma/migrations/20251117184358_add_staff_permission/migration.sql:2`, `prisma/migrations/20251124175138_add_can_manage_courses_permission/migration.sql:2`).
  - Access history / activity logs (`prisma/migrations/20251118160249_add_user_access_history/migration.sql:2`, `prisma/migrations/20251123115727_add_user_activity_log/migration.sql:5`).
- Chat-related model check:
  - Отдельных моделей conversation/thread/message/inbox в Prisma-схеме не найдено (просмотр `prisma/schema.prisma:1-684`).

## Caching & invalidation (as-is)
- Policy doc:
  - Проектная стратегия описывает 3 профиля кеша и инвалидацию после мутаций (`docs/caching-strategy.md:5`, `docs/caching-strategy.md:19`).
- Constants/helpers:
  - `CACHE_SETTINGS` содержит `FREQUENT_UPDATE`, `RARE_UPDATE`, `STATIC` (`src/shared/lib/cache/cache-constants.ts:10`).
  - `CACHE_GROUPS` + `invalidateCacheGroup()` используют `queryClient.invalidateQueries` по grouped query keys (`src/shared/lib/cache/cache-invalidation.ts:9`, `src/shared/lib/cache/cache-invalidation.ts:35`).
- Concrete usage:
  - Enrollment hooks применяют `CACHE_SETTINGS.FREQUENT_UPDATE` (`src/features/course-enrollment/_vm/use-course-enrollment.ts:45`, `src/features/course-enrollment/_vm/use-course-enrollment.ts:99`).
  - После мутаций вызываются invalidate для связанных enrollment/access queries (`src/features/course-enrollment/_vm/use-course-enrollment.ts:114`, `src/features/course-enrollment/_vm/use-course-enrollment.ts:143`).
  - Infinite cache/pagination используется в admin workouts list (`src/features/admin-panel/workouts/admin-workouts-page.tsx:37`).

## Error handling (as-is)
- TRPC layer:
  - Guards и ability checks бросают `TRPCError` (`UNAUTHORIZED`/`FORBIDDEN`) в базовых процедурах (`src/kernel/lib/trpc/_procedure.ts:13`, `src/kernel/lib/trpc/_procedure.ts:33`).
- Feature services/controllers:
  - Lead request возвращает `TOO_MANY_REQUESTS`, `BAD_REQUEST`, `INTERNAL_SERVER_ERROR` в service (`src/features/lead-request/_services/lead-request-service.ts:21`, `src/features/lead-request/_services/lead-request-service.ts:38`, `src/features/lead-request/_services/lead-request-service.ts:111`).
  - User recipes access check возвращает `FORBIDDEN` при отсутствии доступа (`src/features/user-recipes/_controller.ts:45`).
  - Admin controllers используют `TRPCError` при отсутствии роли/данных (`src/features/admin-panel/users/_controller.ts:99`, `src/features/admin-panel/courses/_controller.ts:51`, `src/features/admin-panel/workouts/_controller.ts:123`).
- UI mapping:
  - Ошибки отображаются через `toast` и условные error states (`src/features/lead-request/_ui/lead-request-dialog.tsx:93`, `src/features/user-recipes/_ui/recipes-screen.tsx:286`).

## Security surface (as-is, facts only)
- authn: where session is read
  - Серверная сессия: `SessionService.get()` -> `getServerSession` (`src/kernel/lib/next-auth/_session-service.ts:8`).
  - Session inject в TRPC context через `ContextFactory.createContext` (`src/kernel/lib/trpc/_context-factory.ts:8`).
- authz: where checks happen
  - Global TRPC auth middleware: `authorizedProcedure` (`src/kernel/lib/trpc/_procedure.ts:11`).
  - Admin route gate в layout (`src/app/(admin)/admin/layout.tsx:27`).
  - Ability checks в admin controllers через `checkAbilityProcedure` (`src/features/admin-panel/users/_controller.ts:120`, `src/features/admin-panel/courses/_controller.ts:73`, `src/features/admin-panel/workouts/_controller.ts:357`, `src/features/admin-panel/recipes/_controller.ts:209`, `src/features/admin-panel/knowledge/_controller.ts:98`).
- IDOR boundaries: where ownership checks exist (if any)
  - Ownership-style checks есть в profile ability (`src/features/update-profile/_domain/ability.ts:4`) и recipes access (`src/features/user-recipes/_controller.ts:36`).
  - В `CourseEnrollmentController` user-scoped процедуры принимают `userId` из input и используют его при вызове сервисов (`src/features/course-enrollment/_controller.ts:138`, `src/features/course-enrollment/_controller.ts:172`, `src/features/course-enrollment/_controller.ts:250`).
- file upload/download flows (if any)
  - Upload actions проверяют тип/размер файла и сессию перед загрузкой (`src/features/update-profile/_actions/upload-avatar.ts:30`, `src/features/admin-panel/courses/_actions/upload-course-image.ts:37`, `src/features/admin-panel/knowledge/_actions/upload-file.ts:32`).
  - Admin course image upload дополнительно проверяет `ability.canManageCourses` (`src/features/admin-panel/courses/_actions/upload-course-image.ts:64`).
  - Knowledge attachments отображаются в user knowledge page как ссылки (`src/app/platform/(paid)/knowledge/[categoryId]/page.tsx:137`).

## Dependencies (as-is)
- internal modules
  - DI modules: entities/features/kernel modules регистрируются в `server.ts` (`src/app/server.ts:33`).
  - Shared infra: auth (`src/kernel/lib/next-auth/_next-auth-config.ts:27`), trpc (`src/kernel/lib/trpc/_procedure.ts:7`), server helpers (`src/shared/api/server-helpers.ts:62`), cache helpers (`src/shared/lib/cache/cache-constants.ts:10`).
- external services/packages
  - NextAuth + Prisma adapter (`src/kernel/lib/next-auth/_next-auth-config.ts:8`).
  - Telegram Bot HTTP API (`src/features/lead-request/_services/lead-request-service.ts:87`).
  - AWS S3 SDK for MinIO (`src/shared/lib/file-storage/_providers/minio.ts:2`).
  - Supabase storage client (`src/shared/lib/file-storage/_providers/supabase.ts:2`).
  - TanStack Query + tRPC React hooks (`src/app/_providers/app-provider.tsx:3`, `src/kernel/lib/trpc/client.ts:1`).

## Open questions
- Где именно должна жить новая user<->support chat функциональность в текущих route groups (`platform` vs `admin`) — в коде есть admin/user entry points, но отдельного support inbox route не найдено (`src/app/(admin)/admin/users/page.tsx:3`, `src/app/platform/(profile)/profile/page.tsx:22`).
- В кодовой базе не найдена существующая SSE/WebSocket инфраструктура для realtime сообщений (поиск по chat/inbox/thread/conversation в `src`/`prisma` не дал совпадений; schema просмотрена полностью: `prisma/schema.prisma:1-684`).
- Не найден отдельный background job/queue scheduler для обработки сообщений/уведомлений; Telegram отправка в существующем потоке выполняется синхронно в сервисе (`src/features/lead-request/_services/lead-request-service.ts:48`).

## Files inspected
- `AGENTS.md`
- `docs/ai/commands/research-codebase.md`
- `docs/ai/features/support-chat/00-brief.md`
- `docs/caching-strategy.md`
- `docs/server-helpers.md`
- `src/app/server.ts`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/_providers/app-provider.tsx`
- `src/app/api/activity/route.ts`
- `src/app/(admin)/admin/layout.tsx`
- `src/app/(admin)/admin/users/page.tsx`
- `src/app/(admin)/admin/users/[id]/page.tsx`
- `src/app/platform/(paid)/layout.tsx`
- `src/app/platform/(profile)/layout.tsx`
- `src/app/platform/(profile)/profile/page.tsx`
- `src/app/platform/(paid)/day/[courseSlug]/page.tsx`
- `src/app/platform/(paid)/recipes/page.tsx`
- `src/app/platform/(paid)/recipes/[slug]/page.tsx`
- `src/app/(site)/individual-support/page.tsx`
- `src/app/(site)/nutrition-support/page.tsx`
- `src/kernel/lib/next-auth/module.ts`
- `src/kernel/lib/next-auth/_session-service.ts`
- `src/kernel/lib/next-auth/_next-auth-config.ts`
- `src/kernel/lib/next-auth/client.tsx`
- `src/kernel/lib/trpc/module.ts`
- `src/kernel/lib/trpc/_context-factory.ts`
- `src/kernel/lib/trpc/_procedure.ts`
- `src/kernel/lib/trpc/_controller.ts`
- `src/kernel/lib/trpc/client.ts`
- `src/shared/api/server-helpers.ts`
- `src/shared/api/query-client.ts`
- `src/shared/config/private.ts`
- `src/shared/config/public.ts`
- `src/shared/lib/cache/cache-constants.ts`
- `src/shared/lib/cache/cache-invalidation.ts`
- `src/shared/lib/cache/use-navigation-with-cache.ts`
- `src/shared/lib/file-storage/file-storage.ts`
- `src/shared/lib/file-storage/_model/create-storage.ts`
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/lib/file-storage/_providers/supabase.ts`
- `src/shared/lib/file-storage/types.ts`
- `src/shared/lib/file-storage/utils.ts`
- `src/shared/lib/logger.ts`
- `src/shared/ui/sonner.tsx`
- `src/entities/course/module.ts`
- `src/entities/user/module.ts`
- `src/entities/workout/module.ts`
- `src/entities/payment/module.ts`
- `src/entities/user-access/module.ts`
- `src/entities/knowledge/module.ts`
- `src/entities/recipes/module.ts`
- `src/features/courses-list/module.ts`
- `src/features/course-details/module.ts`
- `src/features/course-enrollment/module.ts`
- `src/features/daily-plan/module.ts`
- `src/features/course-order/module.ts`
- `src/features/user-courses/module.ts`
- `src/features/knowledge/module.ts`
- `src/features/user-recipes/module.ts`
- `src/features/lead-request/module.ts`
- `src/features/admin-panel/users/module.ts`
- `src/features/admin-panel/courses/module.ts`
- `src/features/admin-panel/workouts/module.ts`
- `src/features/admin-panel/recipes/module.ts`
- `src/features/admin-panel/knowledge/module.ts`
- `src/features/update-profile/server.ts`
- `src/features/lead-request/_api.ts`
- `src/features/lead-request/_controller.ts`
- `src/features/lead-request/_domain/lead-request-schema.ts`
- `src/features/lead-request/_services/lead-request-service.ts`
- `src/features/lead-request/_ui/lead-request-dialog.tsx`
- `src/features/user-recipes/_api.ts`
- `src/features/user-recipes/_controller.ts`
- `src/features/user-recipes/_ui/recipes-screen.tsx`
- `src/features/user-recipes/_ui/recipe-detail.tsx`
- `src/features/course-enrollment/_api.ts`
- `src/features/course-enrollment/_controller.ts`
- `src/features/course-enrollment/_vm/use-course-enrollment.ts`
- `src/features/admin-panel/users/_domain/ability.ts`
- `src/features/admin-panel/users/_domain/types.ts`
- `src/features/admin-panel/users/_controller.ts`
- `src/features/admin-panel/users/_repositories/admin-users.ts`
- `src/features/admin-panel/users/_services/staff-permissions.ts`
- `src/features/admin-panel/users/_services/get-admin-user-detail.ts`
- `src/features/admin-panel/users/_hooks/use-admin-users.ts`
- `src/features/admin-panel/users/_ui/admin-users-page.tsx`
- `src/features/admin-panel/users/_ui/admin-users-pagination.tsx`
- `src/features/admin-panel/users/_ui/admin-user-detail-page.tsx`
- `src/features/admin-panel/users/_ui/tables/users/columns.tsx`
- `src/features/admin-panel/courses/_controller.ts`
- `src/features/admin-panel/workouts/_api.ts`
- `src/features/admin-panel/workouts/_controller.ts`
- `src/features/admin-panel/workouts/admin-workouts-page.tsx`
- `src/features/admin-panel/courses/_ui/workout-picker-dialog.tsx`
- `src/features/admin-panel/knowledge/_controller.ts`
- `src/features/admin-panel/recipes/_controller.ts`
- `src/features/update-profile/_actions/upload-avatar.ts`
- `src/features/admin-panel/courses/_actions/upload-course-image.ts`
- `src/features/admin-panel/knowledge/_actions/upload-file.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20250618164246_add_role/migration.sql`
- `prisma/migrations/20251117090853_add_staff_permissions/migration.sql`
- `prisma/migrations/20251117184358_add_staff_permission/migration.sql`
- `prisma/migrations/20251118160249_add_user_access_history/migration.sql`
- `prisma/migrations/20251123115727_add_user_activity_log/migration.sql`
- `prisma/migrations/20251124175138_add_can_manage_courses_permission/migration.sql`
- `prisma/migrations/20251210093914_add_knowledge/migration.sql`
