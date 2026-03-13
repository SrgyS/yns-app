---
date: 2026-03-13
planner: Codex
branch: perf/3g
commit: 603b960
feature: day-tab-query-race
based_on: docs/ai/features/day-tab-query-race/20-design.md
---

# Plan: day-tab-query-race

## Summary
The implementation will be delivered in three atomic phases: first stabilize the day query lifecycle and expected-cancel behavior, then decouple player mounting from tab switching with explicit Play-only activation, and finally tighten logging and verification around the new behavior. The plan keeps the scope limited to the approved design and defers adjacent-day prefetch and ownership hardening follow-ups.

## Definition of Done
- Functional:
  - Rapid tab switching does not show false error state for canceled or superseded day requests.
  - The visible day content always corresponds to the latest selected tab.
  - Kinescope player mounts only after explicit `Watch` / `Play` action inside `ExerciseCard`.
  - Poster/overlay stays visible until the player reports readiness.
- Technical:
  - Query lifecycle uses the existing tRPC + React Query stack without parallel fetch state.
  - No Prisma schema change or migration is introduced.
  - Logging distinguishes expected cancel from real failure or suppresses expected cancel noise.
  - Lint and typecheck pass for the changed code.
- Docs:
  - `40-impl-log.md` records implementation decisions and verification results after coding.

## Phase 1: Day query lifecycle stabilization
Goal:
Implement a single-source-of-truth day query flow that safely replaces old tab requests, preserves stable placeholder UI, treats expected cancel as non-product failure, and brings completion-related client reads under the same declarative query lifecycle.

Files to change:
- `src/features/daily-plan/_vm/use-daily-plan.ts`
- `src/features/daily-plan/_ui/day-tabs.tsx`
- `src/features/daily-plan/_vm/use-workout.ts`
- `src/features/daily-plan/_vm/use-workout-completions.ts`
- `src/features/daily-plan/_vm/use-workout-completion-status.ts` if a dedicated hook is introduced
- `src/shared/lib/query/errors.ts` if a shared abort/cancel classifier is introduced
- `src/features/daily-plan/_controller.ts`
- `src/features/daily-plan/_services/get-user-daily-plan.ts`
- `src/app/_providers/app-provider.tsx` only if query-level client option wiring requires shared-provider support

Steps:
1. Update `useDailyPlanQuery` to carry the approved query options for tab-switch behavior: keep previous data, configure cancel-on-replacement behavior, and disable retry for expected client-side cancellation.
2. Refactor `DayTabs` so the active day query is driven only by `activeDayId` / `activeDayNumberInCourse` and does not rely on parallel imperative request state.
3. Review completion-related client reads in the day-page flow and identify any manual `useEffect + fetch + setState` logic that bypasses React Query cancellation semantics.
4. Move completion-status reads to declarative React Query/tRPC hooks so completion state follows the same stale-response and expected-cancel rules as the main day query.
5. Introduce a shared abort/cancel classifier if needed so the day query and completion-related hooks use one consistent policy for expected transport cancellation.
6. Ensure day-tab rendering uses the active query key result only and keeps stable loading visuals while the replacement request is in flight.
7. Add expected-cancel filtering in the day-query and completion-query consumer paths so canceled/superseded requests do not surface as user-facing error state.
8. Adjust controller/service logging only where needed so canceled request paths are not logged as real failures.

Local tests:
- `npm run lint -- src/features/daily-plan/_vm src/features/daily-plan/_ui/day-tabs.tsx src/features/daily-plan/_controller.ts src/features/daily-plan/_services/get-user-daily-plan.ts src/shared/lib/query`
- `npm run lint:types`

Acceptance criteria:
- Fast day-tab switching does not render a false error state for the previously selected tab.
- The final rendered day always matches the latest tab selection after a burst of rapid clicks.
- Older in-flight requests do not overwrite the latest day data in the UI.
- Placeholder behavior keeps the day area visually stable during replacement fetches.
- Abort-like failures are not logged or surfaced as product errors in either the day query path or completion-status read path.
- Completion status no longer depends on manual imperative fetch lifecycle where a declarative query hook is available.
- No Prisma change is required.

Commit message:
- `feat(day-plan): stabilize tab query cancellation lifecycle`

## Phase 2: Explicit Play-only player activation
Goal:
Separate tab state from player state so day switching never mounts the player, and mount the player only after explicit user intent inside the workout card.

Files to change:
- `src/features/daily-plan/_ui/day-tabs.tsx`
- `src/features/daily-plan/_ui/exercise-card.tsx`
- `src/features/daily-plan/_ui/kinescope-player.tsx`
- `src/features/daily-plan/_vm/use-workout.ts` only if workout-loading coordination needs small hook-level adjustments

Steps:
1. Introduce explicit `selectedWorkoutId` and `playingWorkoutId` state ownership in the day UI flow, with tab switching clearing or safely resetting playback state.
2. Refactor `ExerciseCard` to render poster/overlay and an explicit `Watch` / `Play` action instead of mounting `KinescopePlayer` immediately on card render.
3. Mount `KinescopePlayer` only for the explicit playback target and keep poster/overlay visible until the player emits a ready signal.
4. Keep workout-level failure handling scoped to the card so player integration failure does not break the day query UI.
5. Verify that switching tabs without pressing play does not initialize the player subtree.

Local tests:
- `npm run lint -- src/features/daily-plan/_ui/day-tabs.tsx src/features/daily-plan/_ui/exercise-card.tsx src/features/daily-plan/_ui/kinescope-player.tsx`
- `npm run lint:types`

Acceptance criteria:
- Changing tabs does not mount `KinescopePlayer`.
- Selecting or viewing a card without pressing `Watch` / `Play` does not mount `KinescopePlayer`.
- Pressing `Watch` / `Play` mounts one player for the intended workout only.
- Poster/overlay remains visible until the player reports readiness, then transitions to player content.
- Player load failure remains local to the workout card and does not invalidate the active day query.

Commit message:
- `feat(day-plan): gate player mount behind explicit play action`

## Phase 3: Observability cleanup and regression verification
Goal:
Make expected-cancel paths operationally quiet, keep real failures visible, and verify the approved behavior with focused local checks.

Files to change:
- `src/features/daily-plan/_services/get-user-daily-plan.ts`
- `src/features/daily-plan/_controller.ts`
- `src/features/daily-plan/_ui/exercise-card.tsx`
- `docs/ai/features/day-tab-query-race/40-impl-log.md`
- Tests near changed units if added during implementation

Steps:
1. Finalize structured logging so real day-query failures and player failures remain visible while expected cancellation is suppressed or marked as low-severity.
2. Add or update focused tests if practical for hook/component behavior that can be covered without excessive fixture cost.
3. Run the consolidated verification commands for changed day-page code.
4. Record implementation results, deviations, and verification evidence in `40-impl-log.md`.

Local tests:
- `npm run lint`
- `npm run lint:types`
- Targeted test command for any added tests, if applicable

Acceptance criteria:
- Real failures still log with enough context to diagnose the active request or player failure.
- Expected cancel no longer appears as a product error in the day-page UX.
- Implementation log documents completed phases and verification outputs.
- No optional adjacent-day prefetch or unrelated security hardening is added in this phase.

Commit message:
- `chore(day-plan): finalize cancel logging and verify tab flow`

## Test plan (consolidated)
- Unit:
  - Add targeted tests for any extracted day-query error classifier or player activation state helper if those helpers are introduced.
  - Add component-level coverage only where the repo already has practical patterns for client-component tests.
- Integration:
  - Manual local verification on the paid day page:
    - open a course day page;
    - rapidly switch day tabs several times;
    - confirm final content matches the last tab;
    - confirm no false error toast/state appears for canceled requests;
    - confirm the player does not mount before explicit `Watch` / `Play`;
    - confirm poster stays until ready;
    - confirm player failure remains scoped to one card if reproducible.
- E2E:
  - Out of scope for this phase unless the repo already has an existing stable day-page Playwright flow that can be extended cheaply.

## Security checklist
- AuthZ:
  - Preserve `authorizedProcedure` usage on day and workout queries.
  - Do not relax course-access checks in `GetUserDailyPlanService`.
- IDOR:
  - Do not expand trust in client-provided `userId` or `enrollmentId`.
  - Ownership hardening remains follow-up work, not part of this implementation.
- Validation:
  - Keep zod input schemas unchanged or tighter.
  - Avoid client-side code paths that can issue malformed day queries during tab transitions.
- Storage (if applicable):
  - No storage flow changes.
  - Kinescope remains a media integration only.
- Secrets:
  - No Kinescope API secret exposure to the client.

## Rollout / migration steps
- Steps:
  - Merge after human review of plan and implementation.
  - Deploy as a normal application release with no schema migration.
  - Perform smoke test on the paid day page after deployment using rapid day-tab switching and explicit play activation.
- Rollback:
  - Revert the day-page UI/query commits.
  - No database rollback is required.

## Risks
- R1: Query cancellation semantics may differ from the assumption about available tRPC React Query options, which could require a small adjustment in how expected cancel is detected.
- R2: Player gating can affect perceived UX if poster/overlay transitions are not implemented cleanly.
- R3: Existing imperative completion-state logic inside `ExerciseCard` may interact with the new player activation state and require careful coordination to avoid extra rerenders.

## Out-of-scope follow-ups
- F1: Adjacent-day prefetch after the race/cancel/player lifecycle fix is validated in production.
- F2: Ownership/security hardening for day-page procedures that currently accept `userId` from the client.
- F3: Broader cleanup of imperative completion-state fetching if the team wants to simplify `ExerciseCard` after this fix lands.
