# Design: Kinescope iframe API migration

## Goal

- Replace the implementation detail `@kinescope/react-kinescope-player` inside `src/features/daily-plan/_ui/kinescope-player.tsx` with direct usage of `@kinescope/player-iframe-api-loader`.
- Preserve the existing public component contract `KinescopePlayerProps`.
- Keep current consumer behavior unchanged for `ExerciseCard`, `PracticeWorkoutCard`, and `VideoBlockComponent`.

## Context

- Users watch Kinescope-hosted videos in workout cards and course dialogs.
- The application owns a shared wrapper component `KinescopePlayer`.
- The wrapper currently delegates creation and event wiring to a third-party React wrapper.
- The target design removes that extra React wrapper layer and binds Kinescope iframe API directly inside the local component.

## Container

- Browser client:
  - React component `KinescopePlayer`
  - Kinescope iframe API loader `load(...)`
  - Kinescope iframe player instance `Kinescope.IframePlayer.Player`
- Existing consumers remain unchanged:
  - `ExerciseCard`
  - `PracticeWorkoutCard`
  - `VideoBlockComponent`

## Component Diagram

```text
+---------------------+        props/events        +----------------------+
| ExerciseCard        | -------------------------> | KinescopePlayer      |
| PracticeWorkoutCard |                            | (local wrapper)      |
| VideoBlockComponent | <------------------------- | onEnded/onPlay/etc.  |
+---------------------+                            +----------+-----------+
                                                              |
                                                              | load()
                                                              v
                                                   +----------------------+
                                                   | iframe api loader    |
                                                   | @kinescope/player... |
                                                   +----------+-----------+
                                                              |
                                                              | create()
                                                              v
                                                   +----------------------+
                                                   | Kinescope iframe     |
                                                   | player instance      |
                                                   +----------------------+
```

## To-be data flow

1. `KinescopePlayer` receives `videoId` or `options.url`.
2. The component derives `resolvedVideoId` and a `CreateOptions` object with `url`.
3. A `useEffect` creates a host DOM node reference for the player.
4. The component calls `load()` from `@kinescope/player-iframe-api-loader`.
5. The returned factory creates the player in the host element.
6. The component subscribes directly to iframe player events:
   - `Ready`
   - `DurationChange`
   - `Play`
   - `Pause`
   - `Ended`
   - `TimeUpdate`
   - `Error`
7. Local refs preserve current logic:
   - loading state
   - retry on missing readiness
   - watched threshold
   - single-fire completion reporting
8. Cleanup destroys the player instance and detaches event listeners.

## Main sequence

```text
Consumer -> KinescopePlayer: render(videoId, options, callbacks)
KinescopePlayer -> iframeApiLoader: load()
iframeApiLoader --> KinescopePlayer: factory
KinescopePlayer -> factory: create(hostElement, createOptions)
factory --> KinescopePlayer: player
KinescopePlayer -> player: on(Ready/Play/Pause/Ended/TimeUpdate/DurationChange/Error)
player --> KinescopePlayer: Ready
KinescopePlayer --> Consumer: onReady()
player --> KinescopePlayer: Play
KinescopePlayer --> Consumer: onPlay()
player --> KinescopePlayer: TimeUpdate
KinescopePlayer -> KinescopePlayer: compute watched threshold
KinescopePlayer --> Consumer: onEnded(), onWatched() once
KinescopePlayer -> player: destroy() on unmount/remount
```

## Component-level design

### Public contract

- Keep `KinescopePlayerProps` unchanged.
- Keep `KinescopePlayerOptions` unchanged unless type adaptation is strictly required for `CreateOptions`.

### Internal structure

- Replace `ReactKinescopePlayer` JSX with:
  - a wrapper `div`
  - an inner host `div` or `iframe` mount target managed by `ref`
  - existing `Spinner` overlay
- Introduce local helper to build the Kinescope embed URL:
  - `https://kinescope.io/embed/<videoId>`
- Introduce local helper to map `KinescopePlayerOptions` to `Kinescope.IframePlayer.CreateOptions`.
- Use direct event handlers that consume `event.data` from `IframePlayer.Player.EventHandler`.

## tRPC contracts

- No tRPC procedures are added or modified.
- No input/output DTOs change.
- No API error contract changes.

## Prisma and storage

- No Prisma schema changes.
- No migrations.
- No storage format changes.

## Security

### Threats

- Untrusted URL or video id injection into iframe source.
- Cross-origin iframe permissions broader than required.
- Orphaned player instances after unmount causing stale event callbacks.

### Mitigations

- Continue deriving `resolvedVideoId` from either explicit `videoId` or sanitized `options.url` parsing.
- Build the embed URL from the resolved id instead of forwarding arbitrary full URLs when possible.
- Keep the current `allow` set scoped to Kinescope playback features only.
- Destroy player instances in effect cleanup and guard callback execution by attempt key and mounted refs.

## Error handling

- Preserve current normalization via `normalizePlayerError`.
- Map loader failure, create failure, player `Error` event, and destroy failure to the existing `onError` callback path.
- Preserve current fallback message for script loading failure semantics.

## Compatibility requirements

- `ExerciseCard` must continue to auto-complete the workout after 95% watched or end-of-video.
- `PracticeWorkoutCard` must continue to toggle the overlay based on play/pause/end events.
- `VideoBlockComponent` must continue to autoplay in the dialog when configured.
- Styling contract of `className`, `style`, width, and height must remain unchanged.

## Non-goals

- No migration of the separate knowledge-page plain `iframe` in this change.
- No new imperative ref API for consumers.
- No redesign of the current retry timing constants.
