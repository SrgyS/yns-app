import 'dotenv/config'
import { dbClient } from '@/shared/lib/db'
import { PlanningRepository } from '@/entities/planning'

// # TODO: release-weeks cron script hardening

// Context: `scripts/release-weeks` generates `userDailyPlan` for released weeks of `SUBSCRIPTION` courses.

// ## 1) Scheduling & deployment safety
// - [ ] Ensure the script runs **only once per environment** (staging/prod).  
//   **Why:** multi-instance deployments can trigger duplicate runs (extra load, race conditions).
// - [ ] Add a **distributed lock** (prefer Postgres advisory lock; Redis lock is ok if Redis already exists).  
//   **Why:** protects from double-starts (two crons / manual runs / redeploy overlap).

// ## 2) Idempotency & concurrency
// - [ ] Add a **DB-level uniqueness guarantee** for generated plans:
//   - Unique index on `(enrollmentId, weekNumber, dayNumber/date)` (whatever is the natural key).
//   **Why:** app-level `findFirst` is not enough under concurrent runs; unique index makes idempotency real.
// - [ ] Replace `findFirst` + `create` pattern with **upsert** (or `createMany` with `skipDuplicates`), if schema allows.  
//   **Why:** reduces queries and avoids race conditions.

// ## 3) Performance
// - [ ] Avoid nested DB calls inside loops where possible:
//   - Preload existing plans for `(enrollmentId, weekNumber)` in a single query.
//   - Or compute a set of “missing” weekNumbers per enrollment.
//   **Why:** current `for enrollment -> for week -> findFirst` becomes N×M queries and will degrade with scale.
// - [ ] Process enrollments in **batches** (e.g., 100–500) and yield between batches.  
//   **Why:** prevents long transactions and reduces pressure on DB.
// - [ ] Add a hard cap per run (e.g., `MAX_GENERATIONS_PER_RUN`) with continuation on next cron tick.  
//   **Why:** prevents runaway runs when backlog is large.

// ## 4) Observability
// - [ ] Add structured logs with:
//   - runId, startedAt, finishedAt, durationMs
//   - counts: releasedWeeks, enrollments, generated, skippedExisting, failed
//   **Why:** easier debugging and monitoring.
// - [ ] Emit metrics (optional): successes/failures/duration.  
//   **Why:** alerts on regressions and backlog.

// ## 5) Error handling strategy
// - [ ] Classify errors:
//   - retryable (network/storage/db transient)
//   - non-retryable (validation, missing week config)
//   **Why:** avoids infinite reprocessing noise.
// - [ ] Add limited retries with backoff for retryable errors (e.g., 3 attempts).  
//   **Why:** increases robustness to transient DB issues.
// - [ ] Collect failures summary at end of run (log + optional alert).  
//   **Why:** actionable reporting instead of scattered logs.

// ## 6) Correctness / business rules
// - [ ] Confirm “released week” criteria:
//   - `releaseAt <= now` AND week belongs to subscription course
//   - ensure week is not disabled/archived (if such flags exist)
//   **Why:** avoid generating for hidden content.
// - [ ] Confirm enrollment criteria:
//   - `active: true` is sufficient
//   - consider `startsAt/endsAt`, pauses, refunds (if modeled)
//   **Why:** prevent generating for ineligible users.

// ## 7) Dry-run improvements
// - [ ] In `--dry-run`, output aggregated summary (counts per course/week).  
//   **Why:** easier validation before enabling in prod.

// ## 8) Operational docs
// - [ ] Document how to run:
//   - `node scripts/release-weeks --dry-run`
//   - `node scripts/release-weeks`
//   - schedule definition (cron/pm2)
//   **Why:** reduces operator error.
// - [ ] Document required env vars and permissions (DB access).  
//   **Why:** repeatable deployments.

// ## 9) Timezone & clock
// - [ ] Decide whether `releaseAt` is stored in UTC and ensure comparisons use UTC consistently.  
//   **Why:** avoid off-by-hours release bugs after DST/timezone changes.

// ## 10) Future: move to jobs (optional)
// - [ ] Consider queue-based generation (BullMQ/Redis) if enrollment volume grows.  
//   **Why:** controlled throughput, retries, and better multi-instance behavior.

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
