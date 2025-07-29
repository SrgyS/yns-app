import { injectable } from 'inversify'
import { DailyPlanRepository } from '../_repositories/daily-plan'
import { CourseSlug } from '@/kernel/domain/course';

type Query = {
    courseSlug: CourseSlug;
}

@injectable()
export class GetCourseLessonsService {
  constructor(private lessonsRepository: DailyPlanRepository) {}
  async exec(query: Query) {
    // return this.lessonsRepository.courseLessons(query.courseSlug)
    return query
  }
}
