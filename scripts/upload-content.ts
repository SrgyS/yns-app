import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import * as path from 'path'
import { contentParser } from '../src/shared/api/content'
import manifestSchema from '../src/shared/api/content/_schemas/manifest.schema.json'
import courseSchema from '../src/shared/api/content/_schemas/course.schema.json'
import dailyPlanSchema from '../src/shared/api/content/_schemas/daily-plan.schema.json'
import workoutSchema from '../src/shared/api/content/_schemas/workout.schema.json'
import mealPlanSchema from '../src/shared/api/content/_schemas/meal-plan.schema.json'
import recipeSchema from '../src/shared/api/content/_schemas/recipe.schema.json'
import weeksSchema from '../src/shared/api/content/_schemas/weeks.schema.json'
import { ParsingError, ValidationError } from '../src/shared/lib/errors'
import { WeeksConfiguration } from '@/shared/api/content/_schemas/weeks.schema'
import type { MealPlan } from '@/shared/api/content/_schemas/meal-plan.schema'
import type { DailyPlan } from '@/shared/api/content/_schemas/daily-plan.schema'

export type KinescopePoster = {
  id: string
  status?: 'done' | 'processing' | 'error'
  active?: boolean
  original: string
  md?: string
  sm?: string
  xs?: string
  [k: string]: unknown
}

type KinescopeVideo = {
  duration?: number | null
  progress?: number | null
  poster?: KinescopePoster | null
}

type Envelope<T> = { data: T }

function unwrap<T>(payload: Envelope<T> | T): T {
  return (payload as Envelope<T>)?.data ?? (payload as T)
}

type MealPlanEntry = MealPlan & { slug: string }
type DailyPlanEntry = DailyPlan & { slug: string }

// Утилита для получения метаданных видео из Kinescope
async function fetchKinescopeVideoMetadata(
  videoId: string
): Promise<KinescopeVideo | null> {
  const apiKey = process.env.KINESCOPE_API_KEY
  if (!apiKey) throw new Error('KINESCOPE_API_KEY is not set')
  try {
    const resp = await fetch(`https://api.kinescope.io/v1/videos/${videoId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    })
    if (!resp.ok) {
      console.warn(
        `  🟡 Не удалось получить метаданные Kinescope для videoId=${videoId}: ${resp.status} ${resp.statusText}`
      )
      return null
    }

    const payload = (await resp.json()) as
      | Envelope<KinescopeVideo>
      | KinescopeVideo
    const v = unwrap(payload)

    const duration =
      typeof v.duration === 'number' ? Math.round(v.duration) : undefined
    const progress =
      typeof v.progress === 'number' ? Math.round(v.progress) : undefined
    const poster = v.poster ?? undefined

    return { duration, poster, progress }
  } catch (e) {
    console.warn(
      `  🟡 Ошибка запроса метаданных Kinescope для videoId=${videoId}:`,
      e
    )
    return null
  }
}

// Функция для скачивания и парсинга YAML-файла
async function downloadAndParseValidatedYaml<T>(
  relativePath: string,
  schema: object
): Promise<T | null> {
  const fetchUrl = `${process.env.CONTENT_URL}/${relativePath}`
  const slug = path.basename(relativePath, '.yaml')

  try {
    const response = await fetch(fetchUrl, {
      headers: {
        Authorization: `token ${process.env.CONTENT_TOKEN}`,
        Accept: 'application/vnd.github.v3.raw',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`  🟡 Файл не найден по адресу ${fetchUrl}. Пропускаем.`)
        return null
      }
      throw new Error(
        `Ошибка при загрузке ${fetchUrl}: ${response.status} ${response.statusText}`
      )
    }

    const text = await response.text()
    const parsedData = await contentParser.parse<T>(text, schema)
    ;(parsedData as any).slug = slug
    return parsedData
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`  ❌ Ошибка валидации для ${fetchUrl}:`)
    } else if (error instanceof ParsingError) {
      console.error(`  ❌ Ошибка парсинга для ${fetchUrl}: ${error.message}`)
    } else {
      console.error(
        `  ❌ Непредвиденная ошибка при обработке ${fetchUrl}:`,
        error
      )
    }
    return null
  }
}

async function listAllEntityFiles() {
  const manifest = await downloadAndParseValidatedYaml<any>(
    'manifest.yaml',
    manifestSchema
  )
  if (!manifest) {
    throw new Error('Could not download or parse manifest.yaml')
  }
  return {
    recipes: manifest.recipes || [],
    workouts: manifest.workouts || [],
    courses: manifest.courses || [],
  }
}

async function downloadAndUploadContent() {
  const dbClient = new PrismaClient()
  try {
    console.log('🚀 Начало удаленной загрузки и импорта контента...')

    if (!process.env.CONTENT_URL || !process.env.CONTENT_TOKEN) {
      throw new Error(
        'CONTENT_URL и/или CONTENT_TOKEN не заданы в переменных окружения'
      )
    }

    const allEntities = await listAllEntityFiles()
    console.log(
      `🔍 Найдено ${allEntities.recipes.length} рецептов, ${allEntities.workouts.length} тренировок и ${allEntities.courses.length} курсов.`
    )

    console.log('🍳 Импорт рецептов...')
    for (const recipeSlug of allEntities.recipes) {
      const recipeRelativePath = `recipes/${recipeSlug}.yaml`
      const recipeData = await downloadAndParseValidatedYaml<any>(
        recipeRelativePath,
        recipeSchema
      )
      if (recipeData) {
        const ingredients = Array.isArray(recipeData.ingredients)
          ? (recipeData.ingredients as Array<{
              name: string
              weightGrams?: number | null
              quantity?: number | null
              unit?: string | null
            }>)
          : []

        const recipeRecord = await dbClient.recipe.upsert({
          where: { slug: recipeSlug },
          update: {
            title: recipeData.title,
            description: recipeData.description,
            preparationTimeMinutes: recipeData.preparationTimeMinutes,
            calories: recipeData.calories,
            servings: recipeData.servings,
            difficulty: recipeData.difficulty,
            isGlutenFree: recipeData.isGlutenFree,
            isSugarFree: recipeData.isSugarFree,
            mealCategories: recipeData.mealCategories,
          },
          create: {
            slug: recipeSlug,
            title: recipeData.title,
            description: recipeData.description,
            preparationTimeMinutes: recipeData.preparationTimeMinutes,
            calories: recipeData.calories,
            servings: recipeData.servings,
            difficulty: recipeData.difficulty,
            isGlutenFree: recipeData.isGlutenFree,
            isSugarFree: recipeData.isSugarFree,
            mealCategories: recipeData.mealCategories,
          },
        })

        // Полностью пересоздаём ингредиенты для рецепта из YAML
        await dbClient.recipeIngredient.deleteMany({
          where: { recipeId: recipeRecord.id },
        })
        if (ingredients.length > 0) {
          await dbClient.recipeIngredient.createMany({
            data: ingredients.map(ing => ({
              name: ing.name,
              weightGrams: ing.weightGrams ?? null,
              quantity: ing.quantity ?? null,
              unit: ing.unit ?? null,
              recipeId: recipeRecord.id,
            })),
          })
        }

        console.log(`  ✅ Рецепт импортирован/обновлен: ${recipeData.title}`)
      }
    }

    console.log('💪 Импорт тренировок...')
    for (const workoutSlug of allEntities.workouts) {
      const workoutRelativePath = `workouts/${workoutSlug}.yaml`
      const workoutData = await downloadAndParseValidatedYaml<any>(
        workoutRelativePath,
        workoutSchema
      )
      if (workoutData) {
        let kinescopeMeta: KinescopeVideo | null = null
        if (workoutData.videoId && process.env.KINESCOPE_API_KEY) {
          kinescopeMeta = await fetchKinescopeVideoMetadata(workoutData.videoId)
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { slug: _slug, ...restData } = workoutData as Record<
          string,
          unknown
        >

        const dataForUpsert = {
          ...restData,
          durationSec: kinescopeMeta?.duration,
          progress: kinescopeMeta?.progress,
          poster: kinescopeMeta?.poster,
          posterUrl: kinescopeMeta?.poster?.original,
        }

        await dbClient.workout.upsert({
          where: { slug: workoutSlug },
          update: dataForUpsert as any,
          create: { slug: workoutSlug, ...(dataForUpsert as any) },
        })

        console.log(
          `  ✅ Тренировка импортирована/обновлена: ${workoutData.title}`
        )
      }
    }

    console.log('📚 Импорт курсов...')
    for (const courseSlug of allEntities.courses) {
      const courseRelativePath = `courses/${courseSlug}/course.yaml`
      const courseData = await downloadAndParseValidatedYaml<any>(
        courseRelativePath,
        courseSchema
      )
      if (!courseData) continue

      // Доп. проверка продукта перед записью в БД
      const isPaidCourse = courseData.product.access === 'paid'

      if (isPaidCourse) {
        const price = (courseData.product as any).price
        if (!Number.isInteger(price) || price < 1) {
          console.error(
            `  ❌ Ошибка: Для платного курса '${courseSlug}' требуется целочисленная цена >= 1. Получено: ${price}`
          )
          continue
        }

        const accessDurationDays = (courseData.product as any).accessDurationDays
        if (!Number.isInteger(accessDurationDays) || accessDurationDays < 1) {
          console.error(
            `  ❌ Ошибка: Для платного курса '${courseSlug}' требуется положительное целочисленное поле accessDurationDays (количество дней доступа). Получено: ${accessDurationDays}`
          )
          continue
        }
      }

      console.log(`\n🔄 Обработка курса: ${courseData.title} (${courseSlug})`)
      console.log(`  Тип курса: ${courseData.contentType || 'FIXED_COURSE'}`)

      const mealPlanSlugs: string[] = courseData.mealPlans || []
      const mealPlanEntries: MealPlanEntry[] = []
      for (const mealPlanSlug of mealPlanSlugs) {
        const mealPlanRelativePath = `courses/${courseSlug}/meal-plans/${mealPlanSlug}.yaml`
        const mealPlanData = await downloadAndParseValidatedYaml<MealPlan>(
          mealPlanRelativePath,
          mealPlanSchema
        )
        if (mealPlanData) {
          const normalizedMealPlan: MealPlanEntry = {
            ...mealPlanData,
            slug: mealPlanData.slug ?? mealPlanSlug,
          }
          mealPlanEntries.push(normalizedMealPlan)
        }
      }

      let weeksData: WeeksConfiguration | null = null
      if (courseData.contentType === 'SUBSCRIPTION') {
        const weeksRelativePath = `courses/${courseSlug}/weeks.yaml`
        weeksData = await downloadAndParseValidatedYaml<WeeksConfiguration>(
          weeksRelativePath,
          weeksSchema
        )
      }

      const initialDailyPlanSlugs: string[] = courseData.dailyPlans || []
      const fetchedDailyPlanEntries: DailyPlanEntry[] = []
      for (const dailyPlanSlug of initialDailyPlanSlugs) {
        const dailyPlanRelativePath = `courses/${courseSlug}/daily-plans/${dailyPlanSlug}.yaml`
        const dailyPlanData = await downloadAndParseValidatedYaml<DailyPlan>(
          dailyPlanRelativePath,
          dailyPlanSchema
        )
        if (dailyPlanData) {
          const normalizedDailyPlan: DailyPlanEntry = {
            ...dailyPlanData,
            slug: dailyPlanData.slug ?? dailyPlanSlug,
          }
          fetchedDailyPlanEntries.push(normalizedDailyPlan)
        }
      }

      let dailyPlanEntriesToProcess: DailyPlanEntry[] = fetchedDailyPlanEntries
      let subscriptionPruneInfo:
        | { firstValidWeek: number; latestWeek: number }
        | null = null

      if (courseData.contentType === 'SUBSCRIPTION') {
        const validPlans = fetchedDailyPlanEntries.filter(
          plan => typeof plan.weekNumber === 'number'
        )

        if (validPlans.length > 0) {
          const latestWeek = Math.max(...validPlans.map(plan => plan.weekNumber))
          const weekWindow = 4
          const firstValidWeek = Math.max(1, latestWeek - weekWindow + 1)

          subscriptionPruneInfo = { latestWeek, firstValidWeek }

          dailyPlanEntriesToProcess = validPlans.filter(
            plan => plan.weekNumber >= firstValidWeek
          )
        } else {
          dailyPlanEntriesToProcess = []
        }
      }

      const dailyPlanSlugsToProcess = dailyPlanEntriesToProcess.map(
        plan => plan.slug
      )
      const dailyPlanDataBySlug = new Map<string, DailyPlanEntry>(
        dailyPlanEntriesToProcess.map(plan => [plan.slug, plan])
      )

      await dbClient.$transaction(
        async tx => {
          // Upsert курса со вложенным upsert продукта (прямая 1:1 связь)
          const allowedWorkoutDays =
            courseData.allowedWorkoutDaysPerWeek &&
            courseData.allowedWorkoutDaysPerWeek.length > 0
              ? courseData.allowedWorkoutDaysPerWeek
              : [5]

          const course = await tx.course.upsert({
            where: { slug: courseSlug },
            update: {
              title: courseData.title,
            description: courseData.description,
            shortDescription: courseData.shortDescription,
            thumbnail: courseData.thumbnail,
            image: courseData.image,
            draft: courseData.draft,
            durationWeeks: courseData.durationWeeks,
            allowedWorkoutDaysPerWeek: allowedWorkoutDays,
            contentType: courseData.contentType || 'FIXED_COURSE',
            product: {
              upsert: {
                update: {
                  access: courseData.product.access,
                  price:
                    isPaidCourse
                      ? (courseData.product as any).price
                      : null,
                  accessDurationDays:
                    isPaidCourse
                      ? (courseData.product as any).accessDurationDays
                      : null,
                },
                create: {
                  access: courseData.product.access,
                  price:
                    isPaidCourse
                      ? (courseData.product as any).price
                      : null,
                  accessDurationDays:
                    isPaidCourse
                      ? (courseData.product as any).accessDurationDays
                      : null,
                },
              },
            },
          },
          create: {
            slug: courseSlug,
            title: courseData.title,
            description: courseData.description,
            shortDescription: courseData.shortDescription,
            thumbnail: courseData.thumbnail,
            image: courseData.image,
            draft: courseData.draft,
            durationWeeks: courseData.durationWeeks,
            allowedWorkoutDaysPerWeek: allowedWorkoutDays,
            contentType: courseData.contentType || 'FIXED_COURSE',
            product: {
              create: {
                access: courseData.product.access,
                price:
                  isPaidCourse
                    ? (courseData.product as any).price
                    : null,
                accessDurationDays:
                  isPaidCourse
                    ? (courseData.product as any).accessDurationDays
                    : null,
              },
            },
          },
        })

        console.log(
          `  ✅ Курс импортирован/обновлен: ${courseData.title} (ID: ${course.id})`
        )

        console.log(`  🍽️ Импорт планов питания для курса "${courseSlug}"...`)
        for (const mealPlanData of mealPlanEntries) {
          const breakfastRecipe = await tx.recipe.findUnique({
            where: { slug: mealPlanData.breakfastRecipeId },
          })
          const lunchRecipe = await tx.recipe.findUnique({
            where: { slug: mealPlanData.lunchRecipeId },
          })
          const dinnerRecipe = await tx.recipe.findUnique({
            where: { slug: mealPlanData.dinnerRecipeId },
          })

          if (!breakfastRecipe || !lunchRecipe || !dinnerRecipe) {
            console.error(
              `    ❌ Ошибка: Один или несколько рецептов не найдены для плана питания ${mealPlanData.slug}. Пропускаем.`
            )
            continue
          }

          await tx.mealPlan.upsert({
            where: {
              courseId_slug: { courseId: course.id, slug: mealPlanData.slug },
            },
            update: {
              title: mealPlanData.title,
              description: mealPlanData.description,
              breakfastRecipeId: breakfastRecipe.id,
              lunchRecipeId: lunchRecipe.id,
              dinnerRecipeId: dinnerRecipe.id,
            },
            create: {
              slug: mealPlanData.slug,
              title: mealPlanData.title,
              description: mealPlanData.description,
              courseId: course.id,
              breakfastRecipeId: breakfastRecipe.id,
              lunchRecipeId: lunchRecipe.id,
              dinnerRecipeId: dinnerRecipe.id,
            },
          })

          console.log(
            `    ✅ План питания импортирован/обновлен: ${mealPlanData.slug}`
          )
        }

        // Импорт недель для подписочных курсов
        if (course.contentType === 'SUBSCRIPTION' && weeksData) {
          console.log(
            `  📅 Импорт недель для подписочного курса "${courseSlug}"...`
          )
          if ((weeksData as any).weeks) {
            for (const weekData of (weeksData as any).weeks as Array<{
              weekNumber: number
              releaseAt: string
            }>) {
              await tx.week.upsert({
                where: {
                  courseId_weekNumber: {
                    courseId: course.id,
                    weekNumber: weekData.weekNumber,
                  },
                },
                update: {
                  releaseAt: new Date(weekData.releaseAt),
                },
                create: {
                  weekNumber: weekData.weekNumber,
                  releaseAt: new Date(weekData.releaseAt),
                  courseId: course.id,
                },
              })
              console.log(
                `    ✅ Неделя импортирована/обновлена: неделя ${weekData.weekNumber}`
              )
            }
          }
        }

        console.log(`  📅 Импорт дневных планов для курса "${courseSlug}"...`)
        if (course.contentType === 'SUBSCRIPTION') {
          console.log('  - Логика для курсов-подписок активирована')
          if (subscriptionPruneInfo) {
            console.log(
              `    - Найдена последняя неделя: ${subscriptionPruneInfo.latestWeek}`
            )
            console.log(
              `    - Установка окна контента: недели с ${subscriptionPruneInfo.firstValidWeek} по ${subscriptionPruneInfo.latestWeek}`
            )

            const { count: userPlansCount } = await tx.userDailyPlan.deleteMany(
              {
                where: {
                  originalDailyPlan: {
                    courseId: course.id,
                    weekNumber: {
                      lt: subscriptionPruneInfo.firstValidWeek,
                    },
                  },
                },
              }
            )
            if (userPlansCount > 0) {
              console.log(
                `    - Удалено ${userPlansCount} связанных пользовательских планов.`
              )
            }

            const { count } = await tx.dailyPlan.deleteMany({
              where: {
                courseId: course.id,
                weekNumber: {
                  lt: subscriptionPruneInfo.firstValidWeek,
                },
              },
            })
            if (count > 0) {
              console.log(
                `    - Удалено ${count} устаревших ежедневных планов.`
              )
            }
          }
          console.log(
            `    - К импорту/обновлению готово ${dailyPlanSlugsToProcess.length} планов.`
          )
        }

        for (const dailyPlanSlug of dailyPlanSlugsToProcess) {
          const dailyPlanData = dailyPlanDataBySlug.get(dailyPlanSlug)

          if (!dailyPlanData) {
            console.warn(
              `    🟡 Данные ежедневного плана ${dailyPlanSlug} не найдены после загрузки. Пропускаем.`
            )
            continue
          }

          const warmupWorkout = await tx.workout.findUnique({
            where: { slug: dailyPlanData.warmupId },
          })
          const mainWorkout = dailyPlanData.mainWorkoutId
            ? await tx.workout.findUnique({
                where: { slug: dailyPlanData.mainWorkoutId },
              })
            : null
          const mealPlan = dailyPlanData.mealPlanId
            ? await tx.mealPlan.findUnique({
                where: {
                  courseId_slug: {
                    courseId: course.id,
                    slug: dailyPlanData.mealPlanId,
                  },
                },
              })
            : null

          if (!warmupWorkout || (dailyPlanData.mainWorkoutId && !mainWorkout)) {
            console.error(
              `    ❌ Ошибка: Не найдены зависимости для ${dailyPlanSlug}. Пропускаем.`
            )
            continue
          }

          if (dailyPlanData.mealPlanId && !mealPlan) {
            console.warn(
              `    🟡 План питания '${dailyPlanData.mealPlanId}' не найден для ежедневного плана ${dailyPlanSlug}. Связь mealPlan будет опущена/очищена.`
            )
          }

          const dailyPlanUpdateData = {
            dayNumberInWeek: dailyPlanData.dayNumberInWeek,
            weekNumber: dailyPlanData.weekNumber,
            description: dailyPlanData.description,
            warmup: { connect: { id: warmupWorkout.id } },
            ...(dailyPlanData.mainWorkoutId
              ? {
                  mainWorkout: {
                    connect: { id: (mainWorkout as { id: string }).id },
                  },
                }
              : { mainWorkout: { disconnect: true } }),
            ...(mealPlan
              ? { mealPlan: { connect: { id: mealPlan.id } } }
              : { mealPlan: { disconnect: true } }),
          }

          const dailyPlanCreateData = {
            slug: dailyPlanData.slug,
            dayNumberInWeek: dailyPlanData.dayNumberInWeek,
            weekNumber: dailyPlanData.weekNumber,
            description: dailyPlanData.description,
            course: { connect: { id: course.id } },
            warmup: { connect: { id: warmupWorkout.id } },
            ...(dailyPlanData.mainWorkoutId && mainWorkout
              ? { mainWorkout: { connect: { id: mainWorkout.id } } }
              : {}),
            ...(mealPlan
              ? { mealPlan: { connect: { id: mealPlan.id } } }
              : {}),
          }

          const upsertedPlan = await tx.dailyPlan.upsert({
            where: {
              courseId_slug: {
                courseId: course.id,
                slug: dailyPlanData.slug,
              },
            },
            update: dailyPlanUpdateData as any,
            create: dailyPlanCreateData as any,
            include: { contentBlocks: true },
          })

          await tx.contentBlock.deleteMany({
            where: { dailyPlanId: upsertedPlan.id },
          })
          if (
            dailyPlanData.contentBlocks &&
            dailyPlanData.contentBlocks.length > 0
          ) {
            await tx.contentBlock.createMany({
              data: dailyPlanData.contentBlocks.map((block: any) => ({
                ...block,
                dailyPlanId: upsertedPlan.id,
              })),
            })
          }
          console.log(
            `    ✅ Ежедневный план импортирован/обновлен: ${dailyPlanData.slug}`
          )
        }
        // После импорта ежедневных планов — предупреждение о несоответствии требуемым количествам
        try {
          const durationWeeks = course.durationWeeks ?? 0
          const allowedDays =
            course.allowedWorkoutDaysPerWeek &&
            course.allowedWorkoutDaysPerWeek.length > 0
              ? course.allowedWorkoutDaysPerWeek
              : [5]
          const maxDays = Math.max(...allowedDays)
          const totalDays = durationWeeks * 7
          const requiredMainWorkoutDays = maxDays * durationWeeks
          const requiredWarmupOnlyDays = Math.max(
            0,
            totalDays - requiredMainWorkoutDays
          )

          const [actualMainWorkoutDays, actualWarmupOnlyDays] =
            await Promise.all([
              tx.dailyPlan.count({
                where: { courseId: course.id, NOT: { mainWorkoutId: null } },
              }),
              tx.dailyPlan.count({
                where: { courseId: course.id, mainWorkoutId: null },
              }),
            ])

          if (
            actualMainWorkoutDays < requiredMainWorkoutDays ||
            actualWarmupOnlyDays < requiredWarmupOnlyDays
          ) {
            console.warn(
              `  ⚠️ Предупреждение: Для курса "${courseSlug}" требуются ${requiredMainWorkoutDays} дней с основной тренировкой и ${requiredWarmupOnlyDays} дней только с разминкой за ${durationWeeks} нед., но загружено: ${actualMainWorkoutDays} и ${actualWarmupOnlyDays}. Проверьте daily-plans или настройки durationWeeks/allowedWorkoutDaysPerWeek в course.yaml.`
            )
          }
        } catch (e) {
          console.warn(
            `  ⚠️ Не удалось выполнить проверку соответствия количеств для курса "${courseSlug}":`,
            e
          )
        }
        },
        { timeout: 180000 }
      )
    }

    console.log('✅ Импорт курсов завершён!')
  } catch (error) {
    console.error('❌ Произошла ошибка при загрузке контента:', error)
  } finally {
    await dbClient.$disconnect()
  }
}

// Запуск основного процесса

if (require.main === module) {
  downloadAndUploadContent()
    .then(() => console.log('Контент успешно загружен в базу данных!'))
    .catch(error => console.error('Произошла ошибка:', error))
}
