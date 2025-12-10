import { z } from 'zod'

import { injectable, inject } from 'inversify'
import { checkAbilityProcedure, Controller, router } from '@/kernel/lib/trpc/module'
import { StaffPermissionService } from '../users/_services/staff-permissions'
import { ROLE } from '@prisma/client'
import { SharedSession } from '@/kernel/domain/user'
import { dbClient } from '@/shared/lib/db'
import { createAdminAbility } from '../users/_domain/ability'
import { TRPCError } from '@trpc/server'

// Injections
import { GetKnowledgeListService } from '@/entities/knowledge/_services/get-knowledge-list'
import { CreateKnowledgeCategoryService } from '@/entities/knowledge/_services/create-knowledge-category'
import { UpdateKnowledgeCategoryService } from '@/entities/knowledge/_services/update-knowledge-category'
import { DeleteKnowledgeCategoryService } from '@/entities/knowledge/_services/delete-knowledge-category'
import { CreateKnowledgeArticleService } from '@/entities/knowledge/_services/create-knowledge-article'
import { UpdateKnowledgeArticleService } from '@/entities/knowledge/_services/update-knowledge-article'
import { DeleteKnowledgeArticleService } from '@/entities/knowledge/_services/delete-knowledge-article'
import { KnowledgeRepository } from '@/entities/knowledge/_repositories/knowledge'

@injectable()
export class AdminKnowledgeController extends Controller {
  constructor(
    @inject(StaffPermissionService)
    private readonly staffPermissionService: StaffPermissionService,
    @inject(GetKnowledgeListService)
    private readonly getKnowledgeListService: GetKnowledgeListService,
    @inject(CreateKnowledgeCategoryService)
    private readonly createCategoryService: CreateKnowledgeCategoryService,
    @inject(UpdateKnowledgeCategoryService)
    private readonly updateCategoryService: UpdateKnowledgeCategoryService,
    @inject(DeleteKnowledgeCategoryService)
    private readonly deleteCategoryService: DeleteKnowledgeCategoryService,
    @inject(CreateKnowledgeArticleService)
    private readonly createArticleService: CreateKnowledgeArticleService,
    @inject(UpdateKnowledgeArticleService)
    private readonly updateArticleService: UpdateKnowledgeArticleService,
    @inject(DeleteKnowledgeArticleService)
    private readonly deleteArticleService: DeleteKnowledgeArticleService,
    @inject(KnowledgeRepository)
    private readonly knowledgeRepository: KnowledgeRepository
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
    adminKnowledge: router({
      categories: router({
        list: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ courseId: z.string() }))
          .query(async ({ input }) => {
            return this.getKnowledgeListService.getCategories(input.courseId)
          }),

        create: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(
            z.object({
              title: z.string().min(1),
              description: z.string().optional(),
              slug: z.string().min(1),
              courseId: z.string(),
              order: z.number().optional(),
            })
          )
          .mutation(async ({ input }) => {
            return this.createCategoryService.exec(input)
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
              slug: z.string().min(1).optional(),
              order: z.number().optional(),
            })
          )
          .mutation(async ({ input }) => {
            const { id, ...data } = input
            return this.updateCategoryService.exec(id, data)
          }),

        delete: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ id: z.string() }))
          .mutation(async ({ input }) => {
            return this.deleteCategoryService.exec(input.id)
          }),
      }),

      articles: router({
        list: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ categoryId: z.string() }))
          .output(
            z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                description: z.string().nullable(),
                content: z.string().nullable(),
                videoId: z.string().nullable(),
                attachments: z.any(),
                order: z.number(),
                categoryId: z.string(),
                createdAt: z.date(),
                updatedAt: z.date(),
              })
            )
          )
          .query(async ({ input }) => {
            return this.getKnowledgeListService.getArticles(input.categoryId)
          }),

        get: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ id: z.string() }))
          .query(async ({ input }) => {
            return this.knowledgeRepository.getArticleById(input.id)
          }),

        create: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(
            z.object({
              title: z.string().min(1),
              description: z.string().optional(),
              content: z.string().optional(),
              videoId: z.string().optional(),
              attachments: z
                .array(
                  z.object({
                    name: z.string(),
                    url: z.string(),
                  })
                )
                .optional(),
              categoryId: z.string(),
              order: z.number().optional(),
            })
          )
          .output(
            z.object({
              id: z.string(),
              title: z.string(),
              description: z.string().nullable(),
              content: z.string().nullable(),
              videoId: z.string().nullable(),
              attachments: z.any(),
              order: z.number(),
              categoryId: z.string(),
              createdAt: z.date(),
              updatedAt: z.date(),
            })
          )
          .mutation(async ({ input }) => {
            return this.createArticleService.exec(input)
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
              content: z.string().optional(),
              videoId: z.string().optional(),
              attachments: z
                .array(
                  z.object({
                    name: z.string(),
                    url: z.string(),
                  })
                )
                .optional(),
              order: z.number().optional(),
            })
          )
          .output(
            z.object({
              id: z.string(),
              title: z.string(),
              description: z.string().nullable(),
              content: z.string().nullable(),
              videoId: z.string().nullable(),
              attachments: z.any(),
              order: z.number(),
              categoryId: z.string(),
              createdAt: z.date(),
              updatedAt: z.date(),
            })
          )
          .mutation(async ({ input }) => {
            const { id, ...data } = input
            return this.updateArticleService.exec(id, data)
          }),

        delete: checkAbilityProcedure({
          create: this.createAbility,
          check: ability => ability.canManageCourses,
        })
          .input(z.object({ id: z.string() }))
          .mutation(async ({ input }) => {
            return this.deleteArticleService.exec(input.id)
          }),
      }),
    }),
  })
}
