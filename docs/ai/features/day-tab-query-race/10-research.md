---
date: 2026-03-13
researcher: Codex
branch: perf/3g
commit: 603b960
feature: day-tab-query-race
research_question: "How does the current day page implementation load day tabs, daily plans, workouts, and Kinescope player content, and where do request cancellation, stale-response handling, query caching, logging, and player mounting currently occur?"
---

# Research: day-tab-query-race

## Summary
The paid day page is served from a Next.js route that creates a tRPC context through the shared Inversify container, resolves the current session, and preloads course access, enrollment, available weeks, and one initial daily plan into a React Query dehydration payload before rendering the client shell. This bootstrap path starts in [`src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx#L41), uses `ContextFactory.createContext()` from [`src/kernel/lib/trpc/_context-factory.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/trpc/_context-factory.ts#L9), and calls `DayPlanLoadService.load()` from [`src/features/daily-plan/_services/day-plan-load.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_services/day-plan-load.ts#L63).

On the client, `DayPageClient` renders `CalendarTabs`, which renders `DayTabs` for the active week. `DayTabs` stores the selected day in local component state and calls `useDailyPlanQuery(enrollmentId, courseId, selectedDayNumberInCourse, shouldFetchDailyPlan)`. That hook issues `workoutApi.getUserDailyPlan.useQuery()` with `{ userId, enrollmentId, courseId, dayNumberInCourse }` and `placeholderData: previousData => previousData`, but no explicit abort or cancellation options are present in the hook, the app-wide tRPC client, or the route bootstrap code. These facts are visible in [`src/features/daily-plan/_ui/day-tabs.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/day-tabs.tsx#L351), [`src/features/daily-plan/_vm/use-daily-plan.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_vm/use-daily-plan.ts#L5), and [`src/app/_providers/app-provider.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/_providers/app-provider.tsx#L47).

Each daily plan entry renders one or more `ExerciseCard` components. `ExerciseCard` independently loads workout details via `useWorkoutQuery(workoutId)`, reads completion state through an imperative async call inside `useEffect`, and mounts `KinescopePlayer` immediately whenever `workout?.videoId` is present. `KinescopePlayer` keeps its own local loading and retry state and remounts the underlying `ReactKinescopePlayer` when `resolvedVideoId` changes or an initialization retry increments `playerInstanceKey`. This behavior is implemented in [`src/features/daily-plan/_ui/exercise-card.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/exercise-card.tsx#L34) and [`src/features/daily-plan/_ui/kinescope-player.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/kinescope-player.tsx#L118).

## Entry points (as-is)
- Next.js routes/pages: [`src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx#L41) bootstraps session-aware server data and hydrates React Query state for the paid day page.
- Next.js routes/pages: [`src/app/platform/(app-shell)/(paid)/day/[courseSlug]/day-page-client.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/platform/(app-shell)/(paid)/day/[courseSlug]/day-page-client.tsx#L20) resolves access state on the client and renders `CalendarTabs`.
- tRPC procedures/routers: [`src/features/daily-plan/_controller.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_controller.ts#L63) exposes `getUserDailyPlan`, `getWorkout`, `getWorkoutCompletionStatus`, `updateWorkoutCompletion`, and favorite-workout procedures.
- tRPC procedures/routers: [`src/features/course-enrollment/_controller.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/course-enrollment/_controller.ts#L68) exposes `checkAccessByCourseSlug`, `getEnrollmentByCourseSlug`, `getEnrollment`, and `getAvailableWeeks`, which are consumed by the day page.
- UI components: [`src/features/daily-plan/_ui/calendar-tabs.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/calendar-tabs.tsx#L31) renders week navigation and conditionally mounts `DayTabs` only for the active week.
- UI components: [`src/features/daily-plan/_ui/day-tabs.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/day-tabs.tsx#L258) manages active day selection and daily plan query execution.
- UI components: [`src/features/daily-plan/_ui/exercise-card.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/exercise-card.tsx#L34) renders workout details, completion controls, favorites, and the video player.
- UI components: [`src/features/daily-plan/_ui/kinescope-player.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/kinescope-player.tsx#L118) wraps `@kinescope/react-kinescope-player` with retry and watched-threshold logic.

## Detailed findings
### 1. Server bootstrap, DI container, and route wiring
- Location: [`src/app/server.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/server.ts#L32)
- What it does: `createServer()` builds a single Inversify `Container`, loads entity and feature modules, and exports it as `server`. The day page relies on `CourseEntityModule`, `NextAuthModule`, `TrpcModule`, `CourseEnrollmentControllerModule`, `DailyPlanModule`, `WorkoutEntityModule`, and `UserAccessModule`, all loaded from this root container.
- Dependencies: `CourseEntityModule`, `NextAuthModule`, `TrpcModule`, `CourseEnrollmentControllerModule`, `DailyPlanModule`, `WorkoutEntityModule`, `UserAccessModule`.
- Data flow: Module list -> `container.load(...)` -> shared `server` singleton -> route/controllers/services resolved from container.

- Location: [`src/features/daily-plan/module.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/module.ts#L7)
- What it does: `DailyPlanModule` binds `GetUserDailyPlanService`, `DayPlanLoadService`, and registers `WorkoutController` under the shared `Controller` token used by the tRPC route.
- Dependencies: `GetUserDailyPlanService`, `DayPlanLoadService`, `WorkoutController`, `Controller`.
- Data flow: Inversify module -> service/controller bindings -> available to route handler and server-side prefetch helpers.

- Location: [`src/app/api/trpc/[trpc]/route.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/api/trpc/[trpc]/route.ts#L10)
- What it does: The tRPC HTTP route reads every bound `Controller`, merges their routers with `t.mergeRouters(sharedRouter, ...routers)`, and creates request context via `server.get(ContextFactory).createContext`.
- Dependencies: `server`, `Controller`, `sharedRouter`, `t`, `ContextFactory`, `fetchRequestHandler`.
- Data flow: HTTP request -> merged tRPC router -> `ContextFactory.createContext()` -> target controller procedure -> response.

- Location: [`src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx#L41)
- What it does: `DayPage` resolves `courseSlug`, creates server-side tRPC helpers for `CourseEnrollmentController`, `CourseDetailsController`, and `WorkoutController`, invokes `DayPlanLoadService.load({ userId, courseSlug })`, manually seeds query data for access, enrollment, available weeks, and initial daily plan with `queryClient.setQueryData`, optionally prefetches course details, dehydrates the query client, and renders `DayPageClient`.
- Dependencies: `server`, `ContextFactory`, `CourseEnrollmentController`, `CourseDetailsController`, `WorkoutController`, `createControllerHelpers`, `DayPlanLoadService`.
- Data flow: route params -> tRPC context/session -> `DayPlanLoadService.load()` -> query cache seeding by `queryOptions().queryKey` -> dehydrated state -> `DayPageClient`.

### 2. Access resolution, week/day selection, and daily plan query execution
- Location: [`src/app/platform/(app-shell)/(paid)/day/[courseSlug]/day-page-client.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/platform/(app-shell)/(paid)/day/[courseSlug]/day-page-client.tsx#L20)
- What it does: `DayPageClient` reads `useAppSession()`, checks paid access from `usePaidAccess()`, optionally falls back to `useCheckAccessByCourseSlugQuery(userId, courseSlug)`, redirects to workout-day setup when access exists but `setupCompleted` is false, and renders `CourseBanner`, `CourseActivationBanner`, and `CalendarTabs`.
- Dependencies: `useAppSession`, `usePaidAccess`, `useCheckAccessByCourseSlugQuery`, `useRouter`, `CourseBanner`, `CourseActivationBanner`, `CalendarTabs`.
- Data flow: session + paid-access context -> optional `checkAccessByCourseSlug` query -> local redirect decision -> page shell rendering.

- Location: [`src/features/daily-plan/_ui/calendar-tabs.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/calendar-tabs.tsx#L31)
- What it does: `CalendarTabs` loads enrollment by slug with `useEnrollmentByCourseSlugQuery`, computes course start date and subscription flag, derives week metadata through `useWorkoutCalendar()`, keeps `weekSelection` and `activeDate` in local state, and renders only the currently active week's `DayTabs` inside `TabsContent`.
- Dependencies: `useEnrollmentByCourseSlugQuery`, `useWorkoutCalendar`, `DayTabs`, Radix-style tabs/dropdown/button components.
- Data flow: `courseSlug` -> enrollment query -> `useWorkoutCalendar(programStart, durationWeeks, courseSlug, isSubscription)` -> active week state -> conditional `MemoizedDayTabs` mount for selected week.

- Location: [`src/features/daily-plan/_vm/use-worckout-calendar.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_vm/use-worckout-calendar.ts#L5)
- What it does: `useWorkoutCalendar()` reads session, calls `useAvailableWeeksQuery(session.user.id, courseSlug)`, and derives `availableWeeks`, `totalWeeks`, `weeksMeta`, `currentWeekIndex`, and `maxDayNumber`. For subscriptions it returns `availableWeeksQuery.isLoading`; for fixed courses it computes a current week based on `programStart`.
- Dependencies: `useAppSession`, `useAvailableWeeksQuery`.
- Data flow: session + course slug -> `course.getAvailableWeeks` query -> derived week/calendar state -> consumed by `CalendarTabs`.

- Location: [`src/features/daily-plan/_ui/day-tabs.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/day-tabs.tsx#L258)
- What it does: `DayTabs` loads enrollment by course id with `useEnrollmentQuery`, builds the seven visible day tabs from enrollment dates and available weeks, keeps `selectedDay` in local `useState`, computes `selectedDayNumberInCourse`, and triggers `useDailyPlanQuery(enrollmentId, courseId, selectedDayNumberInCourse || 1, shouldFetchDailyPlan)`. The query runs when `enrollmentId`, `enrollment`, and `enabled` are truthy.
- Dependencies: `useEnrollmentQuery`, `useAppSession`, `useDailyPlanQuery`, `ExerciseCard`, `Tabs` UI primitives, date-fns helpers.
- Data flow: enrollment query + week props -> `buildDayTabs(...)` -> `selectedDay` state -> `selectedDayNumberInCourse` -> `useDailyPlanQuery(...)` -> `renderDailyPlanContent(...)`.

- Location: [`src/features/daily-plan/_vm/use-daily-plan.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_vm/use-daily-plan.ts#L5)
- What it does: `useDailyPlanQuery()` reads `session.user.id`, builds query input `{ userId, enrollmentId, courseId, dayNumberInCourse }`, and calls `workoutApi.getUserDailyPlan.useQuery()` with `CACHE_SETTINGS.FREQUENT_UPDATE`, `enabled`, and `placeholderData: previousData => previousData`.
- Dependencies: `useAppSession`, `workoutApi`, `CACHE_SETTINGS.FREQUENT_UPDATE`.
- Data flow: hook params + session -> tRPC query input -> React Query cache entry -> data/loading state returned to `DayTabs`.

- Location: [`src/app/_providers/app-provider.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/_providers/app-provider.tsx#L47), [`src/kernel/lib/trpc/client.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/trpc/client.ts#L12)
- What it does: The app-level tRPC client is created with `httpBatchLink({ url: ${publicConfig.PUBLIC_URL}/api/trpc })`. The shared exported HTTP client uses the same link. No abort-specific option or custom fetch function is configured in these files.
- Dependencies: `QueryClient`, `sharedApi`, `httpBatchLink`, `publicConfig`.
- Data flow: app bootstrap -> `sharedApi.createClient()` / `createTRPCClient()` -> tRPC React hooks send batched HTTP requests to `/api/trpc`.

### 3. Daily plan procedure, repository reads, and workout/player rendering
- Location: [`src/features/daily-plan/_controller.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_controller.ts#L63)
- What it does: `WorkoutController.router` declares `getUserDailyPlan` as an `authorizedProcedure` with zod input `{ userId, enrollmentId, courseId, dayNumberInCourse }` and delegates to `getUserDailyPlanService.exec(...)`. The same controller also exposes `getWorkout`, `getWorkoutCompletionStatus`, and `updateWorkoutCompletion`.
- Dependencies: `authorizedProcedure`, `router`, `GetUserDailyPlanService`, `GetWorkoutService`, `GetWorkoutCompletionStatusService`, `UpdateWorkoutCompletionService`, `TRPCError`, `logger`.
- Data flow: tRPC input validation -> controller method -> service execution -> tRPC response.

- Location: [`src/features/daily-plan/_services/get-user-daily-plan.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_services/get-user-daily-plan.ts#L38)
- What it does: `GetUserDailyPlanService.exec()` optionally resolves course data with `GetCourseService`, checks access with `CheckCourseAccessService.exec({ userId, course })`, fetches the daily plan from `UserDailyPlanRepository.getUserDailyPlanByEnrollment({ enrollmentId, dayNumberInCourse })`, logs success through `logger.info`, and on any caught exception logs and throws `new Error('Failed to get user daily plan')`.
- Dependencies: `UserDailyPlanRepository`, `GetCourseService`, `CheckCourseAccessService`, `logger`.
- Data flow: `{ userId, enrollmentId, courseId, dayNumberInCourse }` -> course lookup/access check -> repository read by enrollment/day number -> `UserDailyPlan | null` or thrown error.

- Location: [`src/entities/course/_repositories/user-daily-plan.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/entities/course/_repositories/user-daily-plan.ts#L131)
- What it does: `getUserDailyPlanByEnrollment()` runs `db.userDailyPlan.findFirst({ where: { enrollmentId, dayNumberInCourse }, include: { mainWorkouts: true } })` and maps Prisma rows to the domain type with `id`, `warmupId`, `warmupStepIndex`, `isWorkoutDay`, and `mainWorkouts[]`.
- Dependencies: `dbClient`, Prisma `userDailyPlan`, local `toDomain()`.
- Data flow: `enrollmentId + dayNumberInCourse` -> Prisma query -> domain plan object -> service/controller response.

- Location: [`src/features/daily-plan/_ui/day-tabs.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/day-tabs.tsx#L210)
- What it does: `renderDailyPlanContent()` renders skeletons when `isLoading && !plan`, renders "Нет тренировки" when `!enabled || !plan`, and otherwise renders one warmup `ExerciseCard` and zero or more main `ExerciseCard`s using `plan.warmupId`, `plan.warmupStepIndex`, and `plan.mainWorkouts`.
- Dependencies: `ExerciseCard`, `Skeleton`, `DailyContentType`.
- Data flow: daily plan query state -> conditional branch -> list of `ExerciseCard` children.

- Location: [`src/features/daily-plan/_ui/exercise-card.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/exercise-card.tsx#L34)
- What it does: `ExerciseCard` keeps `isCompleted` and `isVideoPlaying` in local state, loads workout details with `useWorkoutQuery(workoutId)`, retrieves completion status by calling `getWorkoutCompletionStatus(...)` inside `useEffect`, toggles completion through `updateWorkoutCompletion(...)`, and renders `KinescopePlayer` immediately when `workout?.videoId` exists.
- Dependencies: `useWorkoutQuery`, `useWorkoutCompletions`, `useWorkoutFavorites`, `KinescopePlayer`, `FavoriteButton`, `toast`, `TRPCClientError`.
- Data flow: `workoutId/enrollmentId/contentType/stepIndex` props -> workout query + imperative completion fetch -> local state updates -> card UI -> optional `KinescopePlayer`.

- Location: [`src/features/daily-plan/_vm/use-workout.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_vm/use-workout.ts#L4), [`src/entities/workout/_repositories/workout.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/entities/workout/_repositories/workout.ts#L49)
- What it does: `useWorkoutQuery(workoutId)` calls `workoutApi.getWorkout.useQuery({ workoutId }, CACHE_SETTINGS.FREQUENT_UPDATE)`. On the server, `WorkoutRepository.getWorkoutById(id)` reads `dbClient.workout.findUnique({ where: { id } })` and maps `videoId`, `durationSec`, `poster`, and `posterUrl`.
- Dependencies: `workoutApi`, `CACHE_SETTINGS`, `WorkoutRepository`, Prisma `workout`.
- Data flow: `workoutId` -> tRPC query -> repository read -> workout DTO -> `ExerciseCard`.

- Location: [`src/features/daily-plan/_ui/kinescope-player.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/kinescope-player.tsx#L118)
- What it does: `KinescopePlayer` derives `resolvedVideoId` from `videoId` or `options.url`, resets internal refs and state when `resolvedVideoId` changes, retries initialization up to `MAX_INIT_RETRIES` by incrementing `playerInstanceKey`, reports watched state after `WATCHED_PERCENT_THRESHOLD`, and renders `<ReactKinescopePlayer key={\`${resolvedVideoId}-${playerInstanceKey}\`}>`.
- Dependencies: `@kinescope/react-kinescope-player`, `Skeleton`, `cn`.
- Data flow: `videoId/options` props -> `resolvedVideoId` -> internal loading/retry state -> `ReactKinescopePlayer` mount -> ready/error/time-update callbacks -> parent callbacks.

### 4. Completion state, auth/session, caching policy, schema, and storage integrations
- Location: [`src/features/daily-plan/_vm/use-workout-completions.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_vm/use-workout-completions.ts#L8)
- What it does: `useWorkoutCompletions()` exposes an imperative `getWorkoutCompletionStatus(...)` helper that first checks Zustand state through `useWorkoutCompletionStore.getState()`, then calls `utils.getWorkoutCompletionStatus.fetch(queryKey, { staleTime, gcTime })`, stores the result in Zustand, and catches errors with `console.error(...)`. It also exposes `updateWorkoutCompletion()` backed by `workoutApi.updateWorkoutCompletion.useMutation(...)` and invalidates the exact completion query on success.
- Dependencies: `workoutApi.useUtils()`, `useWorkoutCompletionStore`, `createCompletionKey`.
- Data flow: completion lookup arguments -> Zustand read -> imperative tRPC fetch -> Zustand write -> boolean returned to `ExerciseCard`.

- Location: [`src/kernel/lib/trpc/_procedure.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/trpc/_procedure.ts#L11), [`src/kernel/lib/trpc/_context-factory.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/trpc/_context-factory.ts#L9), [`src/kernel/lib/next-auth/_session-service.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/next-auth/_session-service.ts#L5)
- What it does: `authorizedProcedure` only checks that `ctx.session` exists and then forwards the session in context. `ContextFactory.createContext()` gets the session through `SessionService.get()`, which calls `getServerSession(this.nextAuthConfig.options)`.
- Dependencies: `SessionService`, `getServerSession`, `TRPCError`.
- Data flow: request -> NextAuth session lookup -> tRPC context -> `authorizedProcedure` session presence check -> controller execution.

- Location: [`src/features/course-enrollment/_controller.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/course-enrollment/_controller.ts#L138), [`src/features/daily-plan/_controller.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_controller.ts#L64)
- What it does: Several read procedures on the day-page path accept `userId` as part of input (`getEnrollment`, `getEnrollmentByCourseSlug`, `checkAccessByCourseSlug`, `getAvailableWeeks`, `getUserDailyPlan`, `getWorkoutCompletionStatus`) and pass that input into downstream services. Favorite-workout procedures use `ctx.session.user.id` directly instead of reading a `userId` input.
- Dependencies: `authorizedProcedure`, course-enrollment services, daily-plan services.
- Data flow: client-supplied input object -> zod validation -> controller -> service/repository calls.

- Location: [`docs/caching-strategy.md`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/docs/caching-strategy.md#L3), [`src/shared/lib/cache/cache-constants.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/cache/cache-constants.ts#L10), [`src/shared/lib/cache/cache-invalidation.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/cache/cache-invalidation.ts#L9)
- What it does: Project documentation states that client caching uses React Query with frequency-based cache classes and group invalidation. `CACHE_SETTINGS.FREQUENT_UPDATE` sets `staleTime: 1 minute`, `gcTime: 5 minutes`, `refetchOnMount: 'always'`, `refetchOnWindowFocus: false`, and `refetchOnReconnect: false`. `CACHE_GROUPS.WORKOUT_DATA` lists `workoutCompletionStatus`, `userDailyPlan`, `enrollment`, `enrollmentByCourseSlug`, and `workout`.
- Dependencies: React Query `QueryClient`, shared cache constants.
- Data flow: hook options -> React Query cache behavior -> optional invalidation through `invalidateCacheGroup()` or procedure-specific utils invalidation.

- Location: [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L241), [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L317), [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L342), [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L357)
- What it does: `UserCourseEnrollment` stores `selectedWorkoutDays` and `startDate`; `UserDailyPlan` stores `enrollmentId`, `dayNumberInCourse`, `weekNumber`, `dayOfWeek`, `warmupId`, `warmupStepIndex`, and related `mainWorkouts`; `UserDailyMainWorkout` stores `workoutId`, `order`, and `stepIndex`; `Workout` stores `videoId`, `durationSec`, `poster`, `posterUrl`, and `progress`.
- Dependencies: Postgres tables managed through Prisma.
- Data flow: enrollment metadata -> generated `UserDailyPlan` rows -> `UserDailyMainWorkout` rows -> workout lookups and player rendering.

- Location: [`prisma/migrations/20250718120959_daily_plan/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20250718120959_daily_plan/migration.sql#L53), [`prisma/migrations/20250807084353_add_user_daily_plan_fields/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20250807084353_add_user_daily_plan_fields/migration.sql#L9), [`prisma/migrations/20250806131510_day_number_in_course/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20250806131510_day_number_in_course/migration.sql#L7), [`prisma/migrations/20251029100423_daily_content_steps/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20251029100423_daily_content_steps/migration.sql#L24), [`prisma/migrations/20250819101353_replace_video_url_to_video_id_in_workout/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20250819101353_replace_video_url_to_video_id_in_workout/migration.sql#L7), [`prisma/migrations/20250822111404_add_kinescope_video_metadata/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20250822111404_add_kinescope_video_metadata/migration.sql#L7)
- What it does: migrations show the introduction of `DailyPlan`, later `UserDailyPlan` fields `dayOfWeek`, `originalDailyPlanId`, and `weekNumber`, the unique index on `(enrollmentId, dayNumberInCourse)`, step-based completion fields `contentType` and `stepIndex`, and the switch from `Workout.videoUrl` to `Workout.videoId` plus later Kinescope metadata columns.
- Dependencies: Prisma migrations in `prisma/migrations/**`.
- Data flow: schema migrations -> current table/index shape used by repositories and controllers.

- Location: [`src/shared/lib/file-storage/_model/create-storage.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/file-storage/_model/create-storage.ts#L4), [`src/shared/lib/file-storage/_providers/minio.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/file-storage/_providers/minio.ts#L17), [`src/shared/lib/file-storage/_providers/supabase.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/file-storage/_providers/supabase.ts#L12), [`src/shared/config/private.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/config/private.ts#L19), [`src/shared/config/kinescope.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/config/kinescope.ts#L1), [`src/shared/lib/kinescope/client.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/kinescope/client.ts#L28)
- What it does: `createFileStorage()` returns `MinioStorage` when `NODE_ENV === 'development'` and `SupabaseStorage` otherwise. `MinioStorage` uses AWS S3-compatible credentials from `privateConfig.S3_*`; `SupabaseStorage` uses `privateConfig.SUPABASE_*`. Kinescope API access uses `KINESCOPE_API_KEY`, `KINESCOPE_PROJECT_ID`, and optional `KINESCOPE_KNOWLEDGE_FOLDER_ID`. `listKinescopeVideos()` fetches `https://api.kinescope.io/v1/videos` with bearer auth and `cache: 'no-store'`.
- Dependencies: `@aws-sdk/client-s3`, `@aws-sdk/lib-storage`, `@supabase/supabase-js`, environment config, Kinescope API.
- Data flow: env config -> selected storage provider / Kinescope client -> upload/download or Kinescope API requests.

## Data flow map (as-is)
`DayPage` route -> `ContextFactory.createContext()` -> `SessionService.get()` -> `DayPlanLoadService.load({ userId, courseSlug })` -> `CheckCourseAccessService` / enrollment services / `GetAvailableWeeksService` / `GetUserDailyPlanService` -> `UserDailyPlanRepository.getUserDailyPlanByEnrollment()` -> React Query dehydration in [`page.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx#L84) -> `DayPageClient` -> `CalendarTabs` -> `DayTabs` local `selectedDay` state -> `useDailyPlanQuery()` -> `workoutApi.getUserDailyPlan.useQuery()` -> `WorkoutController.getUserDailyPlan` -> `GetUserDailyPlanService.exec()` -> `UserDailyPlanRepository.getUserDailyPlanByEnrollment()` -> `renderDailyPlanContent()` -> one or more `ExerciseCard` components -> `useWorkoutQuery(workoutId)` -> `WorkoutController.getWorkout` -> `WorkoutRepository.getWorkoutById()` -> `KinescopePlayer` -> `ReactKinescopePlayer`.

Additional completion-state flow: `ExerciseCard.useEffect()` -> `useWorkoutCompletions().getWorkoutCompletionStatus(...)` -> `workoutApi.useUtils().getWorkoutCompletionStatus.fetch(...)` -> `WorkoutController.getWorkoutCompletionStatus` -> `GetWorkoutCompletionStatusService.exec()` -> `UserWorkoutCompletionRepository.getWorkoutCompletionStatus()` -> boolean stored in Zustand and local card state.

## Data & schema (as-is)
- `UserCourseEnrollment` stores `selectedWorkoutDays`, `startDate`, `active`, and relation to `course` and `userAccesses` in [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L241).
- `UserDailyPlan` stores the per-enrollment/per-day schedule, including `dayNumberInCourse`, `weekNumber`, `dayOfWeek`, `warmupId`, `warmupStepIndex`, `originalDailyPlanId`, and relation to `mainWorkouts` in [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L317).
- `UserDailyMainWorkout` stores `workoutId`, `order`, and `stepIndex` for each main workout entry in [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L342).
- `Workout` stores `videoId`, `durationSec`, `poster`, `posterUrl`, and `progress` in [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L357).
- `UserWorkoutCompletion` stores completion rows keyed by `userId`, `enrollmentId`, `contentType`, `workoutId`, and `stepIndex` in [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L385).
- Constraints:
  - `UserDailyPlan` has `@@unique([enrollmentId, dayNumberInCourse])`, `@@index([enrollmentId])`, and `@@index([userId, date])` in [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L337).
  - `UserDailyMainWorkout` has `@@unique([userDailyPlanId, order])`, `@@index([userDailyPlanId])`, and `@@index([workoutId])` in [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L352).
  - `UserWorkoutCompletion` has `@@unique([userId, enrollmentId, contentType, workoutId, stepIndex])` plus indexes on `userId`, `enrollmentId`, and `workoutId` in [`prisma/schema.prisma`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/schema.prisma#L397).
- Migrations involved:
  - `DailyPlan` introduction in [`prisma/migrations/20250718120959_daily_plan/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20250718120959_daily_plan/migration.sql#L53).
  - `UserDailyPlan` day/week/original-plan fields in [`prisma/migrations/20250807084353_add_user_daily_plan_fields/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20250807084353_add_user_daily_plan_fields/migration.sql#L9).
  - Unique key `(enrollmentId, dayNumberInCourse)` in [`prisma/migrations/20250806131510_day_number_in_course/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20250806131510_day_number_in_course/migration.sql#L7).
  - Step-based completion fields in [`prisma/migrations/20251029100423_daily_content_steps/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20251029100423_daily_content_steps/migration.sql#L24).
  - `Workout.videoId` and later video metadata in [`prisma/migrations/20250819101353_replace_video_url_to_video_id_in_workout/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20250819101353_replace_video_url_to_video_id_in_workout/migration.sql#L7) and [`prisma/migrations/20250822111404_add_kinescope_video_metadata/migration.sql`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/prisma/migrations/20250822111404_add_kinescope_video_metadata/migration.sql#L7).

## Caching & invalidation (as-is)
- `useDailyPlanQuery()` calls `workoutApi.getUserDailyPlan.useQuery({ userId, enrollmentId, courseId, dayNumberInCourse }, { ...CACHE_SETTINGS.FREQUENT_UPDATE, enabled, placeholderData: previousData => previousData })` in [`src/features/daily-plan/_vm/use-daily-plan.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_vm/use-daily-plan.ts#L15).
- `useWorkoutQuery(workoutId)` calls `workoutApi.getWorkout.useQuery({ workoutId }, CACHE_SETTINGS.FREQUENT_UPDATE)` in [`src/features/daily-plan/_vm/use-workout.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_vm/use-workout.ts#L4).
- `useEnrollmentQuery`, `useEnrollmentByCourseSlugQuery`, `useCheckAccessByCourseSlugQuery`, and `useAvailableWeeksQuery` all use `CACHE_SETTINGS.FREQUENT_UPDATE` in [`src/features/course-enrollment/_vm/use-course-enrollment.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/course-enrollment/_vm/use-course-enrollment.ts#L42).
- `CACHE_SETTINGS.FREQUENT_UPDATE` is defined with `staleTime: 60000`, `gcTime: 300000`, `refetchOnMount: 'always'`, `refetchOnWindowFocus: false`, and `refetchOnReconnect: false` in [`src/shared/lib/cache/cache-constants.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/cache/cache-constants.ts#L12).
- `useWorkoutCompletions().getWorkoutCompletionStatus(...)` uses `utils.getWorkoutCompletionStatus.fetch(queryKey, { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 })` and mirrors the result into Zustand state in [`src/features/daily-plan/_vm/use-workout-completions.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_vm/use-workout-completions.ts#L40).
- `useWorkoutCompletions().updateWorkoutCompletion` invalidates the exact `getWorkoutCompletionStatus` query on mutation success in [`src/features/daily-plan/_vm/use-workout-completions.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_vm/use-workout-completions.ts#L67).
- Shared cache grouping lists `userDailyPlan`, `enrollment`, `enrollmentByCourseSlug`, `workout`, and `workoutCompletionStatus` in `CACHE_GROUPS.WORKOUT_DATA` in [`src/shared/lib/cache/cache-invalidation.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/cache/cache-invalidation.ts#L9).
- The server route seeds the client cache for `checkAccessByCourseSlug`, `getEnrollmentByCourseSlug`, `getEnrollment`, `getAvailableWeeks`, and `getUserDailyPlan` with `queryClient.setQueryData(...)` before dehydration in [`src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx#L84).

## Error handling (as-is)
- `GetUserDailyPlanService.exec()` logs any exception with `logger.error({ msg: 'Error fetching user daily plan (feature)', params, error })` and throws `new Error('Failed to get user daily plan')` in [`src/features/daily-plan/_services/get-user-daily-plan.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_services/get-user-daily-plan.ts#L110).
- `WorkoutController.assertHasActiveAccess()` throws `new TRPCError({ code: 'FORBIDDEN', message: 'Нет действующего доступа' })` for favorite-workout operations in [`src/features/daily-plan/_controller.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_controller.ts#L53).
- `ExerciseCard.toggleCompleted()` catches mutation errors, shows `toast.error('Ошибка при обновлении статуса тренировки')`, and logs `console.error('Error updating workout completion status:', error)` in [`src/features/daily-plan/_ui/exercise-card.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/exercise-card.tsx#L121).
- `ExerciseCard` favorite toggling distinguishes `TRPCClientError` with `error.data?.code === 'FORBIDDEN'` and shows a dedicated toast in [`src/features/daily-plan/_ui/exercise-card.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/exercise-card.tsx#L178).
- `useWorkoutCompletions().getWorkoutCompletionStatus()` and `updateWorkoutCompletion()` catch errors and log them with `console.error(...)` in [`src/features/daily-plan/_vm/use-workout-completions.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_vm/use-workout-completions.ts#L40).
- `KinescopePlayer.handlePlayerError()` normalizes the error, optionally retries player initialization before readiness, then calls `onError?.(normalizedError)` after `setIsLoading(false)` in [`src/features/daily-plan/_ui/kinescope-player.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/kinescope-player.tsx#L237).
- No explicit `AbortError`, `CanceledError`, or `abortOnUnmount` handling was found in the inspected day-page hooks, controllers, app-wide tRPC client, or player wrapper files: [`src/features/daily-plan/_vm/use-daily-plan.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_vm/use-daily-plan.ts#L15), [`src/app/_providers/app-provider.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/_providers/app-provider.tsx#L47), [`src/kernel/lib/trpc/client.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/trpc/client.ts#L12), [`src/features/daily-plan/_ui/exercise-card.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/exercise-card.tsx#L81), [`src/features/daily-plan/_ui/kinescope-player.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/kinescope-player.tsx#L118).

## Security surface (as-is, facts only)
- authn: session is read on the server through `SessionService.get()` -> `getServerSession(...)` in [`src/kernel/lib/next-auth/_session-service.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/next-auth/_session-service.ts#L5), inserted into tRPC context by `ContextFactory.createContext()` in [`src/kernel/lib/trpc/_context-factory.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/trpc/_context-factory.ts#L9), and required by `authorizedProcedure` in [`src/kernel/lib/trpc/_procedure.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/trpc/_procedure.ts#L11).
- authz: `checkAccessByCourseSlug` checks access through `CheckCourseAccessService.exec(...)` and reads `UserAccessRepository.findUserCourseAccess(...)` in [`src/features/course-enrollment/_controller.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/course-enrollment/_controller.ts#L172). `GetUserDailyPlanService.exec()` checks access again before reading the plan in [`src/features/daily-plan/_services/get-user-daily-plan.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_services/get-user-daily-plan.ts#L69). Favorite-workout endpoints enforce active access through `assertHasActiveAccess(ctx.session.user.id)` in [`src/features/daily-plan/_controller.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_controller.ts#L131).
- IDOR boundaries: the route-level and query-level code paths use `authorizedProcedure`, but several procedures in the day-page path accept `userId` in input rather than deriving it from `ctx.session.user.id`: `getEnrollment`, `getEnrollmentByCourseSlug`, `checkAccessByCourseSlug`, and `getAvailableWeeks` in [`src/features/course-enrollment/_controller.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/course-enrollment/_controller.ts#L138), plus `getUserDailyPlan` and `getWorkoutCompletionStatus` in [`src/features/daily-plan/_controller.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_controller.ts#L64).
- file upload/download flows: file storage provider selection happens in `createFileStorage()` in [`src/shared/lib/file-storage/_model/create-storage.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/file-storage/_model/create-storage.ts#L4). `MinioStorage` and `SupabaseStorage` both support `uploadFile`, `downloadByPath`, `downloadStreamByPath`, and `deleteByPath` in [`src/shared/lib/file-storage/_providers/minio.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/file-storage/_providers/minio.ts#L28) and [`src/shared/lib/file-storage/_providers/supabase.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/file-storage/_providers/supabase.ts#L18). No upload/download path is used by the inspected day page files.

## Dependencies (as-is)
- Internal modules:
  - `DayPage` depends on `DayPlanLoadService`, `ContextFactory`, and controller helper creation in [`src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx#L3).
  - `CalendarTabs` and `DayTabs` depend on course-enrollment query hooks in [`src/features/daily-plan/_ui/calendar-tabs.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/calendar-tabs.tsx#L15) and [`src/features/daily-plan/_ui/day-tabs.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/day-tabs.tsx#L15).
  - `ExerciseCard` depends on daily-plan VM hooks, workout formatting helpers, and the player wrapper in [`src/features/daily-plan/_ui/exercise-card.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/exercise-card.tsx#L4).
  - `GetUserDailyPlanService` depends on `UserDailyPlanRepository`, `GetCourseService`, and `CheckCourseAccessService` in [`src/features/daily-plan/_services/get-user-daily-plan.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_services/get-user-daily-plan.ts#L30).
- External services/packages:
  - NextAuth session handling via `getServerSession` and `next-auth/react` in [`src/kernel/lib/next-auth/_session-service.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/next-auth/_session-service.ts#L1) and [`src/kernel/lib/next-auth/client.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/next-auth/client.tsx#L1).
  - tRPC server/client via `@trpc/server`, `@trpc/react-query`, and `@trpc/client` in [`src/kernel/lib/trpc/_procedure.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/trpc/_procedure.ts#L1) and [`src/kernel/lib/trpc/client.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/kernel/lib/trpc/client.ts#L1).
  - React Query via `QueryClient`, `HydrationBoundary`, and tRPC React hooks in [`src/app/_providers/app-provider.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/_providers/app-provider.tsx#L3) and [`src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx#L1).
  - Prisma/Postgres via `dbClient` repositories in [`src/entities/course/_repositories/user-daily-plan.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/entities/course/_repositories/user-daily-plan.ts#L6), [`src/entities/workout/_repositories/workout.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/entities/workout/_repositories/workout.ts#L2), and [`src/entities/workout/_repositories/user-workout-completion.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/entities/workout/_repositories/user-workout-completion.ts#L2).
  - Kinescope player wrapper via `@kinescope/react-kinescope-player` in [`src/features/daily-plan/_ui/kinescope-player.tsx`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/features/daily-plan/_ui/kinescope-player.tsx#L11).
  - Kinescope content API via `fetch('https://api.kinescope.io/v1/videos?...')` in [`src/shared/lib/kinescope/client.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/kinescope/client.ts#L55).
  - Storage providers via AWS S3-compatible client and Supabase SDK in [`src/shared/lib/file-storage/_providers/minio.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/file-storage/_providers/minio.ts#L1) and [`src/shared/lib/file-storage/_providers/supabase.ts`](/Users/sergeistepanov/Yanasporte/yanasporte-1.3/core/src/shared/lib/file-storage/_providers/supabase.ts#L1).

## Open questions
- The inspected day-page and shared client files do not show any `AbortError`, `CanceledError`, or `abortOnUnmount` handling, but the exact runtime behavior of cancellation inside the generated tRPC React Query hooks was not confirmed from generated library internals in this repository.
- The inspected source uses `logger` and `console.error`, but no runtime Sentry integration was identified in the inspected files; external monitoring wiring outside the inspected source set was not confirmed.
- The repository instructions mention a layering rule forbidding cross-entity repository imports, but full repo-wide validation of that rule was outside the inspected file set for this feature-specific research.

## Files inspected
- `docs/ai/commands/research-codebase.md`
- `docs/ai/features/day-tab-query-race/00-brief.md`
- `docs/caching-strategy.md`
- `prisma/schema.prisma`
- `prisma/migrations/20250718120959_daily_plan/migration.sql`
- `prisma/migrations/20250806131510_day_number_in_course/migration.sql`
- `prisma/migrations/20250807084353_add_user_daily_plan_fields/migration.sql`
- `prisma/migrations/20250819101353_replace_video_url_to_video_id_in_workout/migration.sql`
- `prisma/migrations/20250822111404_add_kinescope_video_metadata/migration.sql`
- `prisma/migrations/20251029100423_daily_content_steps/migration.sql`
- `src/app/_providers/app-provider.tsx`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/app/platform/(app-shell)/(paid)/day/[courseSlug]/page.tsx`
- `src/app/platform/(app-shell)/(paid)/day/[courseSlug]/day-page-client.tsx`
- `src/app/server.ts`
- `src/entities/course/_repositories/user-daily-plan.ts`
- `src/entities/course/index.ts`
- `src/entities/course/module.ts`
- `src/entities/workout/_repositories/user-workout-completion.ts`
- `src/entities/workout/_repositories/workout.ts`
- `src/entities/workout/_services/get-workout-completion-status.ts`
- `src/entities/workout/_services/update-workout-completion.ts`
- `src/entities/workout/module.ts`
- `src/features/course-enrollment/_controller.ts`
- `src/features/course-enrollment/_services/get-available-weeks.ts`
- `src/features/course-enrollment/_services/get-enrollment-by-course-slug.ts`
- `src/features/course-enrollment/_vm/use-course-enrollment.ts`
- `src/features/course-enrollment/module.ts`
- `src/features/daily-plan/_api.ts`
- `src/features/daily-plan/_controller.ts`
- `src/features/daily-plan/_services/day-plan-load.ts`
- `src/features/daily-plan/_services/get-user-daily-plan.ts`
- `src/features/daily-plan/_ui/calendar-tabs.tsx`
- `src/features/daily-plan/_ui/day-tabs.tsx`
- `src/features/daily-plan/_ui/exercise-card.tsx`
- `src/features/daily-plan/_ui/kinescope-player.tsx`
- `src/features/daily-plan/_vm/use-daily-plan.ts`
- `src/features/daily-plan/_vm/use-workout-completions.ts`
- `src/features/daily-plan/_vm/use-workout.ts`
- `src/features/daily-plan/_vm/use-worckout-calendar.ts`
- `src/features/daily-plan/module.ts`
- `src/kernel/lib/next-auth/_session-service.ts`
- `src/kernel/lib/next-auth/client.tsx`
- `src/kernel/lib/next-auth/module.ts`
- `src/kernel/lib/trpc/_context-factory.ts`
- `src/kernel/lib/trpc/_procedure.ts`
- `src/kernel/lib/trpc/client.ts`
- `src/kernel/lib/trpc/module.ts`
- `src/shared/api/query-client.ts`
- `src/shared/api/server-helpers.ts`
- `src/shared/config/kinescope.ts`
- `src/shared/config/private.ts`
- `src/shared/lib/cache/cache-constants.ts`
- `src/shared/lib/cache/cache-invalidation.ts`
- `src/shared/lib/file-storage/_model/create-storage.ts`
- `src/shared/lib/file-storage/_providers/minio.ts`
- `src/shared/lib/file-storage/_providers/supabase.ts`
- `src/shared/lib/file-storage/file-storage.ts`
- `src/shared/lib/kinescope/client.ts`
- `src/shared/lib/logger.ts`
