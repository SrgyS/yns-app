import { injectable } from 'inversify'
import { CookingDifficulty, MealCategory, RecipeDiet, RecipeIngredientTag } from '@prisma/client'

import { RecipeRepository } from '../_repositories/recipe'

type UpdateRecipeInput = {
  title?: string
  description?: string
  shortDescription?: string
  preparationTimeMinutes?: number
  calories?: number | null
  servings?: number
  cookingDifficulty?: CookingDifficulty
  imageUrl?: string | null
  diets?: RecipeDiet[]
  ingredientTags?: RecipeIngredientTag[]
  isGlutenFree?: boolean
  isSugarFree?: boolean
  mealCategories?: MealCategory[]
  slug?: string
}

@injectable()
export class UpdateRecipeService {
  constructor(private readonly recipeRepository: RecipeRepository) {}

  async exec(id: string, input: UpdateRecipeInput) {
    return this.recipeRepository.updateRecipe(id, input)
  }
}
