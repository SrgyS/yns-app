import {
  Controller,
  authorizedProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { injectable } from 'inversify'
import { z } from 'zod'
import { DayOfWeek } from '@prisma/client'
import {
  CreateUserCourseEnrollmentService,
  GetCourseEnrollmentService,
  GetUserDailyPlanService,
  GetUserEnrollmentsService,
  GetActiveEnrollmentService,
  GetUserWorkoutDaysService,
  UpdateWorkoutDaysService,
  ActivateEnrollmentService,
  GetEnrollmentByCourseSlugService,
  GetEnrollmentByIdService,
} from '@/entity/course/module'

@injectable()
export class CourseEnrollmentController extends Controller {
  constructor(
    private CreateUserCourseEnrollmentService: CreateUserCourseEnrollmentService,
    private getCourseEnrollmentService: GetCourseEnrollmentService,
    private getUserDailyPlanService: GetUserDailyPlanService,
    private getUserEnrollmentsService: GetUserEnrollmentsService,
    private getActiveEnrollmentService: GetActiveEnrollmentService,
    private getUserWorkoutDaysService: GetUserWorkoutDaysService,
    private updateWorkoutDaysService: UpdateWorkoutDaysService,
    private activateEnrollmentService: ActivateEnrollmentService,
    private getEnrollmentByCourseSlugService: GetEnrollmentByCourseSlugService,
    private getEnrollmentByIdService: GetEnrollmentByIdService
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
            hasFeedback: z.boolean().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          const enrollment = await this.CreateUserCourseEnrollmentService.exec({
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
          const enrollment = await this.getCourseEnrollmentService.exec(
            input.userId,
            input.courseId
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
          const enrollment = await this.getEnrollmentByCourseSlugService.exec(
            input.userId,
            input.courseSlug
          )
          return enrollment
        }),

      getUserDailyPlan: authorizedProcedure
        .input(
          z.object({
            userId: z.string(),
            courseId: z.string(),
            dayNumberInCourse: z.number(),
          })
        )
        .query(async ({ input }) => {
          const dailyPlan = await this.getUserDailyPlanService.exec(input)
          return dailyPlan
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
