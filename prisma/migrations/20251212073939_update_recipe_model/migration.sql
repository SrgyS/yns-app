/*
  Warnings:

  - You are about to drop the column `difficulty` on the `Recipe` table. All the data in the column will be lost.
  - Added the required column `cookingDifficulty` to the `Recipe` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecipeDiet" AS ENUM ('VEGETARIAN', 'HIGH_PROTEIN', 'LOW_CARB', 'GLUTEN_FREE', 'VEGAN', 'LOW_CALORIE', 'LACTOSE_FREE', 'SUGAR_FREE');

-- CreateEnum
CREATE TYPE "CookingDifficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "RecipeIngredientTag" AS ENUM ('FISH', 'SEAFOOD', 'NUTS', 'EGGS', 'DAIRY', 'PORK', 'BEEF', 'BREAD', 'PASTA', 'RICE', 'POTATO', 'AVOCADO', 'SALMON', 'BACON', 'SPINACH');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "showRecipes" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Recipe" DROP COLUMN "difficulty",
ADD COLUMN     "cookingDifficulty" "CookingDifficulty" NOT NULL,
ADD COLUMN     "diets" "RecipeDiet"[] DEFAULT ARRAY[]::"RecipeDiet"[],
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "ingredientTags" "RecipeIngredientTag"[] DEFAULT ARRAY[]::"RecipeIngredientTag"[],
ADD COLUMN     "shortDescription" TEXT;

-- DropEnum
DROP TYPE "RecipeDifficulty";
