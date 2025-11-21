import { injectable } from 'inversify'
import { UserAccessRepository } from '../_repository/user-access'
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
  constructor(private readonly userAccessRepository: UserAccessRepository) {}
  async exec(query: Query) {
    if (query.course.product.access === 'free') {
      return true
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

    const isFrozen =
      access.freezes?.some(
        freeze =>
          freeze.start.getTime() <= now &&
          freeze.end.getTime() >= now
      ) ?? false

    if (isFrozen) {
      return false
    }

    return true
  }
}
