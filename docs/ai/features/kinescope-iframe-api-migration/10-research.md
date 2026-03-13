# Research: Kinescope iframe API migration

## Scope

- This document describes the current Kinescope player integration as implemented in:
  - `src/features/daily-plan/_ui/kinescope-player.tsx`
  - `src/features/daily-plan/_ui/exercise-card.tsx`
  - `src/features/practices/_ui/practice-workout-card.tsx`
  - `src/app/(site)/courses/_ui/blocks/video-block.tsx`
  - `src/app/platform/(app-shell)/(paid)/knowledge/[categoryId]/page.tsx`
  - `package.json`

## Current dependencies

- `package.json` declares `@kinescope/react-kinescope-player` and `@kinescope/player-iframe-api-loader` under `dependencies`.
- `src/features/daily-plan/_ui/kinescope-player.tsx` imports the default export `ReactKinescopePlayer` and event types `EventErrorTypes`, `EventReadyTypes`, `EventTimeUpdateTypes`, and `EventDurationChangeTypes` from `@kinescope/react-kinescope-player`.
- No application file under `src/` imports `@kinescope/player-iframe-api-loader`.

## Current shared player component

### Entrypoint

- The reusable player entrypoint is `KinescopePlayer` in `src/features/daily-plan/_ui/kinescope-player.tsx`.
- `KinescopePlayerProps` accepts:
  - `videoId`
  - `options`
  - `completionState`
  - `className`
  - `style`
  - callbacks `onEnded`, `onWatched`, `onError`, `onReady`, `onPlay`, `onPause`

### Local option model

- `KinescopePlayerOptions` in `src/features/daily-plan/_ui/kinescope-player.tsx` mirrors a subset of Kinescope create options:
  - `url`
  - `size.width`, `size.height`
  - `behavior.autoPlay`, `behavior.autoPause`, `behavior.preload`, `behavior.localStorage`, `behavior.loop`, `behavior.playsInline`, `behavior.muted`, `behavior.textTrack`, `behavior.playlist`
  - `ui.language`, `ui.controls`, `ui.mainPlayButton`, `ui.playbackRateButton`, `ui.watermark`
  - `theme`
  - `settings.externalId`
  - top-level `autoplay`

### Internal state and refs

- `KinescopePlayer` manages:
  - `watchedReportedRef`
  - `playbackStartedRef`
  - `durationRef`
  - `isReadyRef`
  - `retryCountRef`
  - `currentAttemptRef`
  - state `playerInstanceKey`
  - state `isLoading`
- Constants in the file define:
  - `WATCHED_PERCENT_THRESHOLD = 0.95`
  - `DEFAULT_HEIGHT = 300`
  - `PLAYER_READY_TIMEOUT_MS = 4_000`
  - `MAX_INIT_RETRIES = 1`

### Current data flow

1. Entry:
   - Caller renders `KinescopePlayer` with `videoId` or `options.url`.
2. Validation and normalization:
   - `extractVideoIdFromUrl(url)` extracts the id from `.../embed/...`.
   - `resolvedVideoId` is derived via `useMemo`.
   - `toStyleSize(...)` normalizes CSS width and height strings.
3. View-model state reset:
   - A `useEffect` keyed by `resolvedVideoId` resets refs, resets `playerInstanceKey` to `0`, and sets `isLoading`.
4. Retry logic:
   - `retryPlayer(attemptKey)` checks `currentAttemptRef`, `isReadyRef`, and `retryCountRef`.
   - A `useEffect` keyed by `playerInstanceKey` and `resolvedVideoId` starts a timeout of `PLAYER_READY_TIMEOUT_MS`.
   - If the player is still not ready, `retryPlayer` increments `retryCountRef`, increments `currentAttemptRef`, and bumps `playerInstanceKey` to remount the player component once.
5. Player creation:
   - JSX renders `ReactKinescopePlayer` when `resolvedVideoId` is available.
   - The component passes through normalized options and callback handlers.
6. Event handling:
   - `handleInit()` sets `isReadyRef.current = true` and hides the loading overlay.
   - `handleReady(event)` stores `event.duration`, sets ready state, hides the loading overlay, and calls `onReady`.
   - `handleDurationChange(event)` updates `durationRef`.
   - `handlePlay()` sets `playbackStartedRef.current = true` and calls `onPlay`.
   - `handleTimeUpdate(event)` computes `watchedPercent = event.currentTime / durationRef.current`.
   - `reportWatched()` calls both `onEnded` and `onWatched` once after playback has started.
   - `handlePlayerError(error)` normalizes the error, hides the loading overlay, and calls `onError`.
7. Response:
   - The component renders a wrapper `div`, the player, and a loading overlay with `Spinner` while `isLoading` is `true`.

### Current event mapping to consumer callbacks

- `ReactKinescopePlayer.onInit -> handleInit`
- `ReactKinescopePlayer.onReady -> handleReady`
- `ReactKinescopePlayer.onDurationChange -> handleDurationChange`
- `ReactKinescopePlayer.onPlay -> handlePlay`
- `ReactKinescopePlayer.onPause -> onPause`
- `ReactKinescopePlayer.onEnded -> reportWatched`
- `ReactKinescopePlayer.onTimeUpdate -> handleTimeUpdate`
- `ReactKinescopePlayer.onError -> handlePlayerError`
- `ReactKinescopePlayer.onInitError -> handlePlayerError`
- `ReactKinescopePlayer.onJSLoadError -> handlePlayerError(new Error(...))`

## Current consumers

### Exercise card

- `src/features/daily-plan/_ui/exercise-card.tsx` renders `KinescopePlayer` inside `ExerciseCard`.
- `ExerciseCard.handleVideoCompleted()` marks the workout completed via `toggleCompleted(true)` when `onEnded` fires and completion is not yet recorded.
- `ExerciseCard.handleVideoPlay()` and `ExerciseCard.handleVideoPause()` toggle overlay visibility via local state `isVideoPlaying`.
- `ExerciseCard` passes `completionState={isCompleted}` so `KinescopePlayer` can reset `watchedReportedRef` when completion is false.

### Practice workout card

- `src/features/practices/_ui/practice-workout-card.tsx` renders `KinescopePlayer` inside `PracticeWorkoutCard`.
- It uses `onPlay`, `onPause`, and `onEnded` to toggle `isVideoPlaying`.
- It does not pass `completionState`, `onWatched`, or `onError`.

### Site course video block

- `src/app/(site)/courses/_ui/blocks/video-block.tsx` renders `KinescopePlayer` inside a dialog.
- It passes `options.behavior.autoPlay = true` and `options.ui.language = 'ru'`.
- It does not subscribe to playback progress or completion callbacks.

## Separate direct iframe usage

- `src/app/platform/(app-shell)/(paid)/knowledge/[categoryId]/page.tsx` embeds Kinescope with a plain `iframe`.
- This page does not reuse `KinescopePlayer`.
- It passes `allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock;"`.

## External library contracts currently relied upon

- `node_modules/@kinescope/react-kinescope-player/dist/player.d.ts` defines the React wrapper props:
  - `videoId`
  - sizing props
  - behavior props
  - UI props
  - event callbacks such as `onInit`, `onReady`, `onPlay`, `onPause`, `onEnded`, `onTimeUpdate`, `onDurationChange`, `onError`, `onInitError`, and `onJSLoadError`
- `node_modules/@kinescope/player-iframe-api-loader/types/index.d.ts` defines:
  - `Kinescope.IframePlayer.CreateOptions`
  - `Kinescope.IframePlayer.Player`
  - player methods including `play`, `pause`, `stop`, `seekTo`, `getDuration`, `destroy`, and `setOptions`
  - player event map entries `Ready`, `Play`, `Pause`, `Ended`, `TimeUpdate`, `DurationChange`, `Error`, and `Destroy`
- `node_modules/@kinescope/player-iframe-api-loader/loader.d.ts` defines `load(version?) -> Promise<Kinescope.IframePlayer>`.

## Constraints observed in code

- The public app-level contract currently depends on the local `KinescopePlayerProps`, not on `@kinescope/react-kinescope-player` directly.
- The component must remain client-side because it uses React state, refs, effects, and browser-only player APIs.
- Consumers rely on these current behaviors:
  - loading overlay before player readiness
  - automatic one-time retry when readiness does not happen in 4 seconds
  - completion reporting only after playback starts
  - watched threshold at `95%`
  - `onEnded` and `onWatched` both firing from a single completion path
- `KinescopePlayer` currently treats `handleInit()` as sufficient to clear the loading state before `onReady`.

## Open questions

- The current code imports only a subset of options from the React wrapper. It does not show whether any future consumers need imperative player methods such as `play()` or `seekTo()`.
- The current code does not indicate whether Kinescope player script loading failures are common in production or only observed in local development.
- The current code does not document whether the separate knowledge-page `iframe` should also be migrated to the shared `KinescopePlayer` component.
