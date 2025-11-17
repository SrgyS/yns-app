import { z } from 'zod'
import { injectable } from 'inversify'
import { ROLE } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import {
  Controller,
  authorizedProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { ListAdminUsersService } from './_services/users-list'

const avatarFilterSchema = z.enum(['any', 'with', 'without'])

const listInputSchema = z.object({
  id: z.string().trim().optional(),
  email: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  role: z.nativeEnum(ROLE).optional(),
  hasAvatar: avatarFilterSchema.default('any'),
  hasActiveAccess: z.enum(['active', 'inactive', 'any']).default('any'),
  sortBy: z.enum(['createdAt', 'name']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

@injectable()
export class AdminUsersController extends Controller {
  constructor(private readonly listAdminUsersService: ListAdminUsersService) {
    super()
  }

  private ensureAdmin(role: string) {
    if (role !== 'ADMIN' && role !== 'STAFF') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
  }

  public router = router({
    admin: router({
      user: router({
        list: authorizedProcedure
          .input(listInputSchema)
          .query(async ({ ctx, input }) => {
            this.ensureAdmin(ctx.session.user.role)

            return this.listAdminUsersService.exec({
              ...input,
              hasAvatar: input.hasAvatar ?? 'any',
            })
          }),
      }),
    }),
  })
}
