import { injectable } from 'inversify'
import { UserAccessRepository } from '../_repository/user-access'
import { UserFreezeRepository } from '../_repository/user-freeze'
import { UserId } from '@/kernel/domain/user'
import { ContentType, CourseId, CourseProduct } from '@/kernel/domain/course'

export type Query = {
  userId: UserId
  course: {
    id: CourseId
    product: CourseProduct
    contentType: ContentType
  }
}

@injectable()
export class CheckCourseAccessService {
  constructor(
    private readonly userAccessRepository: UserAccessRepository,
    private readonly userFreezeRepository: UserFreezeRepository
  ) {}
  async exec(query: Query) {
    if (query.course.product.access === 'free') {
      return true
    }

    const activeFreeze = await this.userFreezeRepository.findActive(query.userId)
    if (activeFreeze) {
      return false
    }

    const access = await this.userAccessRepository.findUserCourseAccess(
      query.userId,
      query.course.id,
      query.course.contentType
    )

    if (!access) return false

    const now = Date.now()

    if (access.expiresAt && access.expiresAt.getTime() < now) {
      return false
    }

    return true
  }
}
