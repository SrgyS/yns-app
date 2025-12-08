import 'dotenv/config'
import { dbClient } from '@/shared/lib/db'
import { PlanningRepository } from '@/entities/planning'

const isDryRun = process.argv.includes('--dry-run')

async function main() {
  const now = new Date()
  const planningRepository = new PlanningRepository(dbClient)

  const releasedWeeks = await dbClient.week.findMany({
    where: {
      releaseAt: { lte: now },
      course: { contentType: 'SUBSCRIPTION' },
    },
    select: {
      courseId: true,
      weekNumber: true,
      course: { select: { slug: true } },
    },
  })

  if (releasedWeeks.length === 0) {
    console.info('[release-weeks] Нет недель для генерации')
    return
  }

  const grouped = releasedWeeks.reduce<Record<string, number[]>>(
    (acc, week) => {
      acc[week.courseId] = acc[week.courseId] || []
      acc[week.courseId].push(week.weekNumber)
      return acc
    },
    {}
  )

  for (const [courseId, weekNumbers] of Object.entries(grouped)) {
    const courseSlug =
      releasedWeeks.find(w => w.courseId === courseId)?.course.slug ?? ''
    const enrollments = await dbClient.userCourseEnrollment.findMany({
      where: { courseId, active: true },
      select: { id: true, userId: true },
    })

    for (const enrollment of enrollments) {
      for (const weekNumber of weekNumbers) {
        const alreadyGenerated = await dbClient.userDailyPlan.findFirst({
          where: { enrollmentId: enrollment.id, weekNumber },
          select: { id: true },
        })
        if (alreadyGenerated) {
          continue
        }

        if (isDryRun) {
          console.info(
            `[release-weeks][dry-run] course=${courseSlug} enrollment=${enrollment.id} week=${weekNumber} -> would generate`
          )
          continue
        }

        try {
          await planningRepository.generateUserDailyPlansForWeek(
            enrollment.id,
            weekNumber,
            dbClient
          )
          console.info(
            `[release-weeks] course=${courseSlug} enrollment=${enrollment.id} week=${weekNumber} -> generated`
          )
        } catch (error) {
          console.error(
            `[release-weeks][error] course=${courseSlug} enrollment=${enrollment.id} week=${weekNumber}`,
            error
          )
        }
      }
    }
  }
}

main()
  .catch(err => {
    console.error('[release-weeks][fatal]', err)
    process.exit(1)
  })
  .finally(async () => {
    await dbClient.$disconnect()
  })
