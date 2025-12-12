import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { ROLE } from '@prisma/client'
import { injectable } from 'inversify'
import { dbClient } from '@/shared/lib/db'

import {
  Controller,
  checkAbilityProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { createAdminAbility } from '../users/_domain/ability'
import { StaffPermissionService } from '../users/_services/staff-permissions'
import { DeleteCourseService } from '@/entities/course/_services/delete-course'
import {
  courseQuerySchema,
  courseUpsertInputSchema,
  lookupQuerySchema,
  dailyPlanUpdateSchema,
} from './_schemas'
import { SharedSession } from '@/kernel/domain/user'
import { CoursesReadService } from './_services/courses-read'
import { CoursesWriteService } from './_services/courses-write'

@injectable()
export class AdminCoursesController extends Controller {
  constructor(
    private readonly staffPermissionService: StaffPermissionService,
    private readonly deleteCourseService: DeleteCourseService,
    private readonly coursesReadService: CoursesReadService,
    private readonly coursesWriteService: CoursesWriteService
  ) {
    super()
  }

  private ensureAdmin(role: ROLE) {
    if (role === 'ADMIN' || role === 'STAFF') {
      return
    }

    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  private readonly createAbility = async (session: SharedSession) => {
    const userRecord = await dbClient.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!userRecord) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Пользователь не найден',
      })
    }

    const role = userRecord.role
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
    adminCourses: router({
      course: router({
        list: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        }).query(async () => {
          return this.coursesReadService.listCourses()
        }),
        get: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(courseQuerySchema)
          .query(async ({ input }) => {
            const course = await this.coursesReadService.findCourse(input)
            if (!course) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Курс не найден',
              })
            }

            return this.coursesReadService.mapCourseDetail(course)
          }),
        upsert: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(courseUpsertInputSchema)
          .mutation(async ({ input }) => {
            const result = await this.coursesWriteService.upsertCourse(input)
            
            const course = await this.coursesReadService.findCourse({ id: result.id })
             if (!course) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Course not found after upsert',
              })
            }
            return this.coursesReadService.mapCourseDetail(course)
          }),
        setDraft: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ id: z.string().min(1), draft: z.boolean() }))
          .mutation(async ({ input }) => {
            return this.coursesWriteService.setDraft(input.id, input.draft)
          }),
        setShowRecipes: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ id: z.string().min(1), showRecipes: z.boolean() }))
          .mutation(async ({ input }) => {
            return this.coursesWriteService.setShowRecipes(input.id, input.showRecipes)
          }),
        delete: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ id: z.string().min(1) }))
          .mutation(async ({ ctx, input }) => {
            await this.deleteCourseService.exec({ id: input.id }, ctx.ability)
            return { success: true }
          }),
        lookup: router({
          workouts: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canManageCourses,
          })
            .input(lookupQuerySchema)
            .query(async ({ input }) => ({
              items: await this.coursesReadService.lookupWorkouts(input),
            })),
          recipes: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canManageCourses,
          })
            .input(lookupQuerySchema)
            .query(async ({ input }) => ({
              items: await this.coursesReadService.lookupRecipes(input),
            })),
          mealPlans: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canManageCourses,
          })
            .input(lookupQuerySchema)
            .query(async ({ input }) => {
              return this.coursesReadService.lookupMealPlans(input)
            }),
        }),
        videoMeta: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ videoId: z.string().min(1) }))
          .query(async ({ input }) => {
            const meta = await this.coursesReadService.getVideoMeta(input.videoId)
            return meta
          }),
        dailyPlan: router({
          update: checkAbilityProcedure({
            create: this.createAbility,
            check: ability => ability.canManageCourses,
          })
            .input(dailyPlanUpdateSchema)
            .mutation(async ({ input }) => {
              return this.coursesWriteService.updateDailyPlan(input)
            }),
        }),
      }),
    }),
  })
}
