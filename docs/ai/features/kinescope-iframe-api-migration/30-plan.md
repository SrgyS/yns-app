# Plan: Kinescope iframe API migration

## Phase 1

- Goal: replace the internal player implementation in `src/features/daily-plan/_ui/kinescope-player.tsx` with direct iframe API usage while preserving the current public props and callbacks.
- Files to change:
  - `src/features/daily-plan/_ui/kinescope-player.tsx`
  - `package.json`
  - `package-lock.json`
- Steps:
  1. Import `load` from `@kinescope/player-iframe-api-loader` and the iframe API types.
  2. Replace `ReactKinescopePlayer` rendering with a host element managed by `ref`.
  3. Create a player instance in `useEffect` from `resolvedVideoId` and normalized `CreateOptions`.
  4. Subscribe to `Ready`, `DurationChange`, `Play`, `Pause`, `Ended`, `TimeUpdate`, and `Error`.
  5. Update loading-state handling so the overlay disappears as soon as the player is visibly mounted, without waiting for later playback events.
  6. Preserve existing retry, watched-threshold, and error-normalization behavior.
  7. Destroy the player instance on cleanup and on remount attempts.
  8. Remove `@kinescope/react-kinescope-player` from dependencies and lockfile.
- Local tests:
  - `npm run lint -- src/features/daily-plan/_ui/kinescope-player.tsx`
  - `npm run lint:types`
- Acceptance criteria:
  - `KinescopePlayer` compiles without importing `@kinescope/react-kinescope-player`.
  - Existing consumers compile without code changes.
  - Loading overlay hides once the embedded player is visible to the user.
  - The package `@kinescope/react-kinescope-player` is absent from `package.json`.

## Phase 2

- Goal: verify the shared player still satisfies all current consumer flows.
- Files to change:
  - no code changes required unless issues are found in consumers
- Steps:
  1. Validate `ExerciseCard` completion flow with the migrated player events.
  2. Validate overlay behavior in `PracticeWorkoutCard`.
  3. Validate dialog playback in `VideoBlockComponent`.
  4. Apply targeted compatibility fixes only if one of the existing consumers breaks.
- Local tests:
  - `npm run lint`
  - `npm run lint:types`
- Acceptance criteria:
  - No consumer requires API contract changes.
  - No new warnings or type regressions are introduced by the migrated wrapper.

## Phase 3

- Goal: finalize implementation notes and verification record.
- Files to change:
  - `docs/ai/features/kinescope-iframe-api-migration/40-impl-log.md`
  - `docs/ai/features/kinescope-iframe-api-migration/50-review.md`
- Steps:
  1. Record implemented files, role-based review notes, and verification commands.
  2. Document any residual risk, especially if SDK-originated warnings remain.
- Local tests:
  - none beyond the results captured from previous phases
- Acceptance criteria:
  - Implementation log reflects actual changes and verification outcomes.
  - Review artifact captures reviewer, security, and tester notes.
