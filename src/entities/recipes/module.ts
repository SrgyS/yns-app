import { ContainerModule } from 'inversify'
import { RecipeRepository } from './_repositories/recipe'
import { CreateRecipeService } from './_services/create-recipe'
import { UpdateRecipeService } from './_services/update-recipe'
import { DeleteRecipeService } from './_services/delete-recipe'
import { ToggleFavoriteRecipeService } from './_services/toggle-favorite-recipe'
import { GetRecipesWithFiltersService } from './_services/get-recipes-with-filters'

export const RecipesModule = new ContainerModule(context => {
  const { bind } = context
  bind(RecipeRepository).toSelf()
  bind(CreateRecipeService).toSelf()
  bind(UpdateRecipeService).toSelf()
  bind(DeleteRecipeService).toSelf()
  bind(ToggleFavoriteRecipeService).toSelf()
  bind(GetRecipesWithFiltersService).toSelf()
})
