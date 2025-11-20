import { injectable } from 'inversify'
import { WorkoutSection, WorkoutSubsection } from '@prisma/client'
import { Workout } from '../_domain/types'
import { WorkoutRepository } from '../_repositories/workout'
import { logger } from '@/shared/lib/logger'

type ListWorkoutsInput = {
  section: WorkoutSection
  subsection?: WorkoutSubsection | null
  search?: string | null
}

@injectable()
export class ListWorkoutsService {
  constructor(private workoutRepository: WorkoutRepository) {}

  async exec({
    section,
    subsection,
    search,
  }: ListWorkoutsInput): Promise<Workout[]> {
    try {
      const workouts = await this.workoutRepository.listBySection({
        section,
        subsection,
        search,
      })

      return workouts
    } catch (error) {
      logger.error({
        msg: 'Error listing workouts',
        section,
        subsection,
        search,
        error,
      })
      throw new Error('Failed to list workouts')
    }
  }
}
