import { injectable } from 'inversify'

import { RecipeRepository } from '../_repositories/recipe'

@injectable()
export class ToggleFavoriteRecipeService {
  constructor(private readonly recipeRepository: RecipeRepository) {}

  async exec(userId: string, recipeId: string) {
    const isFavorite = await this.recipeRepository.isFavorite(userId, recipeId)

    if (isFavorite) {
      await this.recipeRepository.removeFromFavorites(userId, recipeId)
      return { favorite: false }
    }

    await this.recipeRepository.addToFavorites(userId, recipeId)
    return { favorite: true }
  }
}
