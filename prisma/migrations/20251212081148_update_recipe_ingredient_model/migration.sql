-- AlterTable
ALTER TABLE "RecipeIngredient" ADD COLUMN     "description" TEXT,
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 0;
