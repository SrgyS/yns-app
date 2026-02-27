import { z } from 'zod'
import { Buffer } from 'node:buffer'
import { injectable, inject } from 'inversify'
import { checkAbilityProcedure, Controller, router } from '@/kernel/lib/trpc/module'
import { StaffPermissionService } from '../users/_services/staff-permissions'
import {
  CookingDifficulty,
  MealCategory,
  RecipeDiet,
  RecipeIngredientTag,
  ROLE,
} from '@prisma/client'
import { SharedSession } from '@/kernel/domain/user'
import { dbClient } from '@/shared/lib/db'
import { createAdminAbility } from '../users/_domain/ability'
import { TRPCError } from '@trpc/server'
import { RecipeRepository } from '@/entities/recipes/_repositories/recipe'
import { CreateRecipeService } from '@/entities/recipes/_services/create-recipe'
import { UpdateRecipeService } from '@/entities/recipes/_services/update-recipe'
import { DeleteRecipeService } from '@/entities/recipes/_services/delete-recipe'
import {
  ALLOWED_IMAGE_TYPES,
  DEFAULT_IMAGE_MAX_SIZE_MB,
} from '@/shared/lib/upload-constants'
import { fileStorage } from '@/shared/lib/file-storage/file-storage'

const MAX_IMAGE_BYTES = DEFAULT_IMAGE_MAX_SIZE_MB * 1024 * 1024

const sanitizeFileName = (name: string) =>
  name.replaceAll(/[^\w.-]+/g, '_').slice(-200)

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().nullable().optional(),
  unit: z.string().optional(),
  weightGrams: z.number().nullable().optional(),
  description: z.string().optional(),
  order: z.number().int().nonnegative().optional(),
})

const stepSchema = z.object({
  stepNumber: z.number().int().positive(),
  instruction: z.string().min(1),
})

@injectable()
export class AdminRecipesController extends Controller {
  constructor(
    @inject(StaffPermissionService)
    private readonly staffPermissionService: StaffPermissionService,
    @inject(RecipeRepository)
    private readonly recipeRepository: RecipeRepository,
    @inject(CreateRecipeService)
    private readonly createRecipeService: CreateRecipeService,
    @inject(UpdateRecipeService)
    private readonly updateRecipeService: UpdateRecipeService,
    @inject(DeleteRecipeService)
    private readonly deleteRecipeService: DeleteRecipeService,
  ) {
    super()
  }

  private ensureAdmin(role: ROLE) {
    if (role === 'ADMIN' || role === 'STAFF') {
      return
    }

    throw new TRPCError({ code: 'FORBIDDEN' })
  }

  private readonly createAbility = async (session: SharedSession) => {
    const userRecord = await dbClient.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!userRecord) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Пользователь не найден',
      })
    }

    const role = userRecord.role
    this.ensureAdmin(role)

    const permissions = await this.staffPermissionService.getPermissionsForUser(
      {
        id: session.user.id,
        role,
      }
    )

    return createAdminAbility(session, permissions)
  }

  public router = router({
    adminRecipes: router({
      list: checkAbilityProcedure({
        create: this.createAbility,
        check: ability => ability.canManageCourses,
      }).query(async () => {
        return this.recipeRepository.getAllRecipes()
      }),

      getById: checkAbilityProcedure({
        create: this.createAbility,
        check: ability => ability.canManageCourses,
      })
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
          return this.recipeRepository.getRecipeById(input.id)
        }),

      create: checkAbilityProcedure({
      create: this.createAbility,
      check: ability => ability.canManageCourses,
    })
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          shortDescription: z.string().optional(),
          preparationTimeMinutes: z.number().int().positive(),
          calories: z.number().int().positive().optional(),
          servings: z.number().int().positive(),
          cookingDifficulty: z.nativeEnum(CookingDifficulty),
            imageUrl: z.string().optional(),
          diets: z.array(z.nativeEnum(RecipeDiet)).optional(),
          ingredientTags: z
            .array(z.nativeEnum(RecipeIngredientTag))
            .optional(),
          isGlutenFree: z.boolean().optional(),
          isSugarFree: z.boolean().optional(),
          mealCategories: z
            .array(z.nativeEnum(MealCategory))
            .optional(),
          slug: z.string().min(1),
          ingredients: z.array(ingredientSchema).optional(),
          steps: z.array(stepSchema).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { ingredients, steps, ...recipeData } = input
        const recipe = await this.createRecipeService.exec(recipeData)

        if (ingredients) {
          await this.recipeRepository.replaceIngredients(recipe.id, ingredients)
        }
        if (steps) {
          await this.recipeRepository.replaceSteps(recipe.id, steps)
        }

        return this.recipeRepository.getRecipeById(recipe.id)
      }),

      update: checkAbilityProcedure({
        create: this.createAbility,
        check: ability => ability.canManageCourses,
      })
        .input(
          z.object({
            id: z.string(),
          title: z.string().min(1).optional(),
          description: z.string().optional(),
          shortDescription: z.string().optional(),
          preparationTimeMinutes: z.number().int().positive().optional(),
          calories: z.number().int().positive().nullable().optional(),
          servings: z.number().int().positive().optional(),
          cookingDifficulty: z.nativeEnum(CookingDifficulty).optional(),
            imageUrl: z.string().nullable().optional(),
          diets: z.array(z.nativeEnum(RecipeDiet)).optional(),
          ingredientTags: z
            .array(z.nativeEnum(RecipeIngredientTag))
            .optional(),
          isGlutenFree: z.boolean().optional(),
            isSugarFree: z.boolean().optional(),
            mealCategories: z
              .array(z.nativeEnum(MealCategory))
              .optional(),
            slug: z.string().min(1).optional(),
            ingredients: z.array(ingredientSchema).optional(),
            steps: z.array(stepSchema).optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ingredients, steps, ...data } = input
          const updated = await this.updateRecipeService.exec(id, data)

          if (ingredients) {
            await this.recipeRepository.replaceIngredients(id, ingredients)
          }
          if (steps) {
            await this.recipeRepository.replaceSteps(id, steps)
          }

          return this.recipeRepository.getRecipeById(updated.id)
        }),

      delete: checkAbilityProcedure({
        create: this.createAbility,
        check: ability => ability.canManageCourses,
      })
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
          return this.deleteRecipeService.exec(input.id)
        }),

      uploadPhoto: checkAbilityProcedure({
        create: this.createAbility,
        check: ability => ability.canManageCourses,
      })
        .input(
          z.object({
            fileName: z.string().min(1),
            fileType: z.string().min(1),
            base64: z.string().min(1),
            tag: z.string().optional(),
          })
        )
        .mutation(async ({ ctx, input }) => {
          const contentType = input.fileType.toLowerCase()
          if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Недопустимый формат изображения',
            })
          }

          const sizeBytes = Buffer.byteLength(input.base64, 'base64')
          if (sizeBytes > MAX_IMAGE_BYTES) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `Размер файла превышает ${DEFAULT_IMAGE_MAX_SIZE_MB} МБ`,
            })
          }

          const sanitizedName = sanitizeFileName(input.fileName)
          const buffer = Buffer.from(input.base64, 'base64')
          const file = new File([buffer], sanitizedName, { type: contentType })
          const userId = ctx.session.user.id
          const stored = await fileStorage.uploadImage(
            file,
            input.tag ?? 'site/recipe-image',
            userId
          )

          return {
            path: stored.path,
            name: stored.name,
          }
        }),
    }),
  })
}
