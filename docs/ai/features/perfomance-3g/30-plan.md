# Phase III — Plan: perfomance-3g

## Planning principles
- Every phase is atomic, testable, and can be committed independently.
- No behavior changes outside `/platform/day/[courseSlug]` critical path unless required by design.
- Preserve auth/access semantics and edge-case invariants from `20-design.md` (D4).

## Phase 1 — Remove Prisma runtime from client bundle
### Goal
Eliminate `@prisma/client` imports from `use client` modules in day-route chain to remove Prisma payload from browser chunks.

### Files to change
- `src/features/daily-plan/_ui/day-tabs.tsx`
- `src/features/daily-plan/_ui/exercise-card.tsx`
- `src/features/course-enrollment/_vm/use-course-enrollment.ts`
- new client-safe enum/constants module(s) under `src/shared` or `src/kernel/domain` (exact file decided during implementation)

### Steps
1. Introduce client-safe enum/constants for values currently imported from Prisma (`DailyContentType`, `DayOfWeek` etc.).
2. Replace Prisma imports in listed client files with new client-safe module.
3. Ensure server-side code keeps Prisma enums where needed.
4. Run type fixes for all touched signatures/usages.

### Local tests
- `npm run lint`
- `npm run lint:types`
- `npm run build`
- Build artifact check: inspect `.next/static/chunks/*` for Prisma runtime markers in day-route chunks.

### Acceptance criteria
- No `@prisma/client` imports remain in changed `use client` files.
- `/platform/day/[courseSlug]` build chunks no longer include Prisma runtime payload chunk attributable to client-side enum imports.
- No TS or lint regressions.

## Phase 2 — Route-scope provider composition
### Goal
Move non-critical global client effects/providers from root to platform scope to shrink global critical path work.

### Files to change
- `src/app/_providers/app-provider.tsx`
- `src/app/platform/(paid)/layout.tsx`
- new platform shell component (e.g. `src/app/platform/_providers/platform-client-shell.tsx`)
- optionally sibling platform layouts if required to keep behavior parity

### Steps
1. Split root provider composition into minimal global set and platform-scoped client shell.
2. Move selected components from root to platform shell:
   - `TopProgressBar`
   - navigation feedback completion listener
   - `ActivityTracker`
   - `Toaster` (or keep global if parity requires; decision documented in impl log)
3. Mount platform shell in paid layout so platform UX stays unchanged.
4. Verify no duplicate provider mounting and no hydration warnings.

### Local tests
- `npm run lint`
- `npm run lint:types`
- `npm run build`
- Manual smoke:
  - navigate inside platform routes and check pending-navigation/progress behavior
  - verify activity tracking requests still fire on platform navigation

### Acceptance criteria
- Root provider tree is reduced to minimal global responsibilities.
- Platform route behavior parity is preserved.
- No auth/session/theme regressions.

## Phase 3 — First-fold/lazy-fold split for day page
### Goal
Render first usable day UI sooner by deferring heavy interactive blocks and video/player path.

### Files to change
- `src/app/platform/(paid)/day/[courseSlug]/day-page-client.tsx`
- `src/features/daily-plan/_ui/calendar-tabs.tsx`
- `src/features/daily-plan/_ui/day-tabs.tsx`
- `src/features/daily-plan/_ui/exercise-card.tsx`
- `src/features/daily-plan/_ui/kinescope-player.tsx`
- new lazy wrapper/component files as needed

### Steps
1. Define first-fold boundary (access, banner, week/day selector, essential state).
2. Introduce lazy-loaded fold for workout details/player (`next/dynamic`/lazy strategy).
3. Ensure no-access/setup redirect logic executes before lazy fold.
4. Keep existing user-visible behavior when lazy content is loaded.

### Local tests
- `npm run lint`
- `npm run lint:types`
- `npm run build`
- Manual route checks:
  - initial load of `/platform/day/[courseSlug]`
  - day/week switching
  - workout card opening + video playback

### Acceptance criteria
- First fold renders independently of workout-player bundle.
- Deferred chunks are requested only when needed.
- Functional behavior (workout completion/favorites/video) remains intact.

## Phase 4 — D4 edge-case hardening (access/state convergence)
### Goal
Guarantee correctness under access/enrollment races while reducing duplicate checks in critical path.

### Files to change
- `src/app/platform/(paid)/day/[courseSlug]/day-page-client.tsx`
- `src/features/course-enrollment/_vm/use-course-enrollment.ts`
- related query invalidation hooks where enrollment activation/setup mutations occur
- optional helper module for access-state convergence

### Steps
1. Keep server state as initial snapshot, but enforce refetch when snapshot becomes stale.
2. Implement deterministic priority for `setupCompleted=false` redirect.
3. Add/adjust invalidations for enrollment/access mutations:
   - `course.getAccessibleEnrollments`
   - `course.checkAccessByCourseSlug`
   - `course.getEnrollmentByCourseSlug`
   - `course.getActiveEnrollment`
4. Ensure no-access path remains idempotent across SSR+client refetch transitions.

### Local tests
- `npm run lint`
- `npm run lint:types`
- targeted manual checks:
  - expired access between SSR and hydration
  - race immediately after course activation
  - setup incomplete redirect stability
  - active enrollment switch (same user, changed active course)

### Acceptance criteria
- All four D4 edge cases converge to correct UI state without stale content leaks.
- No redirect loops or transient incorrect banners/day data.
- Access decisions remain server-authoritative.

## Phase 5 — Performance verification and release readiness
### Goal
Validate measurable performance improvement and absence of functional regressions.

### Files to change
- `docs/ai/features/perfomance-3g/40-impl-log.md`
- `docs/ai/features/perfomance-3g/50-review.md` (if required by team flow)

### Steps
1. Run build and capture before/after metrics for `/platform/day/[courseSlug]`.
2. Record route chunk composition changes (notable removed/deferred chunks).
3. Execute regression checklist (auth, access, navigation, day interactions).
4. Document outcomes and residual risks.

### Local tests
- `npm run build`
- `npm run lint`
- `npm run lint:types`
- Manual slow-3G profile for day page first usable paint.

### Acceptance criteria
- `First Load JS` for `/platform/day/[courseSlug]` is lower than baseline.
- Day-route critical path excludes removed Prisma runtime payload and defers heavy interactive/video code.
- No critical regressions in auth/access/day flow.

## Commit strategy
1. Commit A: Phase 1 only (Prisma enum decoupling for client).
2. Commit B: Phase 2 only (provider scope changes).
3. Commit C: Phase 3 only (lazy split).
4. Commit D: Phase 4 only (edge-case hardening + invalidations).
5. Commit E: docs and verification artifacts.

## Risks and rollback points
- Provider relocation may affect cross-route UX feedback components.
  - Rollback point: revert Phase 2 commit only.
- Lazy split may introduce loading-state flicker.
  - Rollback point: revert Phase 3 commit only.
- Access convergence logic may create redirect churn.
  - Rollback point: revert Phase 4 commit only.
