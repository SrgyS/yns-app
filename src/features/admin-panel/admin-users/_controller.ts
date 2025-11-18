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
import { GetAdminUserDetailService } from './_services/get-admin-user-detail'
import { StaffPermissionFlags } from './_domain/staff-permission'
import { StaffPermissionService } from './_services/staff-permissions'
import { AdminUserDetail } from './_domain/user-detail'

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
  constructor(
    private readonly listAdminUsersService: ListAdminUsersService,
    private readonly staffPermissionService: StaffPermissionService,
    private readonly getAdminUserDetailService: GetAdminUserDetailService
  ) {
    super()
  }

  private ensureAdmin(role: string) {
    if (role !== 'ADMIN' && role !== 'STAFF') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
  }

  private async getPermissions(ctx: { session: { user: { id: string; role: ROLE } } }): Promise<StaffPermissionFlags> {
    return this.staffPermissionService.getPermissionsForUser({
      id: ctx.session.user.id,
      role: ctx.session.user.role,
    })
  }

  public router = router({
    admin: router({
      user: router({
        list: authorizedProcedure
          .input(listInputSchema)
          .query(async ({ ctx, input }) => {
            this.ensureAdmin(ctx.session.user.role)
            await this.getPermissions(ctx)

            return this.listAdminUsersService.exec({
              ...input,
              hasAvatar: input.hasAvatar ?? 'any',
            })
          }),
        permissions: authorizedProcedure.query(async ({ ctx }) => {
          this.ensureAdmin(ctx.session.user.role)
          return this.getPermissions(ctx)
        }),
        detail: authorizedProcedure
          .input(z.object({ userId: z.string().min(1) }))
          .query(async ({ ctx, input }): Promise<AdminUserDetail> => {
            this.ensureAdmin(ctx.session.user.role)
            await this.getPermissions(ctx)
            return this.getAdminUserDetailService.exec(input.userId)
          }),
      }),
    }),
  })
}
