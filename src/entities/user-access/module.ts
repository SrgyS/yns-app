import { ContainerModule } from 'inversify'
import { GrandCourseAccessService } from './_services/grand-course-access'
import { CheckCourseAccessService } from './_services/check-course-access'
import { UserAccessRepository } from './_repository/user-access'
import { UserFreezeRepository } from './_repository/user-freeze'
import { LogUserAccessHistoryService } from './_services/log-user-access-history'

export const UserAccessModule = new ContainerModule(context => {
  const { bind } = context

  bind(UserAccessRepository).toSelf()
  bind(UserFreezeRepository).toSelf()
  bind(CheckCourseAccessService).toSelf()
  bind(GrandCourseAccessService).toSelf()
  bind(LogUserAccessHistoryService).toSelf()
})

export { CheckCourseAccessService } from './_services/check-course-access'
export { GrandCourseAccessService } from './_services/grand-course-access'
export { UserAccessRepository } from './_repository/user-access'
export { UserFreezeRepository } from './_repository/user-freeze'
