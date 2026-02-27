import { TRPCError } from '@trpc/server'
import { injectable } from 'inversify'

import { Controller, authorizedProcedure, router } from '@/kernel/lib/trpc/module'
import {
  createDialogInputSchema,
  deleteMessageInputSchema,
  editMessageInputSchema,
  markDialogReadInputSchema,
  sendMessageInputSchema,
  staffListDialogsInputSchema,
  userGetMessagesInputSchema,
  userListDialogsInputSchema,
} from './_domain/schemas'
import {
  isSupportChatDomainError,
} from './_domain/errors'
import { mapSupportChatDomainErrorToTrpc } from './_domain/error-mapping'
import { SupportChatService } from './_services/support-chat-service'

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
      sendMessage: authorizedProcedure
        .input(sendMessageInputSchema)
        .mutation(async ({ ctx, input }) =>
          this.runWithErrorMapping(() =>
            this.supportChatService.sendMessage({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              dialogId: input.dialogId,
              text: input.text,
              attachments: input.attachments,
            })
          )
        ),
      markDialogRead: authorizedProcedure
        .input(markDialogReadInputSchema)
        .mutation(async ({ ctx, input }) =>
          this.runWithErrorMapping(() =>
            this.supportChatService.markDialogRead({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              dialogId: input.dialogId,
              lastReadMessageId: input.lastReadMessageId,
            })
          )
        ),
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
        .mutation(async ({ ctx, input }) =>
          this.runWithErrorMapping(() =>
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
        ),
      deleteMessage: authorizedProcedure
        .input(deleteMessageInputSchema)
        .mutation(async ({ ctx, input }) =>
          this.runWithErrorMapping(() =>
            this.supportChatService.deleteMessage({
              actor: {
                id: ctx.session.user.id,
                role: ctx.session.user.role,
              },
              dialogId: input.dialogId,
              messageId: input.messageId,
            })
          )
        ),
      createDialog: authorizedProcedure
        .input(createDialogInputSchema)
        .mutation(async ({ ctx, input }) =>
          this.runWithErrorMapping(() =>
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
        ),
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
}
