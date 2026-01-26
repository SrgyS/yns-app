import {
  Controller,
  authorizedProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { injectable } from 'inversify'
import { z } from 'zod'
import { CourseContentType, DayOfWeek } from '@prisma/client'
import {
  GetCourseService,
  GetActiveEnrollmentService,
  GetUserWorkoutDaysService,
  UpdateWorkoutDaysService,
  ActivateEnrollmentService,
  GetEnrollmentByIdService,
} from '@/entities/course/module'
import { CreateUserCourseEnrollmentWithCourseAccessService } from './_services/create-user-course-enrollment-with-access'
import { CheckCourseAccessService } from '@/entities/user-access/module'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { GetAvailableWeeksService } from './_services/get-available-weeks'
import { GetAccessibleEnrollmentsService } from './_services/get-accessible-enrollments'
import { GetCourseEnrollmentService } from './_services/get-course-enrollment'
import { GetUserEnrollmentsService } from './_services/get-user-enrollments'
import { GetEnrollmentByCourseSlugService } from './_services/get-enrollment-by-course-slug'
import { logger } from '@/shared/lib/logger'
import type { PaidAccessState } from './_vm/paid-access-types'
import { toUserCourseEnrollmentApi } from './_lib/map-user-course-enrollment'

const LOG_PREFIX = '[CourseEnrollmentController]'

async function logTiming<T>(
  label: string,
  action: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    return await action()
  } finally {
    const duration = Date.now() - start
    logger.info({
      msg: `${LOG_PREFIX} ${label}`,
      durationMs: duration,
    })
  }
}

@injectable()
export class CourseEnrollmentController extends Controller {
  constructor(
    private readonly CreateUserCourseEnrollmentWithCourseAccessService: CreateUserCourseEnrollmentWithCourseAccessService,
    private readonly getCourseService: GetCourseService,
    private readonly getCourseEnrollmentService: GetCourseEnrollmentService,
    private readonly getUserEnrollmentsService: GetUserEnrollmentsService,
    private readonly getActiveEnrollmentService: GetActiveEnrollmentService,
    private readonly getUserWorkoutDaysService: GetUserWorkoutDaysService,
    private readonly updateWorkoutDaysService: UpdateWorkoutDaysService,
    private readonly activateEnrollmentService: ActivateEnrollmentService,
    private readonly getEnrollmentByCourseSlugService: GetEnrollmentByCourseSlugService,
    private readonly getEnrollmentByIdService: GetEnrollmentByIdService,
    private readonly getAvailableWeeksService: GetAvailableWeeksService,
    private readonly getAccessibleEnrollmentsService: GetAccessibleEnrollmentsService,
    private readonly checkCourseAccessService: CheckCourseAccessService,
    private readonly userAccessRepository: UserAccessRepository
  ) {
    super()
  }

  public router = router({
    course: router({
      getAccessibleEnrollments: authorizedProcedure.query(async ({ ctx }) => {
        const accessibleEnrollments = await logTiming(
          'getAccessibleEnrollmentsService.exec',
          () => this.getAccessibleEnrollmentsService.exec(ctx.session.user.id)
        )

        if (accessibleEnrollments.length === 0) {
          const emptyState: PaidAccessState = {
            hasAccess: false,
            activeEnrollment: null,
            activeCourseSlug: null,
            accessExpiresAt: null,
            accessStartedAt: null,
            accessibleCourses: [],
          }
          return emptyState
        }

        const activeAccessible = accessibleEnrollments.find(
          entry => entry.enrollment.active && entry.course.slug
        )

        const accessibleCourses = accessibleEnrollments.map(entry => ({
          enrollment: toUserCourseEnrollmentApi(entry.enrollment),
          accessExpiresAt: entry.accessExpiresAt
            ? entry.accessExpiresAt.toISOString()
            : null,
          accessStartedAt: entry.accessStartedAt.toISOString(),
          setupCompleted: entry.setupCompleted,
        }))

        const paidAccessState: PaidAccessState = {
          hasAccess: true,
          activeEnrollment: activeAccessible
            ? toUserCourseEnrollmentApi(activeAccessible.enrollment)
            : null,
          activeCourseSlug: activeAccessible?.course.slug ?? null,
          accessExpiresAt: activeAccessible?.accessExpiresAt
            ? activeAccessible.accessExpiresAt.toISOString()
            : null,
          accessStartedAt: activeAccessible
            ? activeAccessible.accessStartedAt.toISOString()
            : null,
          accessibleCourses,
        }

        return paidAccessState
      }),

      createEnrollment: authorizedProcedure
        .input(
          z.object({
            courseId: z.string(),
            startDate: z.coerce.date(),
            selectedWorkoutDays: z.array(z.nativeEnum(DayOfWeek)),
            courseContentType: z.nativeEnum(CourseContentType),
            hasFeedback: z.boolean().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const enrollment =
            await this.CreateUserCourseEnrollmentWithCourseAccessService.exec({
              userId: ctx.session.user.id,
              ...input,
            })
          return enrollment
        }),

      getEnrollment: authorizedProcedure
        .input(
          z.object({
            userId: z.string(),
            courseId: z.string(),
          })
        )
        .query(async ({ input }) => {
          const enrollment = await logTiming(
            'getCourseEnrollmentService.exec',
            () =>
              this.getCourseEnrollmentService.exec(input.userId, input.courseId)
          )
          return enrollment
        }),

      getEnrollmentByCourseSlug: authorizedProcedure
        .input(
          z.object({
            userId: z.string(),
            courseSlug: z.string(),
          })
        )
        .query(async ({ input }) => {
          const enrollment = await logTiming(
            'getEnrollmentByCourseSlugService.exec',
            () =>
              this.getEnrollmentByCourseSlugService.exec(
                input.userId,
                input.courseSlug
              )
          )
          return enrollment
        }),
      checkAccessByCourseSlug: authorizedProcedure
        .input(
          z.object({
            userId: z.string(),
            courseSlug: z.string(),
          })
        )
        .query(async ({ input }) => {
          const course = await logTiming('getCourseService.exec', () =>
            this.getCourseService.exec({
              slug: input.courseSlug,
            })
          )

          if (!course || course.tariffs.length === 0) {
            return {
              hasAccess: false,
              enrollment: null,
              activeEnrollment: null,
              isActive: false,
              accessExpiresAt: null,
              setupCompleted: false,
            }
          }

          const hasAccess = await logTiming(
            'checkCourseAccessService.exec',
            () =>
              this.checkCourseAccessService.exec({
                userId: input.userId,
                course: {
                  id: course.id,
                  tariffs: course.tariffs,
                  contentType: course.contentType,
                },
              })
          )

          const enrollment = await logTiming(
            'getEnrollmentByCourseSlugService.exec',
            () =>
              this.getEnrollmentByCourseSlugService.exec(
                input.userId,
                input.courseSlug
              )
          )

          const activeEnrollment = await logTiming(
            'getActiveEnrollmentService.exec',
            () => this.getActiveEnrollmentService.exec(input.userId)
          )

          const isActive = Boolean(
            activeEnrollment &&
              enrollment &&
              activeEnrollment.courseId === enrollment.courseId
          )

          const userAccess = await logTiming(
            'userAccessRepository.findUserCourseAccess',
            () =>
              this.userAccessRepository.findUserCourseAccess(
                input.userId,
                course.id,
                course.contentType
              )
          )

          return {
            hasAccess,
            enrollment,
            activeEnrollment,
            isActive,
            accessExpiresAt: userAccess?.expiresAt ?? null,
            setupCompleted: Boolean(userAccess?.setupCompleted),
          }
        }),

      getUserEnrollments: authorizedProcedure
        .input(
          z.object({
            userId: z.string(),
          })
        )
        .query(async ({ input }) => {
          const enrollments = await this.getUserEnrollmentsService.exec(
            input.userId
          )
          return enrollments
        }),

      getActiveEnrollment: authorizedProcedure
        .input(
          z.object({
            userId: z.string(),
          })
        )
        .query(async ({ input }) => {
          const enrollment = await this.getActiveEnrollmentService.exec(
            input.userId
          )
          return enrollment
        }),
      getUserWorkoutDays: authorizedProcedure
        .input(
          z.object({
            userId: z.string(),
            courseId: z.string(),
          })
        )
        .query(async ({ input }) => {
          const workoutDays = await this.getUserWorkoutDaysService.exec(
            input.userId,
            input.courseId
          )
          return workoutDays
        }),

      updateWorkoutDays: authorizedProcedure
        .input(
          z.object({
            enrollmentId: z.string(),
            selectedWorkoutDays: z.array(z.nativeEnum(DayOfWeek)),
            keepProgress: z.boolean().optional().default(false),
          })
        )
        .mutation(async ({ input }) => {
          const { enrollmentId, selectedWorkoutDays, keepProgress } = input
          const enrollment =
            await this.getEnrollmentByIdService.exec(enrollmentId)

          if (!enrollment) {
            throw new Error('Enrollment not found')
          }

          const updatedEnrollment = await this.updateWorkoutDaysService.exec({
            enrollmentId,
            selectedWorkoutDays,
            keepProgress,
          })

          return updatedEnrollment
        }),

      getAvailableWeeks: authorizedProcedure
        .input(
          z.object({
            userId: z.string(),
            courseSlug: z.string(),
          })
        )
        .query(async ({ input }) => {
          // Получаем enrollment по courseSlug
          const enrollment = await this.getEnrollmentByCourseSlugService.exec(
            input.userId,
            input.courseSlug
          )

          if (!enrollment) {
            throw new Error('Enrollment not found')
          }

          // Получаем курс для определения типа контента
          const course = enrollment.course
          if (!course) {
            throw new Error('Course not found')
          }

          // Получаем доступные недели
          const availableWeeks = await this.getAvailableWeeksService.exec({
            userId: input.userId,
            courseId: course.id,
            enrollmentId: enrollment.id,
            enrollmentStartDate: enrollment.startDate,
            courseContentType: course.contentType || 'FIXED_COURSE',
            courseDurationWeeks: course.durationWeeks || 4,
          })

          return availableWeeks
        }),

      activateEnrollment: authorizedProcedure
        .input(z.string())
        .mutation(async ({ input }) => {
          const enrollmentId = input
          const activatedEnrollment =
            await this.activateEnrollmentService.exec(enrollmentId)
          return activatedEnrollment
        }),
    }),
  })
}
