import { injectable } from 'inversify'
import {
  CookingDifficulty,
  MealCategory,
  RecipeDiet,
  RecipeIngredientTag,
} from '@prisma/client'

import { RecipeRepository } from '../_repositories/recipe'

type CreateRecipeInput = {
  title: string
  description?: string
  shortDescription?: string
  preparationTimeMinutes: number
  calories?: number
  servings: number
  cookingDifficulty: CookingDifficulty
  imageUrl?: string
  diets?: RecipeDiet[]
  ingredientTags?: RecipeIngredientTag[]
  isGlutenFree?: boolean
  isSugarFree?: boolean
  mealCategories?: MealCategory[]
  slug: string
}

@injectable()
export class CreateRecipeService {
  constructor(private readonly recipeRepository: RecipeRepository) {}

  async exec(input: CreateRecipeInput) {
    return this.recipeRepository.createRecipe(input)
  }
}
