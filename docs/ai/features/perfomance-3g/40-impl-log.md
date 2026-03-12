# Phase IV — Implementation Log: perfomance-3g

## Implemented phase
- Phase: `Phase 1 — Remove Prisma runtime from client bundle`
- Date: `2026-03-12`
- Scope fence: applied only Phase 1 tasks from `30-plan.md`.

## Lead
### Phase brief
- Remove `@prisma/client` runtime imports from client-side day-route chain.
- Introduce client-safe enum module for `DayOfWeek` and `DailyContentType`.
- Replace imports in day-route client path and connected constants/store helpers.
- Keep server-side Prisma usage unchanged.

### Definition of done
- No Prisma imports in changed day-route client modules.
- Build passes and day route no longer includes Prisma runtime chunk previously seen as `6164-*`.
- Lint/typecheck pass.

## Coder
### Changes implemented
- Added client-safe enums module:
  - `src/shared/lib/client-enums.ts`
- Replaced Prisma enum imports with client-safe enums in:
  - `src/features/daily-plan/_ui/day-tabs.tsx`
  - `src/features/daily-plan/_ui/exercise-card.tsx`
  - `src/features/course-enrollment/_vm/use-course-enrollment.ts`
  - `src/features/daily-plan/_vm/use-workout-completions.ts`
  - `src/features/daily-plan/constant.ts`
  - `src/features/select-training-days/constants.ts`
  - `src/shared/store/workout-completion-store.ts`

### Fixes addressed
- No blocking fix-loop items were raised in this phase.

## Reviewer
### Verdict
- Pass

### Notes
- Scope compliance: Phase 1 only.
- Readability/maintainability: enum source centralized in one client-safe module.
- Behavior: only enum import sources changed; no business logic rewrite.

## Security
### Verdict
- Pass

### Notes
- Removed server/runtime library surface (`@prisma/client`) from browser path of day route.
- No new auth/ACL/injection/CSRF surfaces introduced.

## Tester
### Commands run
- `npm run lint`
- `npm run lint:types`
- `npm run build`

### Verification notes
- `lint`: pass (1 pre-existing warning in `src/app/not-found.tsx` for `<img>`, non-blocking).
- `lint:types`: pass.
- `build`: pass.
- Build metric delta for `/platform/day/[courseSlug]`:
  - before (research baseline): `First Load JS 257 kB`
  - after Phase 1: `First Load JS 239 kB`
- Manifest/chunk check for `/platform/(paid)/day/[courseSlug]/page`:
  - previous Prisma-heavy chunk `6164-*` is no longer present.
  - grep for Prisma runtime markers across day-route JS chunk set returned no matches.

### Verdict
- Pass

## Fix list accounting
- Open: none
- Closed: none (no R#/S#/T# issues raised)

## Phase result
- reviewer: Pass
- security: Pass
- tester: Pass

---

## Implemented phase
- Phase: `Phase 2 — Route-scope provider composition`
- Date: `2026-03-12`
- Scope fence: applied only Phase 2 tasks from `30-plan.md`.

## Lead
### Phase brief
- Keep root provider minimal and move non-critical navigation/activity side effects to platform scope.
- Introduce `PlatformClientShell` and mount once for all `/platform/*` routes.
- Preserve platform behavior parity (progress feedback + activity tracking on platform routes).

### Definition of done
- `AppProvider` no longer mounts `TopProgressBar`, navigation completion listener, `ActivityTracker`.
- New platform-scoped shell mounts those components.
- Lint/typecheck/build pass.

## Coder
### Changes implemented
- Updated root provider:
  - `src/app/_providers/app-provider.tsx`
  - removed platform-target side effects from global tree (`TopProgressBar`, navigation completion listener, `ActivityTracker`).
- Added platform-scoped shell:
  - `src/app/platform/_providers/platform-client-shell.tsx`
  - contains `TopProgressBar`, `NavigationFeedbackCompletion`, `ActivityTracker`.
- Mounted shell for all platform routes:
  - `src/app/platform/layout.tsx`

### Fixes addressed
- No blocking fix-loop items were raised in this phase.

## Reviewer
### Verdict
- Pass

### Notes
- Scope compliance: Phase 2 only.
- No unrelated refactors.
- Provider responsibilities are now explicitly split between root and platform scope.

## Security
### Verdict
- Pass

### Notes
- No auth/ACL changes.
- No new network endpoints or trust-boundary changes.
- Client-side telemetry/navigation components were relocated only.

## Tester
### Commands run
- `npm run lint`
- `npm run lint:types`
- `npm run build`

### Verification notes
- `lint`: pass (1 pre-existing warning in `src/app/not-found.tsx` for `<img>`, non-blocking).
- `lint:types`: pass.
- `build`: pass.
- `/platform/day/[courseSlug]` remains at `First Load JS 239 kB` (no regression vs Phase 1).
- Platform routing tree compiles with new `src/app/platform/layout.tsx` wrapper.

### Verdict
- Pass

## Fix list accounting
- Open: none
- Closed: none (no R#/S#/T# issues raised)

## Phase result
- reviewer: Pass
- security: Pass
- tester: Pass

---

## Implemented phase
- Phase: `Phase 3 — First-fold/lazy-fold split for day page`
- Date: `2026-03-12`
- Scope fence: applied only Phase 3 tasks from `30-plan.md`.

## Lead
### Phase brief
- Defer heavy workout card/player subtree from initial day-page bundle.
- Keep first fold (access/banner/week-day selector logic) in critical path.
- Preserve day behavior after deferred chunk resolves.

### Definition of done
- Heavy `ExerciseCard` subtree is dynamically imported from `DayTabs`.
- Build shows reduced `First Load JS` for `/platform/day/[courseSlug]`.
- Lint/typecheck/build pass.

## Coder
### Changes implemented
- Updated `src/features/daily-plan/_ui/day-tabs.tsx`:
  - replaced static import of `ExerciseCard` with `next/dynamic` import
  - configured `ssr: false` for deferred client-side loading
- No business rule changes in access/setup logic.

### Fixes addressed
- No blocking fix-loop items were raised in this phase.

## Reviewer
### Verdict
- Pass

### Notes
- Scope compliance: Phase 3 only.
- Change is minimal and localized to lazy-loading boundary.
- Existing user flows preserved with deferred component load.

## Security
### Verdict
- Pass

### Notes
- No auth/ACL input-path changes.
- No new API endpoints or sensitive data paths.
- Dynamic import introduces no new trust-boundary concerns.

## Tester
### Commands run
- `npm run lint`
- `npm run lint:types`
- `npm run build`

### Verification notes
- `lint`: pass (1 pre-existing warning in `src/app/not-found.tsx` for `<img>`, non-blocking).
- `lint:types`: pass.
- `build`: pass.
- `/platform/day/[courseSlug]` metric:
  - before Phase 3: `First Load JS 239 kB`
  - after Phase 3: `First Load JS 227 kB`
- Route size changed from `17.7 kB` to `14.1 kB` in build report.

### Verdict
- Pass

## Fix list accounting
- Open: none
- Closed: none (no R#/S#/T# issues raised)

## Phase result
- reviewer: Pass
- security: Pass
- tester: Pass

---

## Implemented phase
- Phase: `Phase 4 — D4 edge-case hardening (access/state convergence)`
- Date: `2026-03-12`
- Scope fence: applied only Phase 4 tasks from `30-plan.md`.

## Lead
### Phase brief
- Harden day-page access convergence for edge cases without adding unconditional duplicate checks.
- Ensure enrollment/access mutations invalidate all access-critical queries.
- Keep setup redirect priority deterministic.

### Definition of done
- `DayPageClient` conditionally revalidates server snapshot for risky states.
- Enrollment mutations invalidate `getAccessibleEnrollments`, `checkAccessByCourseSlug`, `getEnrollmentByCourseSlug`, `getActiveEnrollment`.
- Lint/typecheck/build pass.

## Coder
### Changes implemented
- Updated `src/app/platform/(paid)/day/[courseSlug]/day-page-client.tsx`:
  - added conditional snapshot revalidation triggers:
    - expired server access
    - inactive server enrollment snapshot
    - incomplete setup snapshot
  - enabled fallback access query when either no server access or snapshot requires revalidation
  - prioritized query result over server snapshot only in revalidation mode
  - kept setup redirect logic unchanged and deterministic
- Updated `src/features/course-enrollment/_vm/use-course-enrollment.ts`:
  - extended invalidation sets in `activateEnrollment` and `updateWorkoutDays` success handlers with:
    - `course.getEnrollmentByCourseSlug`
    - `course.checkAccessByCourseSlug`

### Fixes addressed
- No blocking fix-loop items were raised in this phase.

## Reviewer
### Verdict
- Pass

### Notes
- Scope compliance: Phase 4 only.
- D4 edge conditions addressed without broad refactor.
- Logic remains readable and localized.

## Security
### Verdict
- Pass

### Notes
- No new trust boundaries or auth bypass paths.
- Access remains server-authoritative; client refetch is convergence mechanism only.

## Tester
### Commands run
- `npm run lint`
- `npm run lint:types`
- `npm run build`

### Verification notes
- `lint`: pass (1 pre-existing warning in `src/app/not-found.tsx` for `<img>`, non-blocking).
- `lint:types`: pass.
- `build`: pass.
- `/platform/day/[courseSlug]` remains at `First Load JS 227 kB` (no performance regression from Phase 3).

### Verdict
- Pass

## Fix list accounting
- Open: none
- Closed: none (no R#/S#/T# issues raised)

## Phase result
- reviewer: Pass
- security: Pass
- tester: Pass

---

## Additional continuation step
- Date: `2026-03-12`
- Purpose: close residual risk by adding automated unit coverage for D4 snapshot revalidation logic.

### Changes
- Added pure helper:
  - `src/app/platform/(paid)/day/[courseSlug]/_lib/access-snapshot.ts`
- Refactored usage in:
  - `src/app/platform/(paid)/day/[courseSlug]/day-page-client.tsx`
- Added unit tests:
  - `src/app/platform/(paid)/day/[courseSlug]/_lib/access-snapshot.spec.ts`

### Test evidence
- `npm run test -- access-snapshot.spec.ts` -> pass (5/5)
- `npm run lint` -> pass (existing non-blocking warning unchanged)
- `npm run lint:types` -> pass
