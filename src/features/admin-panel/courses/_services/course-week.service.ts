import { injectable } from 'inversify'
import { Prisma } from '@prisma/client'
import { CourseUpsertInput } from '../_schemas'
import { generateDaySlug } from './utils'

@injectable()
export class CourseWeekService {
  async syncWeeks(
    tx: Prisma.TransactionClient,
    courseId: string,
    weeksInput: CourseUpsertInput['weeks']
  ) {
    const existingWeeks = await tx.week.findMany({
      where: { courseId },
      select: { weekNumber: true },
    })
    const existingWeekNumbers = existingWeeks.map(week => week.weekNumber)
    const weekNumbers = weeksInput.map(week => week.weekNumber)

    const removedWeeks = this.collectRemovedWeeks(
      existingWeekNumbers,
      weekNumbers,
      weeksInput
    )

    await this.pruneUserPlansByWeeks(tx, courseId, removedWeeks)
    await this.pruneDailyPlansAndWeeks(tx, courseId, weekNumbers)

    for (const week of weeksInput) {
      await this.upsertWeekWithDays(tx, courseId, week)
    }
  }

  private collectRemovedWeeks(
    existingWeekNumbers: number[],
    weekNumbers: number[],
    weeksInput: CourseUpsertInput['weeks']
  ): Set<number> {
    const removed = new Set(
      weekNumbers.length > 0
        ? existingWeekNumbers.filter(week => !weekNumbers.includes(week))
        : existingWeekNumbers
    )
    const unpublishedWeeks = weeksInput
      .filter(week => week.releaseAt && new Date(week.releaseAt) > new Date())
      .map(week => week.weekNumber)
    for (const week of unpublishedWeeks) {
      removed.add(week)
    }
    return removed
  }

  async pruneUserPlansByWeeks(
    tx: Prisma.TransactionClient,
    courseId: string,
    weeks: Set<number>
  ) {
    if (weeks.size === 0) return
    await tx.userDailyPlan.deleteMany({
      where: {
        weekNumber: { in: Array.from(weeks) },
        enrollment: { courseId },
      },
    })
  }

  async pruneDailyPlansAndWeeks(
    tx: Prisma.TransactionClient,
    courseId: string,
    weekNumbers: number[]
  ) {
    if (weekNumbers.length > 0) {
      await tx.dailyPlan.deleteMany({
        where: {
          courseId,
          weekNumber: { notIn: weekNumbers },
        },
      })
      await tx.week.deleteMany({
        where: {
          courseId,
          weekNumber: { notIn: weekNumbers },
        },
      })
      return
    }

    await tx.dailyPlan.deleteMany({ where: { courseId } })
    await tx.week.deleteMany({ where: { courseId } })
  }

  private async upsertWeekWithDays(
    tx: Prisma.TransactionClient,
    courseId: string,
    week: CourseUpsertInput['weeks'][number]
  ) {
    await tx.week.upsert({
      where: {
        courseId_weekNumber: {
          courseId,
          weekNumber: week.weekNumber,
        },
      },
      update: {
        releaseAt: week.releaseAt ? new Date(week.releaseAt) : new Date(),
      },
      create: {
        courseId,
        weekNumber: week.weekNumber,
        releaseAt: week.releaseAt ? new Date(week.releaseAt) : new Date(),
      },
    })

    const existingPlans = await tx.dailyPlan.findMany({
      where: { courseId, weekNumber: week.weekNumber },
      select: { dayNumberInWeek: true },
    })
    const existingDayNumbers = new Set(
      existingPlans.map(plan => plan.dayNumberInWeek)
    )
    const toCreate: { dayNumberInWeek: number; slug: string }[] = []
    for (let day = 1; day <= 7; day += 1) {
      if (!existingDayNumbers.has(day)) {
        toCreate.push({
          dayNumberInWeek: day,
          slug: generateDaySlug(week.weekNumber, day),
        })
      }
    }
    if (toCreate.length > 0) {
      await tx.dailyPlan.createMany({
        data: toCreate.map(day => ({
          courseId,
          weekNumber: week.weekNumber,
          dayNumberInWeek: day.dayNumberInWeek,
          slug: day.slug,
          description: null,
          warmupId: null,
          mealPlanId: null,
        })),
      })
    }
  }
}
