import { injectable } from 'inversify'
import { UserDailyPlanRepository } from '../_repositories/user-daily-plan'
import { CourseSlug } from '@/kernel/domain/course'

type Query = {
  courseSlug: CourseSlug
}

@injectable()
export class GetCourseLessonsService {
  constructor(private lessonsRepository: UserDailyPlanRepository) {}
  async exec(query: Query) {
    // return this.lessonsRepository.courseLessons(query.courseSlug)
    return query
  }
}
