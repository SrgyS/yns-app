import { TRPCError } from '@trpc/server'
import { injectable, inject } from 'inversify'
import {
  authorizedProcedure,
  Controller,
  router,
} from '@/kernel/lib/trpc/module'
import {
  CookingDifficulty,
  MealCategory,
  RecipeDiet,
  RecipeIngredientTag,
} from '@prisma/client'
import { z } from 'zod'

import { GetRecipesWithFiltersService } from '@/entities/recipes/_services/get-recipes-with-filters'
import { RecipeRepository } from '@/entities/recipes/_repositories/recipe'
import { ToggleFavoriteRecipeService } from '@/entities/recipes/_services/toggle-favorite-recipe'
import { GetUserCoursesListService } from '@/features/user-courses/module'

@injectable()
export class UserRecipesController extends Controller {
  constructor(
    @inject(GetRecipesWithFiltersService)
    private readonly getRecipesWithFiltersService: GetRecipesWithFiltersService,
    @inject(RecipeRepository)
    private readonly recipeRepository: RecipeRepository,
    @inject(ToggleFavoriteRecipeService)
    private readonly toggleFavoriteRecipeService: ToggleFavoriteRecipeService,
    @inject(GetUserCoursesListService)
    private readonly getUserCoursesListService: GetUserCoursesListService
  ) {
    super()
  }

  private async ensureRecipesAccess(userId?: string) {
    if (!userId) {
      throw new TRPCError({ code: 'UNAUTHORIZED' })
    }

    const courses = await this.getUserCoursesListService.exec(userId)
    const allowed = courses.filter(item => item.course.showRecipes)

    if (allowed.length === 0) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Нет доступа к рецептам',
      })
    }

    return allowed
  }

  public router = router({
    recipes: router({
      list: authorizedProcedure
        .input(
          z
            .object({
              search: z.string().optional(),
              mealCategories: z.array(z.nativeEnum(MealCategory)).optional(),
              diets: z.array(z.nativeEnum(RecipeDiet)).optional(),
              difficulty: z.array(z.nativeEnum(CookingDifficulty)).optional(),
              fast: z.boolean().optional(),
              ingredientTags: z.array(z.nativeEnum(RecipeIngredientTag)).optional(),
              onlyFavorites: z.boolean().optional(),
            })
            .optional()
        )
        .query(async ({ ctx, input }) => {
          const userId = ctx.session.user.id
          await this.ensureRecipesAccess(userId)
          const payload = input ?? {}

          const recipes = await this.getRecipesWithFiltersService.exec({
            search: payload.search,
            mealCategories: payload.mealCategories,
            diets: payload.diets,
            difficulty: payload.difficulty,
            fast: payload.fast,
            ingredientTags: payload.ingredientTags,
            onlyFavorites: payload.onlyFavorites,
            userId: userId,
          })

          const favoriteIds = await this.recipeRepository.getFavoriteIds(userId)
          const favoriteSet = new Set(favoriteIds)

          return recipes.map(recipe => ({
            ...recipe,
            isFavorite: favoriteSet.has(recipe.id),
          }))
        }),

      getBySlug: authorizedProcedure
        .input(z.object({ slug: z.string().min(1) }))
        .query(async ({ ctx, input }) => {
          const userId = ctx.session.user.id
          await this.ensureRecipesAccess(userId)
          const recipe = await this.recipeRepository.getRecipeBySlug(input.slug)
          if (!recipe) {
            throw new TRPCError({ code: 'NOT_FOUND' })
          }
          const isFavorite = await this.recipeRepository.isFavorite(
            userId,
            recipe.id
          )
          return { ...recipe, isFavorite }
        }),

      toggleFavorite: authorizedProcedure
        .input(z.object({ recipeId: z.string() }))
        .mutation(async ({ ctx, input }) => {
          return this.toggleFavoriteRecipeService.exec(ctx.session.user.id, input.recipeId)
        }),

      getFavorites: authorizedProcedure.query(async ({ ctx }) => {
        const favorites = await this.recipeRepository.getFavoriteRecipes(ctx.session.user.id)
        return favorites.map(fav => fav.recipe)
      }),
    }),
  })
}
