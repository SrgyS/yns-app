# Phase I — Research (as-is): perfomance-3g

## Scope and method
- Scope: route `src/app/platform/(paid)/day/[courseSlug]/page.tsx` (`/platform/day/[courseSlug]`) and its layout/provider chain.
- Command baseline: `npm run build` executed on 2026-03-12.
- Artifact sources: Next build table, `.next/app-build-manifest.json`, current source code in `src/app`, `src/features`, `src/kernel`, `src/entities`.

## Baseline metrics (current state)
- Next build reports for route `/platform/day/[courseSlug]`:
  - `Size`: `17.8 kB`
  - `First Load JS`: `257 kB`
- Shared First Load JS for all routes: `102 kB`.
- Route `/platform/day/[courseSlug]` JS files from manifest (`.next/app-build-manifest.json`) sum to:
  - `851010` bytes raw
  - `256944` bytes gzip
- Build output also logged runtime integration errors during static generation:
  - `PrismaClientInitializationError` in public navigation build path.
  - `next-auth CLIENT_FETCH_ERROR` to `http://localhost:3000/api/auth/providers`.

## Layout composition for day-page-client
The route `/platform/day/[courseSlug]` is composed by these app segments:
1. Root layout: `src/app/layout.tsx`
2. Paid platform layout: `src/app/platform/(paid)/layout.tsx`
3. Course-day layout: `src/app/platform/(paid)/day/[courseSlug]/layout.tsx`
4. Page: `src/app/platform/(paid)/day/[courseSlug]/page.tsx`
5. Client screen: `src/app/platform/(paid)/day/[courseSlug]/day-page-client.tsx`

Observed app chunk files for these segments:
- `.next/static/chunks/app/layout-*.js` (`~7.0K` raw)
- `.next/static/chunks/app/platform/(paid)/layout-*.js` (`~5.5K` raw)
- `.next/static/chunks/app/platform/(paid)/day/[courseSlug]/layout-*.js` (`~7.5K` raw)
- `.next/static/chunks/app/platform/(paid)/day/[courseSlug]/page-*.js` (`~36K` raw)

## Global client provider chain (always mounted)
`src/app/layout.tsx` always mounts `AppProvider` from `src/app/_providers/app-provider.tsx`.

`AppProvider` is `use client` and mounts these client integrations globally:
- React Query: `QueryClientProvider` (`@tanstack/react-query`)
- tRPC client provider (`sharedApi.Provider`, `httpBatchLink`)
- NextAuth session provider (`AppSessionProvider` from `src/kernel/lib/next-auth/client.tsx`)
- Theme provider (`ThemeProvider`)
- UI/side effects:
  - `TopProgressBar` (`src/shared/ui/top-progress-bar.tsx`)
  - `NavigationFeedbackCompletion`
  - `Toaster` (`src/shared/ui/sonner.tsx`, package `sonner`)
  - `ActivityTracker` (`src/features/activity-tracker/activity-tracker.tsx`), posting to `/api/activity` on route changes

This provider chain is imported from root app layout and participates in every app route render path.

## Data flow: server entry to client render (day page)
### Server request path
1. Entrypoint: `DayPage` in `src/app/platform/(paid)/day/[courseSlug]/page.tsx`.
2. Auth validation:
   - `ContextFactory.createContext()` (`src/kernel/lib/trpc/module` binding)
   - Redirect unauthenticated users via `redirect('/auth/sign-in')`.
3. Domain/service load:
   - `DayPlanLoadService.load` in `src/features/daily-plan/_services/day-plan-load.ts`.
   - This service calls:
     - `GetCourseService.exec`
     - `CheckCourseAccessService.exec`
     - `GetEnrollmentByCourseSlugService.exec`
     - `GetActiveEnrollmentService.exec`
     - `UserAccessRepository.findUserCourseAccess`
     - `GetAvailableWeeksService.exec`
     - `GetUserDailyPlanService.exec`
4. Repository/integration layer used by these services:
   - `UserDailyPlanRepository.getUserDailyPlanByEnrollment` (`src/entities/course/_repositories/user-daily-plan.ts`) -> Prisma (`db.userDailyPlan.findFirst` with `mainWorkouts` include)
   - `UserAccessRepository` (`src/entities/user-access/_repository/user-access.ts`) -> Prisma `userAccess` queries
   - `GetAvailableWeeksService` (`src/features/course-enrollment/_services/get-available-weeks.ts`) -> Prisma `week.findMany`, `UserDailyPlanRepository.getWeeklySummary`, `UserAccessRepository.findUserCourseAccess`
5. Response hydration:
   - `queryClient.setQueryData(...)` seeds multiple course/day queries.
   - `courseDetailsHelpers.courseDetails.get.prefetch({ courseSlug })` runs when access exists.
   - `HydrationBoundary` returns with dehydrated react-query state.

### Client render path
1. `DayPageClient` (`src/app/platform/(paid)/day/[courseSlug]/day-page-client.tsx`):
   - Reads session (`useAppSession`)
   - Reads paid access context (`usePaidAccess`)
   - Runs fallback `useCheckAccessByCourseSlugQuery` when needed
   - Redirects to setup route when `setupCompleted` is false
2. UI composition:
   - `CourseBanner`
   - `CourseActivationBanner`
   - `CalendarTabs`
3. `CalendarTabs` (`src/features/daily-plan/_ui/calendar-tabs.tsx`):
   - Runs `useEnrollmentByCourseSlugQuery`
   - Runs `useWorkoutCalendar` (which uses `useAvailableWeeksQuery`)
   - Renders `DayTabs`
4. `DayTabs` (`src/features/daily-plan/_ui/day-tabs.tsx`):
   - Runs `useEnrollmentQuery`
   - Runs `useDailyPlanQuery`
   - Renders `ExerciseCard` for warmup/main workouts
5. `ExerciseCard` (`src/features/daily-plan/_ui/exercise-card.tsx`):
   - Runs `useWorkoutQuery`
   - Runs completion/favorite hooks
   - Renders `KinescopePlayer` (`@kinescope/react-kinescope-player`) when `workout.videoId` exists

## Heavy client dependencies observed in day route chain
- `date-fns` + locale imports used in day UI and paid layout:
  - `src/features/daily-plan/_ui/calendar-tabs.tsx`
  - `src/features/daily-plan/_ui/day-tabs.tsx`
  - `src/app/platform/(paid)/layout.tsx`
- `lucide-react` icons used in:
  - `src/features/daily-plan/_ui/calendar-tabs.tsx`
  - `src/features/daily-plan/_ui/day-tabs.tsx`
  - `src/features/navigation/nav-items.ts`
- Video player dependency in critical day-screen tree:
  - `src/features/daily-plan/_ui/kinescope-player.tsx` (`@kinescope/react-kinescope-player`)

## Prisma enum imports in client components
Client components under `day` path import enums directly from `@prisma/client`:
- `src/features/daily-plan/_ui/day-tabs.tsx` imports `DailyContentType`, `DayOfWeek`
- `src/features/daily-plan/_ui/exercise-card.tsx` imports `DailyContentType`
- `src/features/course-enrollment/_vm/use-course-enrollment.ts` imports `DayOfWeek` and is used by day UI hooks

Build chunk inspection for `/platform/day/[courseSlug]` includes a dedicated chunk with Prisma client runtime/enums payload:
- `.next/static/chunks/6164-*.js` (`50954` bytes raw, `18082` bytes gzip)
- Content strings in this chunk include Prisma scalar enums and runtime markers.

## Paid layout runtime dependencies
`src/app/platform/(paid)/layout.tsx` does server-side work before rendering children:
- Session load via `SessionService.get`
- Access load via `GetAccessibleEnrollmentsService.exec`
- Freeze load via `UserFreezeRepository.findActive`
- Renders client UI shell components:
  - `PaidAccessProviderClient`
  - `PaidActivityFlag`
  - `PlatformHeader` -> `TopBar` -> `MainNavClient` + `Profile`
  - `MobileBottomNav` -> `MobileBottomNavClient`

This layout is in the route segment chain for day page and contributes to the route's client bundle set from manifest.

## Constraints (as implemented)
- Authentication is mandatory for paid routes (`redirect('/auth/sign-in')` in paid layout and day page).
- Course access is guarded twice in route chain:
  - Layout guard `CheckAccessGuard` in `src/app/platform/(paid)/day/[courseSlug]/layout.tsx`
  - Client fallback access query in `DayPageClient`.
- Day page first render is coupled with preloaded react-query state from server (`HydrationBoundary`), including access/enrollment/available weeks/daily plan payloads.
- Global `AppProvider` is mounted from root layout; providers and side-effect components are not route-scoped in current composition.

## Open questions
- The brief baseline references `~1.4 min` load and three large layout bundles (`546 KB`, `531 KB`, `1.4 KB`). Current production build snapshot shows `257 kB First Load JS` for `/platform/day/[courseSlug]`. The exact measurement environment that produced `546/531` values is not present in repository artifacts.
- No committed network waterfall/Chrome trace file for slow-3G run is present in `docs/ai/features/perfomance-3g/`.
