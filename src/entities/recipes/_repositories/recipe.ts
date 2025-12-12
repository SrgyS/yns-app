import { injectable } from 'inversify'
import { Prisma, CookingDifficulty, MealCategory, RecipeDiet, RecipeIngredientTag } from '@prisma/client'

import { dbClient } from '@/shared/lib/db'

type RecipeFilters = {
  search?: string
  mealCategories?: MealCategory[]
  diets?: RecipeDiet[]
  ingredientTags?: RecipeIngredientTag[]
  cookingDifficulty?: CookingDifficulty[]
  onlyFavorites?: boolean
  userId?: string
  maxPreparationTimeMinutes?: number
}

type CreateRecipeData = {
  title: string
  description?: string
  shortDescription?: string
  preparationTimeMinutes: number
  calories?: number | null
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

type UpdateRecipeData = {
  title?: string
  description?: string | null
  shortDescription?: string | null
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

type IngredientData = {
  name: string
  weightGrams?: number | null
  quantity?: number | null
  unit?: string
  description?: string
  order?: number
  id?: string
}

type StepData = {
  stepNumber: number
  instruction: string
  id?: string
}

@injectable()
export class RecipeRepository {
  async getAllRecipes() {
    return dbClient.recipe.findMany({
      orderBy: { title: 'asc' },
      include: {
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    })
  }

  async getRecipeById(id: string) {
    return dbClient.recipe.findUnique({
      where: { id },
      include: {
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    })
  }

  async getRecipeBySlug(slug: string) {
    return dbClient.recipe.findUnique({
      where: { slug },
      include: {
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    })
  }

  async getRecipesByFilters(filters: RecipeFilters) {
    if (filters.onlyFavorites && !filters.userId) {
      throw new Error('userId is required when filtering only favorites')
    }

    const where: Prisma.RecipeWhereInput = {
      title: filters.search
        ? {
            contains: filters.search,
            mode: 'insensitive',
          }
        : undefined,
      mealCategories: filters.mealCategories?.length
        ? { hasSome: filters.mealCategories }
        : undefined,
      diets: filters.diets?.length ? { hasSome: filters.diets } : undefined,
      ingredientTags: filters.ingredientTags?.length
        ? { hasSome: filters.ingredientTags }
        : undefined,
      cookingDifficulty: filters.cookingDifficulty?.length
        ? { in: filters.cookingDifficulty }
        : undefined,
      favoriteRecipes: filters.onlyFavorites
        ? { some: { userId: filters.userId } }
        : undefined,
      preparationTimeMinutes: filters.maxPreparationTimeMinutes
        ? { lte: filters.maxPreparationTimeMinutes }
        : undefined,
    }

    return dbClient.recipe.findMany({
      where,
      orderBy: { title: 'asc' },
      include: {
        ingredients: { orderBy: { order: 'asc' } },
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    })
  }

  async createRecipe(data: CreateRecipeData) {
    return dbClient.recipe.create({
      data: {
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        preparationTimeMinutes: data.preparationTimeMinutes,
        calories: data.calories ?? null,
        servings: data.servings,
        cookingDifficulty: data.cookingDifficulty,
        imageUrl: data.imageUrl,
        diets: data.diets ?? [],
        ingredientTags: data.ingredientTags ?? [],
        isGlutenFree: data.isGlutenFree ?? false,
        isSugarFree: data.isSugarFree ?? false,
        mealCategories: data.mealCategories ?? [],
        slug: data.slug,
      },
    })
  }

  async updateRecipe(id: string, data: UpdateRecipeData) {
    return dbClient.recipe.update({
      where: { id },
      data,
    })
  }

  async deleteRecipe(id: string) {
    return dbClient.recipe.delete({
      where: { id },
    })
  }

  async createIngredient(recipeId: string, data: IngredientData) {
    const nextOrder =
      typeof data.order === 'number'
        ? data.order
        : await this.getNextIngredientOrder(recipeId)

    return dbClient.recipeIngredient.create({
      data: {
        recipeId,
        name: data.name,
        weightGrams: data.weightGrams ?? null,
        quantity: data.quantity ?? null,
        unit: data.unit,
        description: data.description,
        order: nextOrder,
      },
    })
  }

  async updateIngredient(id: string, data: IngredientData) {
    return dbClient.recipeIngredient.update({
      where: { id },
      data,
    })
  }

  async deleteIngredient(id: string) {
    return dbClient.recipeIngredient.delete({
      where: { id },
    })
  }

  async createStep(recipeId: string, stepNumber: number, instruction: string) {
    return dbClient.recipeStep.create({
      data: {
        recipeId,
        stepNumber,
        instruction,
      },
    })
  }

  async updateStep(id: string, instruction: string) {
    return dbClient.recipeStep.update({
      where: { id },
      data: { instruction },
    })
  }

  async deleteStep(id: string) {
    return dbClient.recipeStep.delete({
      where: { id },
    })
  }

  async getFavoriteRecipes(userId: string) {
    return dbClient.userFavoriteRecipe.findMany({
      where: { userId },
      include: {
        recipe: {
          include: {
            ingredients: { orderBy: { order: 'asc' } },
            steps: { orderBy: { stepNumber: 'asc' } },
          },
        },
      },
    })
  }

  async addToFavorites(userId: string, recipeId: string) {
    return dbClient.userFavoriteRecipe.create({
      data: {
        userId,
        recipeId,
      },
    })
  }

  async removeFromFavorites(userId: string, recipeId: string) {
    return dbClient.userFavoriteRecipe.delete({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
    })
  }

  async isFavorite(userId: string, recipeId: string) {
    const favorite = await dbClient.userFavoriteRecipe.findUnique({
      where: {
        userId_recipeId: {
          userId,
          recipeId,
        },
      },
      select: { id: true },
    })

    return Boolean(favorite)
  }

  private async getNextIngredientOrder(recipeId: string) {
    const last = await dbClient.recipeIngredient.findFirst({
      where: { recipeId },
      orderBy: { order: 'desc' },
      select: { order: true },
    })

    if (last) {
      return last.order + 1
    }

    return 0
  }

  async replaceIngredients(recipeId: string, items: IngredientData[]) {
    await dbClient.$transaction([
      dbClient.recipeIngredient.deleteMany({ where: { recipeId } }),
      ...items.map(item =>
        dbClient.recipeIngredient.create({
          data: {
            recipeId,
            name: item.name,
            weightGrams: item.weightGrams ?? null,
            quantity: item.quantity ?? null,
            unit: item.unit,
            description: item.description,
            order: typeof item.order === 'number' ? item.order : 0,
          },
        })
      ),
    ])
  }

  async replaceSteps(recipeId: string, items: StepData[]) {
    await dbClient.$transaction([
      dbClient.recipeStep.deleteMany({ where: { recipeId } }),
      ...items.map(item =>
        dbClient.recipeStep.create({
          data: {
            recipeId,
            stepNumber: item.stepNumber,
            instruction: item.instruction,
          },
        })
      ),
    ])
  }
}
