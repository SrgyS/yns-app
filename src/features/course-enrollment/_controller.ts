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
  GetCourseEnrollmentService,
  GetUserEnrollmentsService,
  GetActiveEnrollmentService,
  GetUserWorkoutDaysService,
  UpdateWorkoutDaysService,
  ActivateEnrollmentService,
  GetEnrollmentByCourseSlugService,
  GetEnrollmentByIdService,
} from '@/entities/course/module'
import { CreateUserCourseEnrollmentWithCourseAccessService } from './_services/create-user-course-enrollment-with-access'
import { CheckCourseAccessService } from '@/entities/user-access/module'
import { UserAccessRepository } from '@/entities/user-access/_repository/user-access'
import { GetAvailableWeeksService } from './_services/get-available-weeks'
import { logger } from '@/shared/lib/logger'

const LOG_PREFIX = '[CourseEnrollmentController]'

async function logTiming<T>(label: string, action: () => Promise<T>): Promise<T> {
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
    private CreateUserCourseEnrollmentWithCourseAccessService: CreateUserCourseEnrollmentWithCourseAccessService,
    private getCourseService: GetCourseService,
    private getCourseEnrollmentService: GetCourseEnrollmentService,
    private getUserEnrollmentsService: GetUserEnrollmentsService,
    private getActiveEnrollmentService: GetActiveEnrollmentService,
    private getUserWorkoutDaysService: GetUserWorkoutDaysService,
    private updateWorkoutDaysService: UpdateWorkoutDaysService,
    private activateEnrollmentService: ActivateEnrollmentService,
    private getEnrollmentByCourseSlugService: GetEnrollmentByCourseSlugService,
    private getEnrollmentByIdService: GetEnrollmentByIdService,
    private getAvailableWeeksService: GetAvailableWeeksService,
    private checkCourseAccessService: CheckCourseAccessService,
    private userAccessRepository: UserAccessRepository
  ) {
    super()
  }

  public router = router({
    course: router({
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
              this.getCourseEnrollmentService.exec(
                input.userId,
                input.courseId
              )
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

          if (!course || !course.product) {
            return {
              hasAccess: false,
              enrollment: null,
              activeEnrollment: null,
              isActive: false,
              accessExpiresAt: null,
            }
          }

          const hasAccess = await logTiming('checkCourseAccessService.exec', () =>
            this.checkCourseAccessService.exec({
              userId: input.userId,
              course: {
                id: course.id,
                product: course.product,
                contentType: course.contentType,
              },
            })
          )

          const enrollment =
            await logTiming('getEnrollmentByCourseSlugService.exec', () =>
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
