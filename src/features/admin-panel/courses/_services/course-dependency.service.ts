import { injectable } from 'inversify'
import { Prisma } from '@prisma/client'

@injectable()
export class CourseDependencyService {
  async syncDependencies(
    tx: Prisma.TransactionClient,
    courseId: string,
    dependencyIds: string[]
  ) {
    await tx.courseDependency.deleteMany({
      where: {
        courseId,
        dependsOnId: { notIn: dependencyIds },
      },
    })

    if (dependencyIds.length === 0) return

    const existingDeps = await tx.courseDependency.findMany({
      where: {
        courseId,
        dependsOnId: { in: dependencyIds },
      },
      select: { dependsOnId: true },
    })
    const existingIds = new Set(existingDeps.map(dep => dep.dependsOnId))
    const toCreate = dependencyIds.filter(id => !existingIds.has(id))

    if (toCreate.length > 0) {
      await tx.courseDependency.createMany({
        data: toCreate.map(dependsOnId => ({
          courseId,
          dependsOnId,
        })),
      })
    }
  }
}
