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
} from '@/entity/course/module'

@injectable()
export class CourseEnrollmentController extends Controller {
  constructor(
    private CreateUserCourseEnrollmentService: CreateUserCourseEnrollmentService,
    private getCourseEnrollmentService: GetCourseEnrollmentService,
    private getUserDailyPlanService: GetUserDailyPlanService,
    private getUserEnrollmentsService: GetUserEnrollmentsService,
    private getActiveEnrollmentService: GetActiveEnrollmentService,
    private getUserWorkoutDaysService: GetUserWorkoutDaysService
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
          const enrollment =
            await this.CreateUserCourseEnrollmentService.execute({
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
          const enrollment = await this.getCourseEnrollmentService.execute(
            input.userId,
            input.courseId
          )
          return enrollment
        }),

      getUserDailyPlan: authorizedProcedure
        .input(
          z.object({
            userId: z.string(),
            courseId: z.string(),
            date: z.date(),
          })
        )
        .query(async ({ input }) => {
          const dailyPlan = await this.getUserDailyPlanService.execute(input)
          return dailyPlan
        }),

      getUserEnrollments: authorizedProcedure
        .input(
          z.object({
            userId: z.string(),
          })
        )
        .query(async ({ input }) => {
          const enrollments = await this.getUserEnrollmentsService.execute(
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
          const enrollment = await this.getActiveEnrollmentService.execute(
            input.userId
          )
          return enrollment
        }),
      getUserWorkoutDays: authorizedProcedure
        .input(z.string())
        .query(async ({ input }) => {
          const workoutDays =
            await this.getUserWorkoutDaysService.execute(input)
          return workoutDays
        }),
    }),
  })
}
