# Server Helpers

Shared utilities that simplify server-side TRPC usage with the Inversify DI container.

## `createServerQueryClient(config?)`

Creates a new `QueryClient` instance (from TanStack Query) using an optional `QueryClientConfig`. Use this in SSR/SSG when you need a fresh cache per request.

```ts
import { createServerQueryClient } from '@/shared/api/server-helpers'

const queryClient = createServerQueryClient({
  defaultOptions: { queries: { staleTime: 5_000 } },
})
```

## `resolveController(container, ControllerClass)`

Extracts a controller instance (extending the shared `Controller` base class) from the Inversify container. Throws if the controller is not registered.

```ts
const workoutController = resolveController(serverContainer, WorkoutController)
```

## `createControllerHelpers(options)`

Builds server-side helpers for a specific controller/router.

```ts
const { controller, helpers, queryClient } = createControllerHelpers({
  container: server,
  controller: CourseEnrollmentController,
  ctx,
})

await helpers.course.getUserEnrollments.fetch({ userId })
const dehydrated = helpers.dehydrate()
```

### Options

- `container`: Inversify container (e.g. the app-level `server`).
- `controller`: Controller constructor (e.g. `CourseEnrollmentController`).
- `ctx`: TRPC context resolved for the current request.
- `queryClient` (optional): reuse an existing `QueryClient`.
- `queryClientConfig` (optional): configuration passed to `createServerQueryClient` if no client is supplied.

### Returns

- `controller`: The resolved controller instance (already bound in DI).
- `helpers`: Result of `createServerSideHelpers` for the controller's router. Provides `.dehydrate()` and type-safe access to router procedures.
- `queryClient`: The `QueryClient` used for prefetching.

### Typical flow

1. Resolve the TRPC context (`ContextFactory.createContext`).
2. Call `createControllerHelpers` for each controller you need.
3. Use `helpers.<router path>.<procedure>.prefetch/fetch` to pre-warm data.
4. Call `helpers.dehydrate()` (once per shared query client) to pass state into `<HydrationBoundary>`.

```

```
