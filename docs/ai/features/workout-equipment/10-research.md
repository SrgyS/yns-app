---
date: 2026-03-04
researcher: Codex
branch: feat/react-compiler
commit: 19f4bc4
feature: workout-equipment
research_question: "How workout equipment is currently handled in the admin workout create/edit flow, persisted in Prisma, validated, authorized, and surfaced in existing UI."
---

# Research: workout-equipment

## Summary
The current admin workout editing flow is exposed through the Next.js admin route at `src/app/(admin)/admin/workouts/page.tsx:1-4`, which renders `AdminWorkoutsPage`. That client component loads workouts with a tRPC infinite query and opens `WorkoutEditDialog` for editing an existing workout record by `id` using `adminWorkouts.workouts.get` and `adminWorkouts.workouts.upsert` from the typed tRPC client in `src/features/admin-panel/workouts/admin-workouts-page.tsx:18-179` and `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:52-340`.

In the current implementation, workout equipment in the admin dialog is edited as a single comma-separated text input, not as checkbox selections. The dialog maps the stored `string[]` from the workout record into a comma-separated string for UI state and converts it back to `string[]` by splitting on commas before sending the mutation payload in `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:93-109` and `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:112-130`. On the server, the tRPC controller accepts `equipment` as `z.array(z.string().trim()).default([])` and writes the array directly into `dbClient.workout` in `src/features/admin-panel/workouts/_schemas.ts:9-19` and `src/features/admin-panel/workouts/_controller.ts:313-351`.

The canonical `equipmentItems` constant exists in shared code and is currently used by site-facing equipment UI, including the standalone equipment page and the course equipment block, where it drives rendered cards and optional filtering by `itemIds` in `src/shared/lib/equipment.ts:13-81`, `src/app/(site)/equipment/page.tsx:1-75`, and `src/app/(site)/courses/_ui/blocks/equipment-block.tsx:10-79`. The admin workout editing flow files inspected for this research do not import or read `equipmentItems`; the admin path currently operates on raw `string[]` values passed through tRPC and Prisma.

## Entry points (as-is)
- Next.js routes/pages: `src/app/(admin)/admin/workouts/page.tsx:1-4` renders `AdminWorkoutsPage` for the admin workouts screen.
- Next.js routes/pages: `src/app/api/trpc/[trpc]/route.ts:10-20` merges all bound `Controller` routers and serves them at `/api/trpc`.
- Next.js routes/pages: `src/app/(site)/equipment/page.tsx:6-74` renders all `equipmentItems` on the public equipment page.
- tRPC procedures/routers: `src/features/admin-panel/workouts/_controller.ts:354-386` defines `adminWorkouts.workouts.list`, `get`, `upsert`, and `sync`.
- tRPC procedures/routers: `src/kernel/lib/trpc/_procedure.ts:11-42` defines `authorizedProcedure` and `checkAbilityProcedure`, which are used by the admin workouts router.
- UI components: `src/features/admin-panel/workouts/admin-workouts-page.tsx:36-53` starts the workouts list query and `src/features/admin-panel/workouts/admin-workouts-page.tsx:173-177` mounts `WorkoutEditDialog`.
- UI components: `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:60-76` fetches workout detail and configures the upsert mutation.
- UI components: `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:298-309` renders the current equipment input labeled `Инвентарь (через запятую)`.
- UI components: `src/app/(site)/courses/_ui/blocks/equipment-block.tsx:14-18` filters `equipmentItems` by `itemIds` before rendering.

## Detailed findings
### 1 Admin workout edit flow
- Location: `src/features/admin-panel/workouts/admin-workouts-page.tsx:18-179`
- What it does: `AdminWorkoutsPage` manages filter state, loads workout pages through `adminWorkoutsApi.adminWorkouts.workouts.list.useInfiniteQuery`, triggers Kinescope sync via `adminWorkouts.workouts.sync.useMutation`, and opens the edit dialog by storing a selected workout id in local state.
- Dependencies: `adminWorkoutsApi`, `AdminWorkoutsTable`, `AdminWorkoutsFilters`, `useDebounce`, `WorkoutEditDialog`, `Button`, `toast`.
- Data flow: UI filter state -> `adminWorkouts.workouts.list.useInfiniteQuery` input object -> paginated response pages -> deduplicated `workouts` array in `useMemo` -> `AdminWorkoutsTable`; row action -> `startEdit` -> `selectedWorkoutId`/`dialogOpen` -> `WorkoutEditDialog`.

### 2 Equipment editing in the dialog
- Location: `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:34-44`
- What it does: `EditState` stores `equipment` as a single `string`, while `muscles` and `subsections` are modeled as enum arrays in local state.
- Dependencies: React state/effects, `adminWorkoutsApi`, `skipToken`, `toast`, UI form primitives, Prisma enums from `@prisma/client`.
- Data flow: Query result `workout.equipment` (`string[] | undefined`) -> `(workout.equipment ?? []).join(', ')` -> `editState.equipment` string in `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:93-109`.

- Location: `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:112-130`
- What it does: `handleSave` sends the mutation payload. For equipment, it checks whether the text field is non-empty, then splits by comma, trims each segment, filters falsy values, and sends the resulting `string[]`; otherwise it sends an empty array.
- Dependencies: `upsertMutation` from `adminWorkoutsApi.adminWorkouts.workouts.upsert.useMutation`.
- Data flow: `editState.equipment` string -> `.split(',')` -> `.map(trim)` -> `.filter(Boolean)` -> `equipment: string[]` in mutation input -> tRPC mutation.

- Location: `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:298-309`
- What it does: The rendered equipment control is an `Input` field labeled `Инвентарь (через запятую)` with placeholder `коврик, резинка`.
- Dependencies: `Label`, `Input`.
- Data flow: user text input -> `onChange` -> `setEditState` updates `equipment` string in component state.

### 3 tRPC contract and server-side persistence
- Location: `src/features/admin-panel/workouts/_schemas.ts:9-19`
- What it does: `workoutUpsertInputSchema` validates the upsert payload. `equipment` is declared as `z.array(z.string().trim()).default([])`.
- Dependencies: `zod`, Prisma enums `WorkoutSection`, `WorkoutSubsection`, `MuscleGroup`, `WorkoutDifficulty`.
- Data flow: client mutation payload -> Zod parse -> typed `WorkoutUpsertInput`.

- Location: `src/features/admin-panel/workouts/_controller.ts:313-351`
- What it does: `upsertWorkout` builds a `data` object from the validated input and persists it directly via `dbClient.workout.update` or `dbClient.workout.create`. It writes `equipment: input.equipment ?? []`.
- Dependencies: `dbClient`, `WorkoutUpsertInput`, `TRPCError` (used elsewhere in controller), Prisma types.
- Data flow: validated `WorkoutUpsertInput` -> `data` object -> `dbClient.workout.update` or `dbClient.workout.create` -> Prisma `Workout` row -> `mapDetail` -> tRPC response.

- Location: `src/features/admin-panel/workouts/_controller.ts:107-115`
- What it does: `mapDetail` returns `equipment: workout.equipment ?? []` in the admin detail payload.
- Dependencies: `mapSummary`.
- Data flow: Prisma workout row -> `AdminWorkoutDetail` DTO -> tRPC query response.

- Location: `src/features/admin-panel/workouts/_controller.ts:363-377`
- What it does: The `get` and `upsert` procedures are both guarded by `checkAbilityProcedure`, parse inputs with `workoutIdSchema` / `workoutUpsertInputSchema`, and call `getWorkout` / `upsertWorkout`.
- Dependencies: `router`, `checkAbilityProcedure`, Zod schemas, `createAbility`.
- Data flow: HTTP `/api/trpc` request -> merged router -> `checkAbilityProcedure` -> input parsing -> controller method -> response DTO.

### 4 Authorization and session path
- Location: `src/kernel/lib/trpc/_context-factory.ts:5-14`
- What it does: `ContextFactory.createContext` reads the session through `SessionService.get()` and returns `{ session }` as the tRPC context.
- Dependencies: `SessionService`.
- Data flow: HTTP request -> `getServerSession` via `SessionService` -> tRPC context object.

- Location: `src/kernel/lib/next-auth/_session-service.ts:5-10`
- What it does: `SessionService.get()` calls `getServerSession(this.nextAuthConfig.options)`.
- Dependencies: `NextAuthConfig`, `next-auth`.
- Data flow: server-side call -> NextAuth config -> session result or `null`.

- Location: `src/kernel/lib/trpc/_procedure.ts:11-20`
- What it does: `authorizedProcedure` throws `TRPCError({ code: 'UNAUTHORIZED' })` when `ctx.session` is missing.
- Dependencies: `TRPCError`, `t.procedure`.
- Data flow: tRPC context -> session presence check -> next middleware or `UNAUTHORIZED` error.

- Location: `src/kernel/lib/trpc/_procedure.ts:22-42`
- What it does: `checkAbilityProcedure` creates an ability object from the authenticated session and optionally throws `TRPCError({ code: 'FORBIDDEN' })` when `check(ability)` returns false.
- Dependencies: `authorizedProcedure`, `SharedSession`.
- Data flow: authenticated session -> ability factory -> permission predicate -> next middleware or `FORBIDDEN` error.

- Location: `src/features/admin-panel/workouts/_controller.ts:72-92`
- What it does: `createAbility` converts `session.user.role` to `ROLE`, rejects non-`ADMIN`/`STAFF` roles via `ensureAdmin`, loads staff permissions, and returns `createAdminAbility(session, permissions)`.
- Dependencies: `ROLE`, `StaffPermissionService`, `createAdminAbility`.
- Data flow: session -> role check -> staff permission lookup -> `AdminAbility`.

- Location: `src/features/admin-panel/workouts/_controller.ts:357-383`
- What it does: all admin workout procedures use `checkAbilityProcedure` with `check: ability => ability.canManageCourses`.
- Dependencies: `createAbility`.
- Data flow: authenticated admin/staff session -> `AdminAbility.canManageCourses` -> procedure access allowed or denied.

- Location: `src/features/admin-panel/users/_domain/ability.ts:7-29`
- What it does: `createAdminAbility` sets `canManageCourses` by resolving the stored permission flag for `STAFF`, or `true` for `ADMIN`.
- Dependencies: `SharedSession`, `StaffPermissionFlags`.
- Data flow: session + permission flags -> `AdminAbility` object.

- Location: `src/features/admin-panel/users/_services/staff-permissions.ts:21-42`
- What it does: `StaffPermissionService.getPermissionsForUser` returns role defaults for non-`STAFF`, or reads persisted permissions from `StaffPermissionRepository` for staff users.
- Dependencies: `defaultPermissionsByRole`, `StaffPermissionRepository`.
- Data flow: user id/role -> optional repository lookup -> effective permission flags.

### 5 DI container and router assembly
- Location: `src/features/admin-panel/workouts/module.ts:6-9`
- What it does: `AdminWorkoutsModule` binds `Controller` to `AdminWorkoutsController` in the Inversify container.
- Dependencies: `ContainerModule`, `Controller`, `AdminWorkoutsController`.
- Data flow: module load -> container binding -> controller becomes discoverable by `server.getAll(Controller)`.

- Location: `src/kernel/lib/next-auth/module.ts:7-12`
- What it does: `NextAuthModule` binds `NextAuthConfig`, `SessionService`, and also binds `Controller` to `AuthCredentialsController`.
- Dependencies: `ContainerModule`, `Controller`, `AuthCredentialsController`.
- Data flow: module load -> auth services and auth controller bindings become available in the shared container.

- Location: `src/kernel/lib/trpc/module.ts:18-21`
- What it does: `TrpcModule` binds `ContextFactory` into the container.
- Dependencies: `ContainerModule`, `ContextFactory`.
- Data flow: module load -> `ContextFactory` instance is available for the route handler.

- Location: `src/app/server.ts:32-67`
- What it does: `createServer()` constructs a new `Container`, loads all feature/entity/kernel modules, including `NextAuthModule`, `TrpcModule`, `WorkoutEntityModule`, and `AdminWorkoutsModule`, and exports the resulting `server`.
- Dependencies: `Container`, all imported modules.
- Data flow: app startup -> `container.load(...)` -> registered bindings available to route handlers and server-side resolution.

- Location: `src/app/api/trpc/[trpc]/route.ts:10-18`
- What it does: The tRPC route resolves all bound `Controller` instances from the shared container, merges their routers with `t.mergeRouters(sharedRouter, ...routers)`, and uses `server.get(ContextFactory).createContext` as `createContext`.
- Dependencies: `server`, `Controller`, `sharedRouter`, `t`, `ContextFactory`, `fetchRequestHandler`.
- Data flow: incoming `/api/trpc` request -> merged router resolution -> procedure execution with shared context.

### 6 Data model and repositories
- Location: `prisma/schema.prisma:357-383`
- What it does: The `Workout` model stores `equipment` as `String[]` and also contains `difficulty`, `description`, `videoId`, `muscles`, `section`, `subsections`, `durationSec`, `poster`, `posterUrl`, `progress`, `needsReview`, `manuallyEdited`, and `lastSyncedAt`.
- Dependencies: Prisma enums `WorkoutDifficulty`, `MuscleGroup`, `WorkoutSection`, `WorkoutSubsection`; relations to daily plan, favorite, and completion models.
- Data flow: Prisma row in `Workout` table -> loaded into controllers/repositories -> serialized into DTOs for UI.

- Location: `prisma/migrations/20250718120959_daily_plan/migration.sql:68-80`
- What it does: The initial `Workout` table migration created the `equipment` column as `TEXT[]`.
- Dependencies: PostgreSQL table creation in the migration.
- Data flow: migration execution -> database schema includes array-backed `equipment`.

- Location: `prisma/migrations/20250718121000_add_workout_review_flags/migration.sql:1-5`
- What it does: Adds `needsReview`, `manuallyEdited`, and `lastSyncedAt` columns to `Workout`.
- Dependencies: existing `Workout` table.
- Data flow: migration execution -> admin sync/edit status fields become available.

- Location: `prisma/migrations/20251031123116_add_warmup_section_subsections/migration.sql:7-15`
- What it does: Adds `WorkoutSection`, `WorkoutSubsection`, the `section` column, and the `subsections` array column to `Workout`.
- Dependencies: existing `Workout` table.
- Data flow: migration execution -> category fields become available for admin edit flow.

- Location: `prisma/migrations/20250819101353_replace_video_url_to_video_id_in_workout/migration.sql:7-9`
- What it does: Replaces `videoUrl` with `videoId` on `Workout`.
- Dependencies: existing `Workout` table.
- Data flow: migration execution -> controller and UI use `videoId`.

- Location: `prisma/migrations/20250822124922_add_duration_sec/migration.sql:7-10`
- What it does: Replaces `durationMinutes` with `durationSec` and adds `posterUrl`.
- Dependencies: existing `Workout` table.
- Data flow: migration execution -> controller list/detail payloads expose `durationSec` and `posterUrl`.

- Location: `src/entities/workout/_repositories/workout.ts:30-47`
- What it does: `WorkoutRepository.mapPrismaWorkoutToDomain` maps `prismaWorkout.equipment` into the domain `Workout` type unchanged.
- Dependencies: `dbClient`, `PosterSchema`, Prisma `Workout`.
- Data flow: Prisma `Workout` -> domain `Workout`.

- Location: `src/entities/workout/_domain/types.ts:8-21`
- What it does: The domain `Workout` type declares `equipment: string[]`.
- Dependencies: Prisma enum imports.
- Data flow: repository output -> typed service/controller consumption.

### 7 Existing equipment catalog usage
- Location: `src/shared/lib/equipment.ts:13-81`
- What it does: `equipmentItems` defines the shared equipment catalog as an array of objects with `id`, `title`, optional `image`, `description`, `replacement`, and `buy`.
- Dependencies: local `EquipmentItem` type in `src/shared/lib/equipment.ts:1-11`.
- Data flow: static in-repo constant -> imported by site UI components.

- Location: `src/app/(site)/equipment/page.tsx:25-72`
- What it does: `EquipmentPage` maps over all `equipmentItems` and renders cards for each item.
- Dependencies: `equipmentItems`, `AppImage`, `Card`, `Link`.
- Data flow: `equipmentItems` constant -> UI card list on the public page.

- Location: `src/app/(site)/courses/_ui/blocks/equipment-block.tsx:14-18`
- What it does: `EquipmentBlockComponent` starts with the full `equipmentItems` list, then filters it by `itemIds` when the block receives `itemIds`.
- Dependencies: `EquipmentBlock` type, `equipmentItems`, shared UI components.
- Data flow: `itemIds` from course page content -> filtered `equipmentItems` -> rendered equipment cards.

### 8 Client transport and caching
- Location: `src/features/admin-panel/workouts/_api.ts:5-9`
- What it does: `adminWorkoutsApi` is the typed React Query tRPC client created from `createApi<AdminWorkoutsController['router']>()`, and `adminWorkoutsHttpApi` is the typed non-React client created from `createHttpApi`.
- Dependencies: `createApi`, `createHttpApi`, `AdminWorkoutsController`.
- Data flow: controller router type -> typed client hooks and HTTP client types.

- Location: `src/kernel/lib/trpc/client.ts:7-21`
- What it does: `sharedApi` is the shared tRPC React client, and both client factories point to `${publicConfig.PUBLIC_URL}/api/trpc` via `httpBatchLink`.
- Dependencies: `@trpc/client`, `@trpc/react-query`, `publicConfig`.
- Data flow: client hook invocation -> HTTP batch link -> `/api/trpc`.

- Location: `src/app/_providers/app-provider.tsx:14-41`
- What it does: `AppProvider` creates a `QueryClient`, creates a tRPC client with `sharedApi.createClient`, and provides both via `sharedApi.Provider` and `QueryClientProvider`.
- Dependencies: `QueryClient`, `sharedApi`, `httpBatchLink`, `publicConfig`, `AppSessionProvider`.
- Data flow: app bootstrap -> React Query client + tRPC client providers -> hook-based query/mutation usage in client components.

- Location: `docs/caching-strategy.md:5-27`
- What it does: The project-level caching document states three cache classes (`FREQUENT_UPDATE`, `RARE_UPDATE`, `STATIC`), server-update invalidation, navigation-based refresh, explicit user refresh, and grouped cache invalidation.
- Dependencies: references `src/shared/lib/cache/cache-constants.ts` and `src/shared/lib/cache/cache-invalidation.ts`.
- Data flow: documented cache policy -> implementation files for shared cache settings and invalidation helpers.

- Location: `src/shared/lib/cache/cache-constants.ts:10-37`
- What it does: Defines `CACHE_SETTINGS` entries for `FREQUENT_UPDATE`, `RARE_UPDATE`, and `STATIC`.
- Dependencies: local `CacheSettings` type.
- Data flow: imported cache presets -> React Query option reuse where applied.

- Location: `src/shared/lib/cache/cache-invalidation.ts:9-37`
- What it does: Defines `CACHE_GROUPS` and `invalidateCacheGroup`, which calls `queryClient.invalidateQueries({ queryKey: [key] })` for each key in a group.
- Dependencies: `queryClient`.
- Data flow: cache group name -> list of query keys -> React Query invalidation calls.

- Location: `src/features/admin-panel/workouts/admin-workouts-page.tsx:71-85`
- What it does: After successful workout sync, the page calls `utils.adminWorkouts.workouts.list.invalidate()`.
- Dependencies: `adminWorkoutsApi.useUtils()`, `toast`.
- Data flow: successful sync mutation -> invalidate workouts list query -> list refetch on next query cycle.

- Location: `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:65-76`
- What it does: After successful workout upsert, the dialog calls `utils.adminWorkouts.workouts.list.invalidate()`.
- Dependencies: `adminWorkoutsApi.useUtils()`, `toast`.
- Data flow: successful upsert mutation -> invalidate workouts list query -> list refetch on next query cycle.

### 9 Storage integrations present in the codebase
- Location: `src/shared/lib/file-storage/_model/create-storage.ts:4-10`
- What it does: `createFileStorage()` returns `MinioStorage` when `NODE_ENV === 'development'`; otherwise it returns `SupabaseStorage`.
- Dependencies: `MinioStorage`, `SupabaseStorage`.
- Data flow: runtime environment -> storage provider instance selection.

- Location: `src/shared/lib/file-storage/_providers/minio.ts:16-25`
- What it does: `MinioStorage` constructs an AWS `S3Client` with `forcePathStyle: true`, `privateConfig.S3_ENDPOINT`, `privateConfig.S3_REGION`, and S3 credentials.
- Dependencies: `privateConfig`, `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`.
- Data flow: configured env vars -> S3-compatible client for dev storage access.

- Location: `src/shared/lib/file-storage/_providers/minio.ts:201-216`
- What it does: `resolveBucket` uses `S3_PRIVATE_BUCKET`/`S3_PUBLIC_BUCKET`, or falls back to `S3_IMAGES_BUCKET`.
- Dependencies: `privateConfig`.
- Data flow: requested access level -> selected S3 bucket name.

- Location: `src/shared/config/private.ts:19-31`
- What it does: `privateConfig` requires S3 credentials and endpoint variables and also defines Supabase storage variables.
- Dependencies: `zod`.
- Data flow: `process.env` -> validated private configuration object.

- Location: `src/shared/config/public.ts:16-24`
- What it does: `publicConfig` reads `NEXT_PUBLIC_PUBLIC_URL`, `NEXT_PUBLIC_IMAGE_URL`, and `NEXT_PUBLIC_SUPABASE_IMAGE_BUCKET || 'images'`.
- Dependencies: `zod`.
- Data flow: `process.env` -> validated public runtime configuration object used by tRPC client and image helpers.

## Data flow map (as-is)
Admin route `src/app/(admin)/admin/workouts/page.tsx:1-4` -> `AdminWorkoutsPage` list and dialog state in `src/features/admin-panel/workouts/admin-workouts-page.tsx:18-179` -> `adminWorkoutsApi` hooks in `src/features/admin-panel/workouts/_api.ts:5-9` -> tRPC HTTP client in `src/kernel/lib/trpc/client.ts:7-21` -> `/api/trpc` handler in `src/app/api/trpc/[trpc]/route.ts:12-18` -> merged `AdminWorkoutsController.router` in `src/features/admin-panel/workouts/_controller.ts:354-386` -> `checkAbilityProcedure` / `authorizedProcedure` in `src/kernel/lib/trpc/_procedure.ts:11-42` -> session from `ContextFactory` and `SessionService` in `src/kernel/lib/trpc/_context-factory.ts:8-14` and `src/kernel/lib/next-auth/_session-service.ts:8-10` -> `upsertWorkout` in `src/features/admin-panel/workouts/_controller.ts:313-351` -> `dbClient.workout.update/create` in `src/features/admin-panel/workouts/_controller.ts:331-347` -> Prisma `Workout.equipment` array in `prisma/schema.prisma:357-383` -> `mapDetail` response in `src/features/admin-panel/workouts/_controller.ts:107-115` -> dialog state in `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:93-109`.

For the site equipment catalog, `equipmentItems` in `src/shared/lib/equipment.ts:13-81` flows into `EquipmentPage` in `src/app/(site)/equipment/page.tsx:25-72` and `EquipmentBlockComponent` in `src/app/(site)/courses/_ui/blocks/equipment-block.tsx:14-18`.

## Data & schema (as-is)
- Prisma models involved: `Workout` stores `equipment: String[]` in `prisma/schema.prisma:357-383`.
- Prisma models involved: `StaffPermission` stores `canManageCourses` used in admin authorization in `prisma/schema.prisma:526-539`.
- Constraints: `Workout` has a primary key on `id` through `@id @default(cuid())` in `prisma/schema.prisma:357-358`.
- Constraints: `Workout` has relational references from `DailyPlanMainWorkout`, `DailyPlan`, `UserDailyMainWorkout`, `UserDailyPlan`, `UserFavoriteWorkout`, and `UserWorkoutCompletion` in `prisma/schema.prisma:367-373`.
- Indexes: no dedicated Prisma index is declared on `Workout.equipment` in `prisma/schema.prisma:357-383`.
- Migrations involved: `prisma/migrations/20250718120959_daily_plan/migration.sql:68-80` creates the `Workout` table and `equipment` column.
- Migrations involved: `prisma/migrations/20250718121000_add_workout_review_flags/migration.sql:1-5` adds review/sync state used by the admin workouts controller.
- Migrations involved: `prisma/migrations/20251031123116_add_warmup_section_subsections/migration.sql:7-15` adds sectioning fields used in the admin dialog.
- Migrations involved: `prisma/migrations/20250819101353_replace_video_url_to_video_id_in_workout/migration.sql:7-9` and `prisma/migrations/20250822124922_add_duration_sec/migration.sql:7-10` add fields consumed by the current controller and UI.

## Caching & invalidation (as-is)
- React Query keys used: the admin workouts feature uses generated tRPC query keys through `adminWorkoutsApi.adminWorkouts.workouts.list.useInfiniteQuery` in `src/features/admin-panel/workouts/admin-workouts-page.tsx:37-53` and `adminWorkoutsApi.adminWorkouts.workouts.get.useQuery` in `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:60-63`.
- Invalidations used: `utils.adminWorkouts.workouts.list.invalidate()` runs after successful `sync` in `src/features/admin-panel/workouts/admin-workouts-page.tsx:71-85`.
- Invalidations used: `utils.adminWorkouts.workouts.list.invalidate()` runs after successful `upsert` in `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:65-76`.
- Shared cache policy: `docs/caching-strategy.md:5-27` defines the documented cache categories and invalidation rules.
- Shared query key grouping: `src/shared/lib/cache/cache-invalidation.ts:9-37` defines `CACHE_GROUPS` and invalidates keys with `queryClient.invalidateQueries`.

## Error handling (as-is)
- `UNAUTHORIZED`: `authorizedProcedure` throws `TRPCError({ code: 'UNAUTHORIZED' })` when there is no session in `src/kernel/lib/trpc/_procedure.ts:11-20`.
- `FORBIDDEN`: `checkAbilityProcedure` throws `TRPCError({ code: 'FORBIDDEN' })` when the ability check fails in `src/kernel/lib/trpc/_procedure.ts:29-34`.
- `FORBIDDEN`: `AdminWorkoutsController.ensureAdmin` throws `TRPCError({ code: 'FORBIDDEN' })` for roles other than `ADMIN` or `STAFF` in `src/features/admin-panel/workouts/_controller.ts:72-78`.
- `NOT_FOUND`: `getWorkout` throws `TRPCError({ code: 'NOT_FOUND', message: 'Тренировка не найдена' })` when `dbClient.workout.findFirst` returns no row in `src/features/admin-panel/workouts/_controller.ts:117-130`.
- Client toast reporting: the edit dialog shows `toast('Ошибка сохранения', { description: error?.message })` on mutation error in `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:72-74`.
- Client toast reporting: the workouts page shows `toast('Ошибка синхронизации', { description: error?.message })` on sync error in `src/features/admin-panel/workouts/admin-workouts-page.tsx:82-84`.
- Sync loop error collection: `syncFromKinescope` collects stringified per-video errors in `result.errors` and logs them with `console.error` / `console.warn` in `src/features/admin-panel/workouts/_controller.ts:189-241`.

## Security surface (as-is, facts only)
- authn: tRPC session context is created through `ContextFactory.createContext` and `SessionService.get()` in `src/kernel/lib/trpc/_context-factory.ts:8-14` and `src/kernel/lib/next-auth/_session-service.ts:8-10`.
- authn: NextAuth uses JWT sessions in `src/kernel/lib/next-auth/_next-auth-config.ts:27-30`.
- authz: admin workout procedures require an authenticated session and pass through `checkAbilityProcedure` in `src/features/admin-panel/workouts/_controller.ts:357-383` and `src/kernel/lib/trpc/_procedure.ts:22-42`.
- authz: the specific permission gate is `ability.canManageCourses` in `src/features/admin-panel/workouts/_controller.ts:357-383`, with the flag computed in `src/features/admin-panel/users/_domain/ability.ts:15-29` and sourced for staff users in `src/features/admin-panel/users/_services/staff-permissions.ts:21-42`.
- IDOR boundaries: `adminWorkouts.workouts.get` loads by arbitrary `id` via `dbClient.workout.findFirst({ where: { id: input.id } })`, and access control is enforced at the route level by `checkAbilityProcedure`, not by per-record ownership logic, in `src/features/admin-panel/workouts/_controller.ts:117-130` and `src/features/admin-panel/workouts/_controller.ts:363-371`.
- IDOR boundaries: `adminWorkouts.workouts.upsert` updates by `input.id` or by first matching `videoId`, with the same route-level `canManageCourses` gate, in `src/features/admin-panel/workouts/_controller.ts:329-349` and `src/features/admin-panel/workouts/_controller.ts:372-377`.
- file upload/download flows: no file upload or download flow is present in the inspected admin workout feature files; storage integrations exist in shared utilities rather than in the current admin workout controller and dialog files inspected here (`src/shared/lib/file-storage/_model/create-storage.ts:4-10`, `src/shared/lib/file-storage/_providers/minio.ts:16-216`).

## Dependencies (as-is)
- Internal modules: admin workout feature depends on `src/kernel/lib/trpc/module.ts:4-23`, `src/kernel/lib/trpc/client.ts:7-21`, `src/kernel/lib/next-auth/_session-service.ts:5-10`, `src/features/admin-panel/users/_domain/ability.ts:7-29`, `src/features/admin-panel/users/_services/staff-permissions.ts:15-44`, and `src/shared/lib/db.ts:7-19`.
- Internal modules: site equipment rendering depends on `src/shared/lib/equipment.ts:13-81`.
- External services/packages: tRPC (`@trpc/server`, `@trpc/client`, `@trpc/react-query`) in `src/kernel/lib/trpc/_procedure.ts:2-4`, `src/kernel/lib/trpc/client.ts:1-4`, and `src/app/api/trpc/[trpc]/route.ts:8`.
- External services/packages: NextAuth (`next-auth`, providers, `@auth/prisma-adapter`) in `src/kernel/lib/next-auth/_session-service.ts:1-2` and `src/kernel/lib/next-auth/_next-auth-config.ts:1-18`.
- External services/packages: Prisma (`@prisma/client`) in `src/features/admin-panel/workouts/_controller.ts:2`, `src/shared/lib/db.ts:1`, and `prisma/schema.prisma:7-15`.
- External services/packages: Inversify container wiring in `src/app/server.ts:8`, `src/features/admin-panel/workouts/module.ts:1-9`, and `src/kernel/lib/trpc/module.ts:1-21`.
- External services/packages: Kinescope API client through `listKinescopeVideos` in `src/features/admin-panel/workouts/_controller.ts:4-8` and `src/features/admin-panel/workouts/_controller.ts:189-241`.
- External services/packages: S3-compatible dev storage through AWS SDK in `src/shared/lib/file-storage/_providers/minio.ts:1-8`.

## Open questions
- No server-side code inspected in this research maps workout `equipment` values to `equipmentItems.id` values. The inspected admin workout validation accepts trimmed strings in `src/features/admin-panel/workouts/_schemas.ts:9-19`, and the inspected admin UI submits comma-split strings in `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx:112-130`. If another uninspected path normalizes these values, it was not visible in the files inspected for this document.
- The current admin workouts route inspected is edit-oriented (`WorkoutEditDialog` is opened with an existing `workoutId` in `src/features/admin-panel/workouts/admin-workouts-page.tsx:87-90`). A separate dedicated "create workout" page or dialog was not identified in the files inspected for this feature.

## Files inspected
- `docs/ai/commands/research-codebase.md`
- `docs/ai/features/workout-equipment/00-brief.md`
- `docs/caching-strategy.md`
- `src/app/server.ts`
- `src/app/_providers/app-provider.tsx`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/(admin)/admin/workouts/page.tsx`
- `src/app/(site)/equipment/page.tsx`
- `src/app/(site)/courses/_ui/blocks/equipment-block.tsx`
- `src/features/admin-panel/workouts/module.ts`
- `src/features/admin-panel/workouts/_api.ts`
- `src/features/admin-panel/workouts/_controller.ts`
- `src/features/admin-panel/workouts/_schemas.ts`
- `src/features/admin-panel/workouts/admin-workouts-page.tsx`
- `src/features/admin-panel/workouts/_ui/workout-edit-dialog.tsx`
- `src/features/admin-panel/users/_domain/ability.ts`
- `src/features/admin-panel/users/_services/staff-permissions.ts`
- `src/entities/workout/module.ts`
- `src/entities/workout/_repositories/workout.ts`
- `src/entities/workout/_domain/types.ts`
- `src/kernel/lib/trpc/module.ts`
- `src/kernel/lib/trpc/_controller.ts`
- `src/kernel/lib/trpc/_procedure.ts`
- `src/kernel/lib/trpc/_context-factory.ts`
- `src/kernel/lib/trpc/client.ts`
- `src/kernel/lib/next-auth/module.ts`
- `src/kernel/lib/next-auth/_session-service.ts`
- `src/kernel/lib/next-auth/_next-auth-config.ts`
- `src/kernel/lib/next-auth/client.tsx`
- `src/shared/lib/equipment.ts`
- `src/shared/lib/db.ts`
- `src/shared/lib/cache/cache-constants.ts`
- `src/shared/lib/cache/cache-invalidation.ts`
- `src/shared/lib/file-storage/_model/create-storage.ts`
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/config/private.ts`
- `src/shared/config/public.ts`
- `prisma/schema.prisma`
- `prisma/migrations/20250718120959_daily_plan/migration.sql`
- `prisma/migrations/20250718121000_add_workout_review_flags/migration.sql`
- `prisma/migrations/20250819101353_replace_video_url_to_video_id_in_workout/migration.sql`
- `prisma/migrations/20250822124922_add_duration_sec/migration.sql`
- `prisma/migrations/20251031123116_add_warmup_section_subsections/migration.sql`
