import { Controller, publicProcedure, router } from '@/kernel/lib/trpc/module'

import { GetCoursesListService } from '@/entity/course/module'
import { injectable } from 'inversify'

@injectable()
export class CoursesListController extends Controller {
  constructor(private getCoursesListService: GetCoursesListService) {
    super()
  }

  public router = router({
    coursesList: router({
      get: publicProcedure.query(async () => {
        const coursesList = await this.getCoursesListService.exec()
        return coursesList
      }),
    }),
  })
}
