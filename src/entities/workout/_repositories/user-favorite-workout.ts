import { injectable } from 'inversify'
import type { UserFavoriteWorkout as PrismaUserFavoriteWorkout } from '@prisma/client'

import type { UserId } from '@/kernel/domain/user'
import { dbClient } from '@/shared/lib/db'
import type { DbClient } from '@/shared/lib/db'
import { logger } from '@/shared/lib/logger'

export type FavoriteWorkout = {
  id: string
  userId: UserId
  workoutId: string
  createdAt: Date
}

const LOG_PREFIX = '[UserFavoriteWorkoutRepository]'

@injectable()
export class UserFavoriteWorkoutRepository {
  constructor(private readonly defaultDb: DbClient = dbClient) {}

  private mapEntity(entity: PrismaUserFavoriteWorkout): FavoriteWorkout {
    return {
      id: entity.id,
      userId: entity.userId,
      workoutId: entity.workoutId,
      createdAt: entity.createdAt,
    }
  }

  async listByUser(
    userId: UserId,
    db: DbClient = this.defaultDb
  ): Promise<FavoriteWorkout[]> {
    try {
      const favorites = await db.userFavoriteWorkout.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })

      return favorites.map(favorite => this.mapEntity(favorite))
    } catch (error) {
      logger.error({
        msg: `${LOG_PREFIX} Failed to list favorites`,
        userId,
        error,
      })
      throw new Error('Failed to list favorite workouts')
    }
  }

  async isFavorite(
    userId: UserId,
    workoutId: string,
    db: DbClient = this.defaultDb
  ): Promise<boolean> {
    try {
      const favorite = await db.userFavoriteWorkout.findUnique({
        where: {
          userId_workoutId: {
            userId,
            workoutId,
          },
        },
        select: { id: true },
      })

      return Boolean(favorite)
    } catch (error) {
      logger.error({
        msg: `${LOG_PREFIX} Failed to check favorite`,
        userId,
        workoutId,
        error,
      })
      throw new Error('Failed to check favorite workout')
    }
  }

  async add(
    userId: UserId,
    workoutId: string,
    db: DbClient = this.defaultDb
  ): Promise<FavoriteWorkout> {
    try {
      const favorite = await db.userFavoriteWorkout.upsert({
        where: {
          userId_workoutId: {
            userId,
            workoutId,
          },
        },
        update: {},
        create: {
          userId,
          workoutId,
        },
      })

      return this.mapEntity(favorite)
    } catch (error) {
      logger.error({
        msg: `${LOG_PREFIX} Failed to add favorite`,
        userId,
        workoutId,
        error,
      })
      throw new Error('Failed to add favorite workout')
    }
  }

  async remove(
    userId: UserId,
    workoutId: string,
    db: DbClient = this.defaultDb
  ): Promise<void> {
    try {
      await db.userFavoriteWorkout.deleteMany({
        where: {
          userId,
          workoutId,
        },
      })
    } catch (error) {
      logger.error({
        msg: `${LOG_PREFIX} Failed to remove favorite`,
        userId,
        workoutId,
        error,
      })
      throw new Error('Failed to remove favorite workout')
    }
  }

  async toggle(
    userId: UserId,
    workoutId: string,
    db: DbClient = this.defaultDb
  ): Promise<{ isFavorite: boolean; favorite?: FavoriteWorkout }> {
    try {
      const alreadyFavorite = await this.isFavorite(userId, workoutId, db)

      if (alreadyFavorite) {
        await this.remove(userId, workoutId, db)
        return { isFavorite: false }
      }

      const favorite = await this.add(userId, workoutId, db)
      return { isFavorite: true, favorite }
    } catch (error) {
      logger.error({
        msg: `${LOG_PREFIX} Failed to toggle favorite`,
        userId,
        workoutId,
        error,
      })
      throw new Error('Failed to toggle favorite workout')
    }
  }
}
