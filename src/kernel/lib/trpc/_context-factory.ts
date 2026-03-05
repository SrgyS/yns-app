import { injectable } from 'inversify'
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { SessionService } from '../next-auth/_session-service'

@injectable()
export class ContextFactory {
  constructor(private sessionService: SessionService) {}

  createContext = async (opts?: FetchCreateContextFnOptions) => {
    const session = await this.sessionService.get()

    const request = opts?.req

    return {
      session,
      requestMeta: {
        requestUrl: request?.url ?? null,
        method: request?.method ?? null,
        origin: request?.headers.get('origin') ?? null,
        referer: request?.headers.get('referer') ?? null,
        host: request?.headers.get('host') ?? null,
        forwardedHost: request?.headers.get('x-forwarded-host') ?? null,
        forwardedProto: request?.headers.get('x-forwarded-proto') ?? null,
      },
    }
  }
}
