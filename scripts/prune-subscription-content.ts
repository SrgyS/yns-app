import 'dotenv/config'
import * as path from 'path'
import { promises as fs } from 'fs'

import courseSchema from '../src/shared/api/content/_schemas/course.schema.json'
import dailyPlanSchema from '../src/shared/api/content/_schemas/daily-plan.schema.json'
import weeksSchema from '../src/shared/api/content/_schemas/weeks.schema.json'
import { contentParser } from '../src/shared/api/content'
import YAML from 'yaml'

const WINDOW_SIZE = Number(process.env.SUBSCRIPTION_WINDOW_SIZE ?? 4)
const CONTENT_ROOT =
  process.env.CONTENT_LOCAL_ROOT ?? path.resolve(process.cwd(), '..', 'app-content')
const CONTENT_URL = process.env.CONTENT_URL?.replace(/\/$/, '') ?? null
const CONTENT_TOKEN = process.env.CONTENT_TOKEN

async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}

async function fileExists(fullPath: string): Promise<boolean> {
  try {
    await fs.access(fullPath)
    return true
  } catch {
    return false
  }
}

async function fetchRemoteText(relativePath: string): Promise<string | null> {
  if (!CONTENT_URL) {
    return null
  }

  const sanitized = relativePath.replace(/^\/+/, '')
  const fetchUrl = `${CONTENT_URL}/${sanitized}`

  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3.raw',
    }

    if (CONTENT_TOKEN) {
      headers.Authorization = `token ${CONTENT_TOKEN}`
    }

    const response = await fetch(fetchUrl, { headers })
    if (!response.ok) {
      if (response.status !== 404) {
        console.warn(
          `⚠️  Не удалось получить ${relativePath} по адресу ${fetchUrl}: ${response.status} ${response.statusText}`
        )
      }
      return null
    }

    return await response.text()
  } catch (error) {
    console.warn(
      `⚠️  Ошибка при попытке получить ${relativePath} по адресу ${fetchUrl}:`,
      error instanceof Error ? error.message : error
    )
    return null
  }
}

async function readYaml<T>(relativePath: string, schema: object): Promise<T | null> {
  const fullPath = path.join(CONTENT_ROOT, relativePath)
  let raw: string | null = null

  if (await fileExists(fullPath)) {
    raw = await fs.readFile(fullPath, 'utf8')
  } else {
    raw = await fetchRemoteText(relativePath)
  }

  if (!raw) {
    console.error(`❌ Не удалось получить данные для ${relativePath}`)
    return null
  }

  try {
    return await contentParser.parse<T>(raw, schema)
  } catch (error) {
    console.error(`❌ Ошибка парсинга ${relativePath}:`, error)
    return null
  }
}

async function getCourseSlugs(): Promise<string[]> {
  const coursesDir = path.join(CONTENT_ROOT, 'courses')
  try {
    const entries = await fs.readdir(coursesDir, { withFileTypes: true })
    return entries.filter(e => e.isDirectory()).map(e => e.name)
  } catch (error) {
    console.error('❌ Не удалось прочитать список курсов в CONTENT_ROOT:', error)
    return []
  }
}

async function pruneCourse(courseSlug: string) {
  const course = await readYaml<any>(`courses/${courseSlug}/course.yaml`, courseSchema)
  if (!course || course.contentType !== 'SUBSCRIPTION') {
    return
  }

  const weeks = await readYaml<any>(`courses/${courseSlug}/weeks.yaml`, weeksSchema)
  if (!weeks || !Array.isArray(weeks.weeks) || weeks.weeks.length === 0) {
    console.warn(
      `⚠️  Пропускаем ${courseSlug}: не найдены данные недель или они пустые.`
    )
    return
  }

  const today = new Date()
  const releasedWeeks = weeks.weeks.filter((w: any) => {
    if (!w || typeof w.weekNumber !== 'number') return false
    if (!w.releaseAt) return false
    const releaseDate = new Date(w.releaseAt)
    if (Number.isNaN(releaseDate.getTime())) return false
    return releaseDate <= today
  })

  const referenceWeeks = releasedWeeks.length > 0 ? releasedWeeks : weeks.weeks
  const latestWeekNumber = Math.max(
    ...referenceWeeks.map((w: any) => w.weekNumber || 0)
  )

  if (latestWeekNumber <= 0) {
    console.warn(`⚠️  Пропускаем ${courseSlug}: некорректные номера недель.`)
    return
  }

  const firstWeekToKeep = Math.max(1, latestWeekNumber - WINDOW_SIZE + 1)
  const dailyPlansDir =
    typeof course.dailyPlansDir === 'string' ? course.dailyPlansDir : 'daily-plans'
  const normalizedDailyPlansDir = dailyPlansDir.replace(/^\/+|\/+$/g, '')
  const courseDailyPlansDir = path.join(
    CONTENT_ROOT,
    'courses',
    courseSlug,
    normalizedDailyPlansDir
  )
  const archiveDir = path.join(courseDailyPlansDir, 'archive')

  await ensureDir(archiveDir)

  const entries = await fs.readdir(courseDailyPlansDir, { withFileTypes: true })
  const planFiles = entries.filter(entry => entry.isFile() && entry.name.endsWith('.yaml'))

  let moved = 0

  for (const entry of planFiles) {
    const fileName = entry.name
    const relativePlanPath = path.join(
      'courses',
      courseSlug,
      normalizedDailyPlansDir,
      fileName
    )
    const plan = await readYaml<any>(relativePlanPath, dailyPlanSchema)
    if (!plan) continue

    const weekNumber = Number(plan.weekNumber ?? 0)
    if (!weekNumber || weekNumber >= firstWeekToKeep) {
      continue
    }

    const srcPath = path.join(courseDailyPlansDir, fileName)
    const destPath = path.join(archiveDir, fileName)

    await fs.rename(srcPath, destPath)
    moved += 1
  }

  if (moved > 0) {
    console.log(
      `📦  Курс "${courseSlug}": перемещено ${moved} устаревших планов в ${path.relative(
        CONTENT_ROOT,
        archiveDir
      )}`
    )
  } else {
    console.log(`ℹ️  Курс "${courseSlug}": устаревшие планы не найдены.`)
  }

  const filteredWeeks = (weeks.weeks as Array<{ weekNumber: number }>).filter(
    (week: any) => typeof week?.weekNumber === 'number' && week.weekNumber >= firstWeekToKeep
  )

  if (filteredWeeks.length !== weeks.weeks.length) {
    const weeksPath = path.join(CONTENT_ROOT, 'courses', courseSlug, 'weeks.yaml')
    if (!(await fileExists(weeksPath))) {
      console.warn(
        `⚠️  Не удалось обновить weeks.yaml для курса ${courseSlug}: файл недоступен локально.`
      )
    } else {
      const header =
        '# yaml-language-server: $schema=https://raw.githubusercontent.com/SrgyS/content-schema/refs/heads/main/schemas/weeks.schema.json\n'
      const serialized = YAML.stringify({ weeks: filteredWeeks })
      await fs.writeFile(weeksPath, header + serialized, 'utf8')
      console.log(
        `🗂️  Курс "${courseSlug}": обновлен weeks.yaml (оставлено ${filteredWeeks.length} записей)`
      )
    }
  }
}

async function main() {
  const courseSlugs = await getCourseSlugs()
  for (const slug of courseSlugs) {
    await pruneCourse(slug)
  }
  console.log('✅ Перенос устаревших планов завершён.')
}

main().catch(error => {
  console.error('❌ Ошибка при переносе устаревших планов:', error)
  process.exit(1)
})
