import { injectable } from 'inversify'

import { RecipeRepository } from '../_repositories/recipe'

@injectable()
export class DeleteRecipeService {
  constructor(private readonly recipeRepository: RecipeRepository) {}

  async exec(id: string) {
    return this.recipeRepository.deleteRecipe(id)
  }
}
