import { QueryClient, type QueryClientConfig } from '@tanstack/react-query'
import { createServerSideHelpers } from '@trpc/react-query/server'
import type { AnyRouter, inferRouterContext } from '@trpc/server'
import type { Container } from 'inversify'

import { Controller } from '@/kernel/lib/trpc/module'

type ControllerConstructor<TController extends Controller> = new (
  ...args: any[]
) => TController

export const createServerQueryClient = (config?: QueryClientConfig) =>
  new QueryClient(config)

export function resolveController<TController extends Controller>(
  container: Container,
  ControllerClass: ControllerConstructor<TController>
): TController {
  const controllers = container.getAll(Controller)
  const resolved = controllers.find(
    (controller): controller is TController =>
      controller instanceof ControllerClass
  )

  if (!resolved) {
    throw new Error(
      `${ControllerClass.name} is not registered in the Inversify container`
    )
  }

  return resolved
}

interface CreateControllerHelpersOptions<TController extends Controller> {
  container: Container
  controller: ControllerConstructor<TController>
  ctx: inferRouterContext<TController['router']>
  queryClient?: QueryClient
  queryClientConfig?: QueryClientConfig
}

type RouterOf<TController extends Controller> = TController['router']

type RawHelpersFor<TRouter extends AnyRouter> = ReturnType<
  typeof createServerSideHelpers<TRouter>
>

type HelpersFor<TRouter extends AnyRouter> = Exclude<
  RawHelpersFor<TRouter>,
  string
>

interface ControllerHelpersResult<
  TController extends Controller,
  TRouter extends AnyRouter,
> {
  controller: TController
  helpers: HelpersFor<TRouter>
  queryClient: QueryClient
}

export function createControllerHelpers<TController extends Controller>({
  container,
  controller,
  ctx,
  queryClient,
  queryClientConfig,
}: CreateControllerHelpersOptions<TController>): ControllerHelpersResult<
  TController,
  RouterOf<TController>
> {
  const resolvedController = resolveController(container, controller)
  const client =
    queryClient ??
    createServerQueryClient(queryClientConfig)

  const rawHelpers = createServerSideHelpers<RouterOf<TController>>({
    router: resolvedController.router,
    ctx,
    queryClient: client,
  } as any)

  if (typeof rawHelpers === 'string') {
    throw new Error(rawHelpers)
  }

  const helpers = rawHelpers as Exclude<typeof rawHelpers, string>

  return {
    controller: resolvedController,
    helpers: helpers as HelpersFor<RouterOf<TController>>,
    queryClient: client,
  }
}
