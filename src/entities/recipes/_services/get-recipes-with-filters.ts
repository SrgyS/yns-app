import { injectable } from 'inversify'
import {
  CookingDifficulty,
  MealCategory,
  RecipeDiet,
  RecipeIngredientTag,
} from '@prisma/client'

import { RecipeRepository } from '../_repositories/recipe'

type GetRecipesWithFiltersInput = {
  search?: string
  mealCategories?: MealCategory[]
  diets?: RecipeDiet[]
  difficulty?: CookingDifficulty[]
  fast?: boolean
  ingredientTags?: RecipeIngredientTag[]
  onlyFavorites?: boolean
  userId?: string
}

@injectable()
export class GetRecipesWithFiltersService {
  constructor(private readonly recipeRepository: RecipeRepository) {}

  async exec(input: GetRecipesWithFiltersInput) {
    if (input.onlyFavorites && !input.userId) {
      throw new Error('userId is required when requesting only favorite recipes')
    }

    return this.recipeRepository.getRecipesByFilters({
      search: input.search,
      mealCategories: input.mealCategories,
      diets: input.diets,
      cookingDifficulty: input.difficulty,
      ingredientTags: input.ingredientTags,
      onlyFavorites: input.onlyFavorites,
      userId: input.userId,
      maxPreparationTimeMinutes: input.fast ? 20 : undefined,
    })
  }
}
