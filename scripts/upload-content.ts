import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import { contentParser } from '../src/shared/api/content';
import manifestSchema from '../src/shared/api/content/_schemas/manifest.schema.json';
import courseSchema from '../src/shared/api/content/_schemas/course.schema.json';
import dailyPlanSchema from '../src/shared/api/content/_schemas/daily-plan.schema.json';
import workoutSchema from '../src/shared/api/content/_schemas/workout.schema.json';
import mealPlanSchema from '../src/shared/api/content/_schemas/meal-plan.schema.json';
import recipeSchema from '../src/shared/api/content/_schemas/recipe.schema.json';
import { ParsingError, ValidationError } from '../src/shared/lib/errors';
import { Course } from '@/shared/api/content/_schemas/course.schema';

export type KinescopePoster = {
  id: string;
  status?: 'done' | 'processing' | 'error';
  active?: boolean;
  original: string;
  md?: string;
  sm?: string;
  xs?: string;
  [k: string]: unknown;
};

type KinescopeVideo = {
  duration?: number | null;
  progress?: number | null;
  poster?: KinescopePoster | null;
};

type Envelope<T> = { data: T };

function unwrap<T>(payload: Envelope<T> | T): T {
  return (payload as Envelope<T>)?.data ?? (payload as T);
}

// Утилита для получения метаданных видео из Kinescope
async function fetchKinescopeVideoMetadata(
  videoId: string
): Promise<KinescopeVideo | null> {
  const apiKey = process.env.KINESCOPE_API_KEY;
  if (!apiKey) throw new Error('KINESCOPE_API_KEY is not set');
  try {
    const resp = await fetch(`https://api.kinescope.io/v1/videos/${videoId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      cache: 'no-store',
    });
    if (!resp.ok) {
      console.warn(
        `  🟡 Не удалось получить метаданные Kinescope для videoId=${videoId}: ${resp.status} ${resp.statusText}`
      );
      return null;
    }

    const payload = (await resp.json()) as
      | Envelope<KinescopeVideo>
      | KinescopeVideo;
    const v = unwrap(payload);

    const duration =
      typeof v.duration === 'number' ? Math.round(v.duration) : undefined;
    const progress =
      typeof v.progress === 'number' ? Math.round(v.progress) : undefined;
    const poster = v.poster ?? undefined;

    return { duration, poster, progress };
  } catch (e) {
    console.warn(
      `  🟡 Ошибка запроса метаданных Kinescope для videoId=${videoId}:`,
      e
    );
    return null;
  }
}

// Функция для скачивания и парсинга YAML-файла
async function downloadAndParseValidatedYaml<T>(
  relativePath: string,
  schema: object
): Promise<T | null> {
  const fetchUrl = `${process.env.CONTENT_URL}/${relativePath}`;
  const slug = path.basename(relativePath, '.yaml');

  try {
    const response = await fetch(fetchUrl, {
      headers: {
        Authorization: `token ${process.env.CONTENT_TOKEN}`,
        Accept: 'application/vnd.github.v3.raw',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`  🟡 Файл не найден по адресу ${fetchUrl}. Пропускаем.`);
        return null;
      }
      throw new Error(
        `Ошибка при загрузке ${fetchUrl}: ${response.status} ${response.statusText}`
      );
    }

    const text = await response.text();
     const parsedData = await contentParser.parse<T>(text, schema);
     (parsedData as any).slug = slug;
     return parsedData;
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error(`  ❌ Ошибка валидации для ${fetchUrl}:`);
    } else if (error instanceof ParsingError) {
      console.error(`  ❌ Ошибка парсинга для ${fetchUrl}: ${error.message}`);
    } else {
      console.error(
        `  ❌ Непредвиденная ошибка при обработке ${fetchUrl}:`,
        error
      );
    }
    return null;
  }
}

async function listAllEntityFiles() {
  const manifest = await downloadAndParseValidatedYaml<any>(
    'manifest.yaml',
    manifestSchema
  );
  if (!manifest) {
    throw new Error('Could not download or parse manifest.yaml');
  }
  return {
    recipes: manifest.recipes || [],
    workouts: manifest.workouts || [],
    courses: manifest.courses || [],
  };
}

async function downloadAndUploadContent() {
  const dbClient = new PrismaClient();
  try {
    console.log('🚀 Начало удаленной загрузки и импорта контента...');

    const allEntities = await listAllEntityFiles();
    console.log(
      `🔍 Найдено ${allEntities.recipes.length} рецептов, ${allEntities.workouts.length} тренировок и ${allEntities.courses.length} курсов.`
    );

    console.log('🍳 Импорт рецептов...');
    for (const recipeSlug of allEntities.recipes) {
      const recipeRelativePath = `recipes/${recipeSlug}.yaml`;
      const recipeData = await downloadAndParseValidatedYaml<any>(
        recipeRelativePath,
        recipeSchema
      );
      if (recipeData) {
        const ingredients = Array.isArray(recipeData.ingredients)
          ? (recipeData.ingredients as Array<{
              name: string;
              weightGrams?: number | null;
              quantity?: number | null;
              unit?: string | null;
            }>)
          : [];

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
        });

        // Полностью пересоздаём ингредиенты для рецепта из YAML
        await dbClient.recipeIngredient.deleteMany({ where: { recipeId: recipeRecord.id } });
        if (ingredients.length > 0) {
          await dbClient.recipeIngredient.createMany({
            data: ingredients.map((ing) => ({
              name: ing.name,
              weightGrams: ing.weightGrams ?? null,
              quantity: ing.quantity ?? null,
              unit: ing.unit ?? null,
              recipeId: recipeRecord.id,
            })),
          });
        }

        console.log(`  ✅ Рецепт импортирован/обновлен: ${recipeData.title}`);
      }
    }

    console.log('💪 Импорт тренировок...');
    for (const workoutSlug of allEntities.workouts) {
      const workoutRelativePath = `workouts/${workoutSlug}.yaml`;
      const workoutData = await downloadAndParseValidatedYaml<any>(
        workoutRelativePath,
        workoutSchema
      );
      if (workoutData) {
        let kinescopeMeta = null;
        if (workoutData.videoId && process.env.KINESCOPE_API_KEY) {
          kinescopeMeta = await fetchKinescopeVideoMetadata(
            workoutData.videoId
          );
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { slug, ...restData } = workoutData;

        const dataForUpsert = {
          ...restData,
          durationSec: kinescopeMeta?.duration,
          progress: kinescopeMeta?.progress,
          poster: kinescopeMeta?.poster,
          posterUrl: kinescopeMeta?.poster?.original,
        };

        await dbClient.workout.upsert({
          where: { slug: workoutSlug },
          update: dataForUpsert,
          create: {
            slug: workoutSlug,
            ...dataForUpsert,
          },
        });
        console.log(`  ✅ Тренировка импортирована/обновлена: ${workoutData.title}`);
      }
    }

    console.log('📚 Импорт курсов...');
    for (const courseSlug of allEntities.courses) {
      const courseRelativePath = `courses/${courseSlug}/course.yaml`;
      const courseData = await downloadAndParseValidatedYaml<Course>(
        courseRelativePath,
        courseSchema
      );
      if (!courseData) continue;

      console.log(`
🔄 Обработка курса: ${courseData.title} (${courseSlug})`);
      console.log(`  Тип курса: ${courseData.contentType || 'FIXED_COURSE'}`);

      const course = await dbClient.course.upsert({
        where: { slug: courseSlug },
        update: {
          title: courseData.title,
          description: courseData.description,
          shortDescription: courseData.shortDescription,
          thumbnail: courseData.thumbnail,
          image: courseData.image,
          draft: courseData.draft,
          durationWeeks: courseData.durationWeeks,
          minWorkoutDaysPerWeek: courseData.minWorkoutDaysPerWeek,
          contentType: courseData.contentType || 'FIXED_COURSE',
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
          minWorkoutDaysPerWeek: courseData.minWorkoutDaysPerWeek,
          contentType: courseData.contentType || 'FIXED_COURSE',
        },
      });
      console.log(
        `  ✅ Курс импортирован/обновлен: ${courseData.title} (ID: ${course.id})`
      );

      console.log(`  🍽️ Импорт планов питания для курса "${courseSlug}"...`);
      const mealPlanSlugs: string[] = courseData.mealPlans || [];
      for (const mealPlanSlug of mealPlanSlugs) {
        const mealPlanRelativePath = `courses/${courseSlug}/meal-plans/${mealPlanSlug}.yaml`;
        const mealPlanData = await downloadAndParseValidatedYaml<any>(
          mealPlanRelativePath,
          mealPlanSchema
        );
        if (mealPlanData) {
          const breakfastRecipe = await dbClient.recipe.findUnique({
            where: { slug: mealPlanData.breakfastRecipeId },
          });
          const lunchRecipe = await dbClient.recipe.findUnique({
            where: { slug: mealPlanData.lunchRecipeId },
          });
          const dinnerRecipe = await dbClient.recipe.findUnique({
            where: { slug: mealPlanData.dinnerRecipeId },
          });

          if (!breakfastRecipe || !lunchRecipe || !dinnerRecipe) {
            console.error(
              `    ❌ Ошибка: Один или несколько рецептов не найдены для плана питания ${mealPlanData.slug}. Пропускаем.`
            );
            continue;
          }

          await dbClient.mealPlan.upsert({
            where: { courseId_slug: { courseId: course.id, slug: mealPlanData.slug } },
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
          });
          console.log(`    ✅ План питания импортирован/обновлен: ${mealPlanData.slug}`);
        }
      }

      console.log(`  🗓️ Импорт ежедневных планов для курса "${courseSlug}"...`);
      let dailyPlanSlugsToProcess: string[] = courseData.dailyPlans || [];
      
      if (course.contentType === 'SUBSCRIPTION_COURSE_MONTHLY') {
        console.log('  - Логика для курсов-подписок активирована');
        const allDailyPlansData = await Promise.all(
          dailyPlanSlugsToProcess.map(slug =>
            downloadAndParseValidatedYaml<any>(
              `courses/${courseSlug}/daily-plans/${slug}.yaml`,
              dailyPlanSchema
            )
          )
        );

        const validPlans = allDailyPlansData.filter(p => p && typeof p.weekNumber === 'number');

        if (validPlans.length > 0) {
          const latestWeek = Math.max(...validPlans.map(p => p.weekNumber));
          const weekWindow = 4;
          const firstValidWeek = Math.max(1, latestWeek - weekWindow + 1);
          
          console.log(`    - Найдена последняя неделя: ${latestWeek}`);
          console.log(`    - Установка окна контента: недели с ${firstValidWeek} по ${latestWeek}`);

          const { count } = await dbClient.dailyPlan.deleteMany({
            where: {
              courseId: course.id,
              weekNumber: {
                lt: firstValidWeek,
              },
            },
          });
          if (count > 0) {
            console.log(`    - Удалено ${count} устаревших ежедневных планов.`);
          }

          dailyPlanSlugsToProcess = validPlans
            .filter(p => p.weekNumber >= firstValidWeek)
            .map(p => p.slug);
            
          console.log(`    - К импорту/обновлению готово ${dailyPlanSlugsToProcess.length} планов.`);
        }
      }

      for (const dailyPlanSlug of dailyPlanSlugsToProcess) {
        const dailyPlanRelativePath = `courses/${courseSlug}/daily-plans/${dailyPlanSlug}.yaml`;
        const dailyPlanData = await downloadAndParseValidatedYaml<any>(
          dailyPlanRelativePath,
          dailyPlanSchema
        );

        if (dailyPlanData) {
          const warmupWorkout = await dbClient.workout.findUnique({ where: { slug: dailyPlanData.warmupId } });
          const mainWorkout = dailyPlanData.mainWorkoutId ? await dbClient.workout.findUnique({ where: { slug: dailyPlanData.mainWorkoutId } }) : null;
          const mealPlan = dailyPlanData.mealPlanId
            ? await dbClient.mealPlan.findUnique({ where: { courseId_slug: { courseId: course.id, slug: dailyPlanData.mealPlanId } } })
            : null;

          if (!warmupWorkout || (dailyPlanData.mainWorkoutId && !mainWorkout)) {
            console.error(`    ❌ Ошибка: Не найдены зависимости для ${dailyPlanSlug}. Пропускаем.`);
            continue;
          }

          if (dailyPlanData.mealPlanId && !mealPlan) {
            console.warn(
              `    🟡 План питания '${dailyPlanData.mealPlanId}' не найден для ежедневного плана ${dailyPlanSlug}. Связь mealPlan будет опущена/очищена.`
            );
          }

          const dailyPlanUpdateData = {
            dayNumber: dailyPlanData.dayNumber,
            weekNumber: dailyPlanData.weekNumber,
            description: dailyPlanData.description,
            warmup: { connect: { id: warmupWorkout.id } },
            ...(dailyPlanData.mainWorkoutId
              ? { mainWorkout: { connect: { id: (mainWorkout as { id: string }).id } } }
              : { mainWorkout: { disconnect: true } }),
            ...(mealPlan
              ? { mealPlan: { connect: { id: mealPlan.id } } }
              : { mealPlan: { disconnect: true } }),
          };

          const dailyPlanCreateData = {
            slug: dailyPlanData.slug,
            dayNumber: dailyPlanData.dayNumber,
            weekNumber: dailyPlanData.weekNumber,
            description: dailyPlanData.description,
            course: { connect: { id: course.id } },
            warmup: { connect: { id: warmupWorkout.id } },
            ...(dailyPlanData.mainWorkoutId && mainWorkout
              ? { mainWorkout: { connect: { id: mainWorkout.id } } }
              : {}),
            ...(mealPlan ? { mealPlan: { connect: { id: mealPlan.id } } } : {}),
          };

          const upsertedPlan = await dbClient.dailyPlan.upsert({
            where: { courseId_slug: { courseId: course.id, slug: dailyPlanData.slug } },
            update: dailyPlanUpdateData,
            create: dailyPlanCreateData,
            include: { contentBlocks: true }
          });

          await dbClient.contentBlock.deleteMany({ where: { dailyPlanId: upsertedPlan.id }});
          if (dailyPlanData.contentBlocks && dailyPlanData.contentBlocks.length > 0) {
            await dbClient.contentBlock.createMany({
              data: dailyPlanData.contentBlocks.map((block: any) => ({
                ...block,
                dailyPlanId: upsertedPlan.id,
              })),
            });
          }
          console.log(`    ✅ Ежедневный план импортирован/обновлен: ${dailyPlanData.slug}`);
        }
      }
    }

    console.log('\n🎉 Удаленная загрузка и импорт контента завершены!');
  } catch (error) {
    console.error('❌ Произошла непредвиденная ошибка во время импорта:', error);
    process.exit(1);
  } finally {
    await dbClient.$disconnect();
  }
}

downloadAndUploadContent()
  .then(() => console.log('Контент успешно загружен в базу данных!'))
  .catch(error => console.error('Произошла ошибка:', error));
