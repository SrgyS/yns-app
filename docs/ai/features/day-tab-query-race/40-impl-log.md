---
date: 2026-03-13
implementer: Codex
branch: perf/3g
commit: 603b960
feature: day-tab-query-race
based_on: docs/ai/features/day-tab-query-race/30-plan.md
---

# Implementation Log: day-tab-query-race

## Phase 1: Day query lifecycle stabilization

### Scope
- Added a shared abort/cancel classifier for query retry policy.
- Enabled `trpc.abortOnUnmount` for day, workout, and completion-status reads.
- Replaced manual completion-status fetching in `ExerciseCard` with a declarative tRPC React Query hook.
- Kept completion mutation cache updates inside the existing VM path so UI state updates from query cache instead of local `useEffect + setState`.

### Files changed
- `src/shared/lib/query/errors.ts`
- `src/features/daily-plan/_vm/use-daily-plan.ts`
- `src/features/daily-plan/_vm/use-workout.ts`
- `src/features/daily-plan/_vm/use-workout-completions.ts`
- `src/features/daily-plan/_vm/use-workout-completion-status.ts`
- `src/features/daily-plan/_ui/exercise-card.tsx`

### Notes
- `DayTabs`, controller, and service code were left unchanged in this phase because the active-day query key was already declarative there; the concrete race/noise issue in scope was on client query options and the manual completion read path.
- Query retries are now suppressed for abort-like failures and preserved for real failures up to the existing default threshold.
- Completion status now renders from React Query data with `initialCompleted` only as a fallback before the first successful read.

### Verification
- Passed:
  - `npm run lint -- src/features/daily-plan/_vm src/features/daily-plan/_ui/exercise-card.tsx src/shared/lib/query`
  - `npm run lint:types`

## Phase 2: Explicit Play-only player activation

### Scope
- Added explicit local playback intent state in `ExerciseCard`.
- Switched the Kinescope player to lazy client-side loading instead of eager mount on card render.
- Kept poster/preview overlay visible until the player emits `onReady`.
- Added local retry/failure fallback in the card so player load problems stay scoped to the workout tile.

### Files changed
- `src/features/daily-plan/_ui/exercise-card.tsx`
- `src/features/daily-plan/_ui/kinescope-player.tsx`

### Notes
- `DayTabs` was not changed in this phase because the eager-mount issue was fully local to `ExerciseCard`.
- Playback now starts only after explicit `Смотреть` action, and tab switching without that action does not mount the player subtree.
- Preview state stays visible during player initialization and after local player failure until the user retries.
- Added a warmup path on hover/focus/touchstart so the player module starts loading slightly before the click without removing the poster.
- Poster now remains visible until `KinescopePlayer` emits `onReady`, pending state is rendered as an overlay on top of the poster, and the final poster -> player handoff uses an opacity transition instead of a hard swap.

### Verification
- Passed:
  - `npm run lint -- src/features/daily-plan/_ui/exercise-card.tsx src/features/daily-plan/_ui/kinescope-player.tsx`
  - `npm run lint:types`

## Phase 3: Observability cleanup and regression verification

### Scope
- Added request context fields to day-plan timing logs in the controller and feature service.
- Kept expected-cancel suppression on the client query path and added explicit media-failure logging only after player retries are exhausted.
- Ran final repo-level lint and type verification for the completed feature work.

### Files changed
- `src/features/daily-plan/_controller.ts`
- `src/features/daily-plan/_services/get-user-daily-plan.ts`
- `src/features/daily-plan/_ui/exercise-card.tsx`

### Notes
- No extra cancel logging was introduced on the server path because the implemented race fix is handled on the client query lifecycle before stale results become product-visible failures.
- Player media failures are now logged once at workout scope from `ExerciseCard` after the player component gives up its internal init retries.
- No additional tests were added in this phase; verification stayed at lint/typecheck level plus code-path review.

### Verification
- Passed:
  - `npm run lint`
  - `npm run lint:types`
