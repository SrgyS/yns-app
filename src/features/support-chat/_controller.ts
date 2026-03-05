import { TRPCError } from '@trpc/server'
import { injectable } from 'inversify'

import { Controller, authorizedProcedure, router } from '@/kernel/lib/trpc/module'
import {
  createDialogInputSchema,
  deleteMessageInputSchema,
  editMessageInputSchema,
  markDialogReadInputSchema,
  sendMessageInputSchema,
  staffOpenDialogForUserInputSchema,
  staffListDialogsInputSchema,
  userGetMessagesInputSchema,
  userListDialogsInputSchema,
} from './_domain/schemas'
import {
  isSupportChatDomainError,
} from './_domain/errors'
import { mapSupportChatDomainErrorToTrpc } from './_domain/error-mapping'
import { SupportChatService } from './_services/support-chat-service'
import { publicConfig } from '@/shared/config/public'
import { isTrustedRequestOrigin } from '@/shared/lib/security/trusted-origin'

@injectable()
export class SupportChatController extends Controller {
  constructor(private readonly supportChatService: SupportChatService) {
    super()
  }

  public router = router({
    supportChat: router({
      userListDialogs: authorizedProcedure
        .input(userListDialogsInputSchema)
        .query(async ({ ctx, input }) =>
          this.runWithErrorMapping(() =>
            this.supportChatService.userListDialogs({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              cursor: input.cursor,
              limit: input.limit,
            })
          )
        ),
      userGetMessages: authorizedProcedure
        .input(userGetMessagesInputSchema)
        .query(async ({ ctx, input }) =>
          this.runWithErrorMapping(() =>
            this.supportChatService.userGetMessages({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              dialogId: input.dialogId,
              cursor: input.cursor,
              limit: input.limit,
            })
          )
        ),
      staffListDialogs: authorizedProcedure
        .input(staffListDialogsInputSchema)
        .query(async ({ ctx, input }) =>
          this.runWithErrorMapping(() =>
            this.supportChatService.staffListDialogs({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              hasUnansweredIncoming: input.hasUnansweredIncoming,
              cursor: input.cursor,
              limit: input.limit,
            })
          )
        ),
      staffOpenDialogForUser: authorizedProcedure
        .input(staffOpenDialogForUserInputSchema)
        .mutation(async ({ ctx, input }) => {
          this.assertTrustedMutationRequest(ctx)
          return this.runWithErrorMapping(() =>
            this.supportChatService.staffOpenDialogForUser({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              userId: input.userId,
            })
          )
        }),
      sendMessage: authorizedProcedure
        .input(sendMessageInputSchema)
        .mutation(async ({ ctx, input }) => {
          this.assertTrustedMutationRequest(ctx)
          return this.runWithErrorMapping(() =>
            this.supportChatService.sendMessage({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              dialogId: input.dialogId,
              clientMessageId: input.clientMessageId,
              text: input.text,
              attachments: input.attachments,
            })
          )
        }),
      markDialogRead: authorizedProcedure
        .input(markDialogReadInputSchema)
        .mutation(async ({ ctx, input }) => {
          this.assertTrustedMutationRequest(ctx)
          return this.runWithErrorMapping(() =>
            this.supportChatService.markDialogRead({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              dialogId: input.dialogId,
              lastReadMessageId: input.lastReadMessageId,
            })
          )
        }),
      getUnansweredDialogsCount: authorizedProcedure.query(async ({ ctx }) =>
        this.runWithErrorMapping(() =>
          this.supportChatService.getUnansweredDialogsCount({
            actor: {
              id: ctx.session.user.id,
              role: ctx.session.user.role,
            },
          })
        )
      ),
      editMessage: authorizedProcedure
        .input(editMessageInputSchema)
        .mutation(async ({ ctx, input }) => {
          this.assertTrustedMutationRequest(ctx)
          return this.runWithErrorMapping(() =>
            this.supportChatService.editMessage({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              dialogId: input.dialogId,
              messageId: input.messageId,
              text: input.text,
            })
          )
        }),
      deleteMessage: authorizedProcedure
        .input(deleteMessageInputSchema)
        .mutation(async ({ ctx, input }) => {
          this.assertTrustedMutationRequest(ctx)
          return this.runWithErrorMapping(() =>
            this.supportChatService.deleteMessage({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              dialogId: input.dialogId,
              messageId: input.messageId,
            })
          )
        }),
      createDialog: authorizedProcedure
        .input(createDialogInputSchema)
        .mutation(async ({ ctx, input }) => {
          this.assertTrustedMutationRequest(ctx)
          return this.runWithErrorMapping(() =>
            this.supportChatService.createDialog({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              topic: input.topic,
              initialMessage: input.initialMessage,
              attachments: input.attachments,
            })
          )
        }),
    }),
  })

  private async runWithErrorMapping<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run()
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }

      if (isSupportChatDomainError(error)) {
        throw mapSupportChatDomainErrorToTrpc(error)
      }

      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' })
    }
  }

  private assertTrustedMutationRequest(ctx: {
    requestMeta?: {
      requestUrl?: string | null
      origin?: string | null
      referer?: string | null
      host?: string | null
      forwardedHost?: string | null
      forwardedProto?: string | null
    }
  }) {
    const requestMeta = ctx.requestMeta
    const isTrusted = isTrustedRequestOrigin({
      requestUrl: requestMeta?.requestUrl ?? undefined,
      originHeader: requestMeta?.origin,
      refererHeader: requestMeta?.referer,
      hostHeader: requestMeta?.host,
      forwardedHostHeader: requestMeta?.forwardedHost,
      forwardedProtoHeader: requestMeta?.forwardedProto,
      publicAppUrl: publicConfig.PUBLIC_URL,
    })

    if (isTrusted) {
      return
    }

    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Invalid request origin',
    })
  }
}
