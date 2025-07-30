import {
  Controller,
  authorizedProcedure,
  router,
} from '@/kernel/lib/trpc/module'
import { injectable } from 'inversify'
import { z } from 'zod'
import { DayOfWeek } from '@prisma/client'
import {
  CreateCourseEnrollmentService,
  GetCourseEnrollmentService,
  GetUserDailyPlanService,
  UpdateWorkoutDaysService,
  GetEnrollmentByIdService,
} from '@/entity/course/module'

@injectable()
export class CourseEnrollmentController extends Controller {
  constructor(
    private createCourseEnrollmentService: CreateCourseEnrollmentService,
    private getCourseEnrollmentService: GetCourseEnrollmentService,
    private getUserDailyPlanService: GetUserDailyPlanService,
    private updateWorkoutDaysService: UpdateWorkoutDaysService,
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
          const enrollment = await this.createCourseEnrollmentService.execute({
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
            date: z.date(),
          })
        )
        .query(async ({ input }) => {
          const dailyPlan = await this.getUserDailyPlanService.execute(input)
          return dailyPlan
        }),

      updateWorkoutDays: authorizedProcedure
        .input(
          z.object({
            enrollmentId: z.string(),
            selectedWorkoutDays: z.array(z.nativeEnum(DayOfWeek)),
          })
        )
        .mutation(async ({ input }) => {
          await this.updateWorkoutDaysService.execute(input)
          return { success: true }
        }),

      getEnrollmentById: authorizedProcedure
        .input(z.string())
        .query(async ({ input }) => {
          const enrollment = await this.getEnrollmentByIdService.execute(input)
          return enrollment
        }),
    }),
  })
}
