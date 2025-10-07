import { ContainerModule } from 'inversify'
import { GetUserCoursesListService } from './_services/get-user-courses-list'

export const UserCoursesModule = new ContainerModule(context => {
  const { bind } = context
  bind(GetUserCoursesListService).toSelf()
})

export { GetUserCoursesListService }
