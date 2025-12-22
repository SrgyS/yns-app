import { injectable } from 'inversify'
import { Prisma } from '@prisma/client'
import { TRPCError } from '@trpc/server'
import { CourseUpsertInput } from '../_schemas'

@injectable()
export class MealPlanService {
  async syncMealPlans(
    tx: Prisma.TransactionClient,
    courseId: string,
    mealPlans: CourseUpsertInput['mealPlans']
  ) {
    const mealPlanSlugs = mealPlans.map(plan => plan.slug)
    await tx.mealPlan.deleteMany({
      where: {
        courseId,
        slug: { notIn: mealPlanSlugs },
      },
    })

    for (const plan of mealPlans) {
      const breakfast = await this.resolveRecipeBySlug(
        plan.breakfastRecipeId,
        tx
      )
      const lunch = await this.resolveRecipeBySlug(plan.lunchRecipeId, tx)
      const dinner = await this.resolveRecipeBySlug(plan.dinnerRecipeId, tx)

      await tx.mealPlan.upsert({
        where: {
          courseId_slug: { courseId, slug: plan.slug },
        },
        update: {
          title: plan.title,
          description: plan.description ?? null,
          breakfastRecipeId: breakfast.id,
          lunchRecipeId: lunch.id,
          dinnerRecipeId: dinner.id,
        },
        create: {
          slug: plan.slug,
          title: plan.title,
          description: plan.description ?? null,
          courseId,
          breakfastRecipeId: breakfast.id,
          lunchRecipeId: lunch.id,
          dinnerRecipeId: dinner.id,
        },
      })
    }
  }

  private async resolveRecipeBySlug(
    slug: string,
    tx: Prisma.TransactionClient
  ) {
    const recipe = await tx.recipe.findUnique({ where: { slug } })
    if (!recipe) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Рецепт со slug "${slug}" не найден`,
      })
    }
    return recipe
  }
}
