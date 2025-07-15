import { injectable } from 'inversify'
import { LessonRepository } from '../_repositories/lesson'
import { CourseSlug } from '@/kernel/domain/course';

type Query = {
    courseSlug: CourseSlug;
}

@injectable()
export class GetCourseLessonsService {
  constructor(private lessonsRepository: LessonRepository) {}
  async exec(query: Query) {
    return this.lessonsRepository.courseLessons(query.courseSlug)
  }
}