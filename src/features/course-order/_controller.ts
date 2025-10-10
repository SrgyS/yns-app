import { z } from 'zod'
import { injectable } from 'inversify'
import {
  authorizedProcedure,
  Controller,
  router,
} from '@/kernel/lib/trpc/module'
import { StartCourseOrderService } from './_services/start-course-order'
import { CheckOrderStatusService } from './_services/check-order-status'

@injectable()
export class CourseOrderController extends Controller {
  constructor(
    private startCourseOrderService: StartCourseOrderService,
    private checkCourseOrderService: CheckOrderStatusService
  ) {
    super()
  }

  public router = router({
    courseOrder: {
      start: authorizedProcedure
        .input(
          z.object({
            courseSlug: z.string(),
            urlReturn: z.string(),
          })
        )
        .mutation(({ input, ctx }) => {
          return this.startCourseOrderService.exec({
            courseSlug: input.courseSlug,
            userId: ctx.session.user.id,
            userEmail: ctx.session.user.email,
            urlReturn: input.urlReturn,
          })
        }),
      check: authorizedProcedure
        .input(
          z.object({
            orderId: z.string(),
          })
        )
        .query(({ ctx, input }) => {
          return this.checkCourseOrderService.exec({
            userId: ctx.session.user.id,
            orderId: input.orderId,
          })
        }),
    },
  })
}
