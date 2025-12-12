import { TRPCError } from '@trpc/server'
import { injectable, inject } from 'inversify'
import {
  authorizedProcedure,
  publicProcedure,
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

@injectable()
export class UserRecipesController extends Controller {
  constructor(
    @inject(GetRecipesWithFiltersService)
    private readonly getRecipesWithFiltersService: GetRecipesWithFiltersService,
    @inject(RecipeRepository)
    private readonly recipeRepository: RecipeRepository,
    @inject(ToggleFavoriteRecipeService)
    private readonly toggleFavoriteRecipeService: ToggleFavoriteRecipeService
  ) {
    super()
  }

  public router = router({
    recipes: router({
      list: publicProcedure
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
          const payload = input ?? {}

          if (payload.onlyFavorites && !ctx.session) {
            throw new TRPCError({ code: 'UNAUTHORIZED' })
          }

          return this.getRecipesWithFiltersService.exec({
            search: payload.search,
            mealCategories: payload.mealCategories,
            diets: payload.diets,
            difficulty: payload.difficulty,
            fast: payload.fast,
            ingredientTags: payload.ingredientTags,
            onlyFavorites: payload.onlyFavorites,
            userId: payload.onlyFavorites ? ctx.session?.user.id : undefined,
          })
        }),

      getBySlug: publicProcedure
        .input(z.object({ slug: z.string().min(1) }))
        .query(async ({ input }) => {
          const recipe = await this.recipeRepository.getRecipeBySlug(input.slug)
          if (!recipe) {
            throw new TRPCError({ code: 'NOT_FOUND' })
          }
          return recipe
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
