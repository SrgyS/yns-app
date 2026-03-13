# Implementation Log: Kinescope iframe API migration

## Phase 1

### Lead brief

- Goal: replace the internal `@kinescope/react-kinescope-player` usage in `src/features/daily-plan/_ui/kinescope-player.tsx` with direct iframe API loader integration.
- Scope:
  - preserve `KinescopePlayerProps`
  - preserve current consumer callbacks and watched-threshold behavior
  - hide the loading overlay as soon as the player becomes visibly mounted
  - remove `@kinescope/react-kinescope-player` from project dependencies
- Definition of done:
  - `KinescopePlayer` compiles without importing `@kinescope/react-kinescope-player`
  - consumers compile unchanged
  - loading overlay hides on visible player mount
  - `package.json` no longer contains `@kinescope/react-kinescope-player`

### Coder

- Replaced `ReactKinescopePlayer` usage in `src/features/daily-plan/_ui/kinescope-player.tsx` with direct `load()` + `factory.create()` integration from `@kinescope/player-iframe-api-loader`.
- Rendered a controlled `iframe` mount target with explicit `allow` permissions and no `allowFullScreen` duplicate.
- Rewired player events:
  - `Ready`
  - `DurationChange`
  - `Play`
  - `Pause`
  - `Ended`
  - `TimeUpdate`
  - `Error`
- Preserved local wrapper behavior:
  - loading overlay
  - retry timeout and remount key
  - watched threshold at `95%`
  - single-fire `onEnded` + `onWatched`
  - error normalization
- Updated dependency manifests to remove `@kinescope/react-kinescope-player`.

### Fixes addressed

- None. Reviewer, Security, and Tester did not open blocking fix IDs for this phase.

### Reviewer

- Verdict: Pass
- Notes:
  - Change stays within Phase 1 scope.
  - Existing public `KinescopePlayer` contract remains intact.
  - Consumer components do not require API changes.

### Security

- Verdict: Pass
- Notes:
  - Player instances are destroyed during cleanup.
  - Event callbacks are guarded by active-attempt checks to avoid stale async callbacks.
  - The iframe keeps an explicit `allow` list without duplicate fullscreen attributes.

### Tester

- Verdict: Pass
- Commands run:
  - `npm run lint -- src/features/daily-plan/_ui/kinescope-player.tsx`
  - `npm run lint:types`
- Verification notes:
  - Static verification passed.
  - No additional automated tests were added in this phase because the migrated behavior depends on third-party iframe lifecycle in the browser.
  - Recommended follow-up: manual smoke test for workout card playback, completion tracking, and course dialog autoplay in local dev.
