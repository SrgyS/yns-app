import { z } from 'zod'
import { injectable } from 'inversify'
import { ROLE } from '@prisma/client'
import { TRPCError } from '@trpc/server'

import {
  Controller,
  checkAbilityProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { ListAdminUsersService } from './_services/users-list'
import { GetAdminUserDetailService } from './_services/get-admin-user-detail'
import { StaffPermissionService } from './_services/staff-permissions'
import { AdminUserDetail } from './_domain/user-detail'
import { GrantCourseAccessService } from './_services/grant-course-access'
import { CloseUserAccessService } from './_services/close-user-access'
import { ExtendUserAccessService } from './_services/extend-user-access'
import { FreezeUserAccessService } from './_services/freeze-user-access'
import { UnfreezeUserAccessService } from './_services/unfreeze-user-access'
import { createAdminAbility } from './_domain/ability'
import { SharedSession } from '@/kernel/domain/user'
import { UpdateAdminUserService } from './_services/update-admin-user'

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

const grantAccessInput = z.object({
  userId: z.string().min(1),
  courseId: z.string().min(1),
  expiresAt: z.string().datetime().optional().nullable(),
})

const closeAccessInput = z.object({
  accessId: z.string().min(1),
})

const extendAccessInput = z.object({
  accessId: z.string().min(1),
  expiresAt: z.string().datetime(),
})

const freezeAccessInput = z.object({
  accessId: z.string().min(1),
  start: z.string().datetime(),
  end: z.string().datetime(),
})

const unfreezeAccessInput = z.object({
  accessId: z.string().min(1),
  freezeId: z.string().min(1),
})

const updateUserInput = z.object({
  userId: z.string().min(1),
  role: z.nativeEnum(ROLE).optional(),
  permissions: z
    .object({
      canViewPayments: z.boolean().optional(),
      canEditAccess: z.boolean().optional(),
      canManageUsers: z.boolean().optional(),
      canGrantAccess: z.boolean().optional(),
      canLoginAsUser: z.boolean().optional(),
      canManageCourses: z.boolean().optional(),
    })
    .optional(),
})

@injectable()
export class AdminUsersController extends Controller {
  constructor(
    private readonly listAdminUsersService: ListAdminUsersService,
    private readonly staffPermissionService: StaffPermissionService,
    private readonly getAdminUserDetailService: GetAdminUserDetailService,
    private readonly grantCourseAccessService: GrantCourseAccessService,
    private readonly closeUserAccessService: CloseUserAccessService,
    private readonly extendUserAccessService: ExtendUserAccessService,
    private readonly freezeUserAccessService: FreezeUserAccessService,
    private readonly unfreezeUserAccessService: UnfreezeUserAccessService,
    private readonly updateAdminUserService: UpdateAdminUserService
  ) {
    super()
  }

  private ensureAdmin(role: ROLE) {
    if (role !== 'ADMIN' && role !== 'STAFF') {
      throw new TRPCError({ code: 'FORBIDDEN' })
    }
  }

  private readonly createAbility = async (session: SharedSession) => {
    const role = session.user.role as ROLE
    this.ensureAdmin(role)

    const permissions = await this.staffPermissionService.getPermissionsForUser(
      {
        id: session.user.id,
        role,
      }
    )

    return createAdminAbility(session, permissions)
  }

  public router = router({
    admin: router({
      user: router({
        list: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageUsers,
        })
          .input(listInputSchema)
          .query(async ({ input }) => {
            return this.listAdminUsersService.exec({
              ...input,
              hasAvatar: input.hasAvatar ?? 'any',
            })
          }),
        permissions: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canVisitAdminPanel,
        }).query(({ ctx }) => ctx.ability),
        update: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageUsers,
        })
          .input(updateUserInput)
          .mutation(async ({ ctx, input }) => {
            if (ctx.session.user.role !== 'ADMIN') {
              throw new TRPCError({ code: 'FORBIDDEN' })
            }

            await this.updateAdminUserService.exec(input)

            return { success: true }
          }),
        detail: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageUsers,
        })
          .input(z.object({ userId: z.string().min(1) }))
          .query(async ({ input }): Promise<AdminUserDetail> => {
            return this.getAdminUserDetailService.exec(input.userId)
          }),
        access: router({
          grant: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canGrantAccess,
          })
            .input(grantAccessInput)
            .mutation(async ({ ctx, input }) => {
              await this.grantCourseAccessService.exec({
                userId: input.userId,
                courseId: input.courseId,
                adminId: ctx.session.user.id,
                expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
              })

              return { success: true }
            }),
          close: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canEditAccess,
          })
            .input(closeAccessInput)
            .mutation(async ({ ctx, input }) => {
              await this.closeUserAccessService.exec({
                accessId: input.accessId,
                adminId: ctx.session.user.id,
              })

              return { success: true }
            }),
          extend: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canEditAccess,
          })
            .input(extendAccessInput)
            .mutation(async ({ ctx, input }) => {
              await this.extendUserAccessService.exec({
                accessId: input.accessId,
                adminId: ctx.session.user.id,
                expiresAt: new Date(input.expiresAt),
              })

              return { success: true }
            }),
          freeze: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canEditAccess,
          })
            .input(freezeAccessInput)
            .mutation(async ({ ctx, input }) => {
              await this.freezeUserAccessService.exec({
                accessId: input.accessId,
                adminId: ctx.session.user.id,
                start: new Date(input.start),
                end: new Date(input.end),
              })

              return { success: true }
            }),
          freezeCancel: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canEditAccess,
          })
            .input(unfreezeAccessInput)
            .mutation(async ({ ctx, input }) => {
              await this.unfreezeUserAccessService.exec({
                accessId: input.accessId,
                freezeId: input.freezeId,
                adminId: ctx.session.user.id,
              })

              return { success: true }
            }),
        }),
      }),
    }),
  })
}
