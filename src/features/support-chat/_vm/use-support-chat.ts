'use client'

import { useEffect, useMemo, useRef } from 'react'
import { ChatMessageSenderType } from '@prisma/client'

import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'
import { supportChatApi } from '../_api'

type SupportChatAttachmentInput = {
  filename: string
  mimeType: string
  sizeBytes: number
  base64: string
}

export type SupportChatMessageStatus = 'sending' | 'sent' | 'failed'

type SupportChatMessageCreatedSsePayload = {
  type: 'message.created'
  dialogId: string
  message?: {
    id: string
    clientMessageId: string | null
    text: string | null
    senderType: 'USER' | 'STAFF'
    createdAt: string
  }
}

const SUPPORT_CHAT_LIMIT = 20
type SupportChatDialogScope = 'user' | 'staff'

const createClientMessageId = () => {
  const randomValue =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replaceAll('-', '')
      : `${Date.now()}${Math.floor(Math.random() * 10_000_000)}`

  return `tmp_${randomValue.slice(0, 24)}`
}

type SupportChatMessagesCache = {
  pages: Array<{
    items: Array<{
      id: string
      dialogId: string
      senderType: ChatMessageSenderType
      text: string | null
      attachments?: unknown
      editedAt: string | null
      deletedAt: string | null
      deletedBy: string | null
      canEdit: boolean
      canDelete: boolean
      createdAt: string
      readAt: string | null
      clientMessageId: string | null
      status?: SupportChatMessageStatus
      pendingAttachments?: SupportChatAttachmentInput[]
    }>
    nextCursor?: string
  }>
  pageParams: Array<string | null>
}

const updateCachedDialogMessages = (
  current: SupportChatMessagesCache | undefined,
  update: (items: SupportChatMessagesCache['pages'][number]['items']) => {
    items: SupportChatMessagesCache['pages'][number]['items']
    changed: boolean
  }
): SupportChatMessagesCache | undefined => {
  if (!current) {
    return current
  }

  let hasChanges = false
  const nextPages = current.pages.map(page => {
    const result = update(page.items)
    if (!result.changed) {
      return page
    }

    hasChanges = true
    return {
      ...page,
      items: result.items,
    }
  })

  if (!hasChanges) {
    return current
  }

  return {
    ...current,
    pages: nextPages,
  }
}

export function useUserDialogs() {
  const query = supportChatApi.supportChat.userListDialogs.useInfiniteQuery(
    {
      limit: SUPPORT_CHAT_LIMIT,
    },
    {
      ...CACHE_SETTINGS.FREQUENT_UPDATE,
      initialCursor: undefined,
      getNextPageParam: lastPage => lastPage.nextCursor,
    }
  )

  const dialogs = useMemo(() => {
    const pages = query.data?.pages ?? []
    return pages.flatMap(page => page.items)
  }, [query.data])

  return {
    ...query,
    dialogs,
  }
}

export function useDialogMessages(dialogId?: string) {
  const isEnabled = Boolean(dialogId)

  const query = supportChatApi.supportChat.userGetMessages.useInfiniteQuery(
    {
      dialogId: dialogId ?? '',
      limit: SUPPORT_CHAT_LIMIT,
    },
    {
      ...CACHE_SETTINGS.FREQUENT_UPDATE,
      enabled: isEnabled,
      initialCursor: undefined,
      getNextPageParam: lastPage => lastPage.nextCursor,
    }
  )

  const messages = useMemo(() => {
    const pages = query.data?.pages ?? []
    const merged = pages.flatMap(page =>
      page.items.map(item => {
        const itemStatus = (item as { status?: SupportChatMessageStatus }).status
        const status = itemStatus ?? 'sent'
        const itemClientMessageId = (
          item as { clientMessageId?: string | null }
        ).clientMessageId
        return {
          ...item,
          clientMessageId: itemClientMessageId ?? null,
          status,
        }
      })
    )
    return [...merged].sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    )
  }, [query.data])

  return {
    ...query,
    messages,
  }
}

function useSupportChatEventsSse(
  dialogId: string | undefined,
  dialogScope: SupportChatDialogScope
) {
  const utils = supportChatApi.useUtils()

  useEffect(() => {
    const eventSource = new EventSource('/api/support-chat/events')

    const invalidateDialogs = () => {
      if (dialogScope === 'user') {
        utils.supportChat.userListDialogs.invalidate().catch(() => undefined)
      }

      if (dialogScope === 'staff') {
        utils.supportChat.staffListDialogs.invalidate().catch(() => undefined)
      }

      utils.supportChat.getUnansweredDialogsCount.invalidate().catch(() => undefined)
    }

    const invalidateMessages = () => {
      if (!dialogId) {
        return
      }

      utils.supportChat.userGetMessages
        .invalidate({ dialogId })
        .catch(() => undefined)
    }

    const applyMessageCreatedReconcile = (
      payload: SupportChatMessageCreatedSsePayload
    ) => {
      if (!dialogId) {
        return
      }

      if (payload.dialogId !== dialogId) {
        return
      }

      const messagePayload = payload.message
      if (!messagePayload?.clientMessageId) {
        return
      }

      utils.supportChat.userGetMessages.setInfiniteData(
        {
          dialogId,
          limit: SUPPORT_CHAT_LIMIT,
        },
        current => {
          if (!current) {
            return current
          }

          let hasChanges = false
          const nextPages = current.pages.map(page => {
            const nextItems = page.items.map(item => {
              if (item.clientMessageId !== messagePayload.clientMessageId) {
                return item
              }

              hasChanges = true
              return {
                ...item,
                id: messagePayload.id,
                text: messagePayload.text,
                senderType: messagePayload.senderType,
                createdAt: messagePayload.createdAt,
                clientMessageId: messagePayload.clientMessageId,
                status: 'sent',
                pendingAttachments: undefined,
              }
            })

            return {
              ...page,
              items: nextItems,
            }
          })

          if (hasChanges) {
            return {
              ...current,
              pages: nextPages,
            }
          }

          return current
        }
      )
    }

    const handleDialogCreated = () => {
      invalidateDialogs()
    }

    const handleMessageCreated = (event: Event) => {
      const messageEvent = event as MessageEvent<string>
      try {
        const payload = JSON.parse(
          messageEvent.data
        ) as SupportChatMessageCreatedSsePayload
        if (payload.type === 'message.created') {
          applyMessageCreatedReconcile(payload)
        }
      } catch {
        // ignore malformed payload and keep fallback invalidation flow
      }

      invalidateDialogs()
      invalidateMessages()
    }

    const handleReadUpdated = () => {
      invalidateDialogs()
      invalidateMessages()
    }
    const handleMessageUpdated = () => {
      invalidateDialogs()
      invalidateMessages()
    }

    eventSource.addEventListener('dialog.created', handleDialogCreated)
    eventSource.addEventListener('message.created', handleMessageCreated)
    eventSource.addEventListener('message.updated', handleMessageUpdated)
    eventSource.addEventListener('read.updated', handleReadUpdated)

    return () => {
      eventSource.removeEventListener('dialog.created', handleDialogCreated)
      eventSource.removeEventListener('message.created', handleMessageCreated)
      eventSource.removeEventListener('message.updated', handleMessageUpdated)
      eventSource.removeEventListener('read.updated', handleReadUpdated)
      eventSource.close()
    }
  }, [dialogId, dialogScope, utils])
}

export function useSupportChatSse(dialogId?: string) {
  useSupportChatEventsSse(dialogId, 'user')
}

export function useStaffDialogs(hasUnansweredIncoming?: boolean) {
  const query = supportChatApi.supportChat.staffListDialogs.useInfiniteQuery(
    {
      limit: SUPPORT_CHAT_LIMIT,
      hasUnansweredIncoming,
    },
    {
      ...CACHE_SETTINGS.FREQUENT_UPDATE,
      initialCursor: undefined,
      getNextPageParam: lastPage => lastPage.nextCursor,
    }
  )

  const dialogs = useMemo(() => {
    const pages = query.data?.pages ?? []
    return pages.flatMap(page => page.items)
  }, [query.data])

  return {
    ...query,
    dialogs,
  }
}

export function useStaffDialogMessages(dialogId?: string) {
  return useDialogMessages(dialogId)
}

export function useSupportChatStaffSse(dialogId?: string) {
  useSupportChatEventsSse(dialogId, 'staff')
}

export function useSupportChatUnansweredCount() {
  return supportChatApi.supportChat.getUnansweredDialogsCount.useQuery(undefined, {
    ...CACHE_SETTINGS.FREQUENT_UPDATE,
  })
}

export function useSupportChatActions() {
  const utils = supportChatApi.useUtils()
  const optimisticSenderTypeByClientMessageIdRef = useRef(
    new Map<string, ChatMessageSenderType>()
  )

  const staffOpenDialogForUserMutation =
    supportChatApi.supportChat.staffOpenDialogForUser.useMutation({
      onSuccess: () => {
        utils.supportChat.staffListDialogs.invalidate().catch(() => undefined)
        utils.supportChat.getUnansweredDialogsCount.invalidate().catch(
          () => undefined
        )
      },
    })

  const createDialogMutation = supportChatApi.supportChat.createDialog.useMutation({
    onSuccess: () => {
      utils.supportChat.userListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.getUnansweredDialogsCount.invalidate().catch(() => undefined)
    },
  })

  const sendMessageMutation = supportChatApi.supportChat.sendMessage.useMutation({
    onMutate: async variables => {
      const optimisticClientMessageId = variables.clientMessageId
      if (!optimisticClientMessageId) {
        return {
          clientMessageId: undefined,
        }
      }

      await utils.supportChat.userGetMessages.cancel({
        dialogId: variables.dialogId,
      })

      utils.supportChat.userGetMessages.setInfiniteData(
        {
          dialogId: variables.dialogId,
          limit: SUPPORT_CHAT_LIMIT,
        },
        (current: SupportChatMessagesCache | undefined) => {
          const optimisticMessage = {
            id: optimisticClientMessageId,
            dialogId: variables.dialogId,
            senderType:
              optimisticSenderTypeByClientMessageIdRef.current.get(
                optimisticClientMessageId
              ) ?? 'USER',
            text: variables.text ?? null,
            attachments:
              variables.attachments?.map((attachment, index) => ({
                id: `${optimisticClientMessageId}_${index}`,
                name: attachment.filename,
                path: attachment.base64,
                type: attachment.mimeType,
                sizeBytes: attachment.sizeBytes,
              })) ?? [],
            editedAt: null,
            deletedAt: null,
            deletedBy: null,
            canEdit: false,
            canDelete: false,
            createdAt: new Date().toISOString(),
            readAt: null,
            clientMessageId: optimisticClientMessageId,
            status: 'sending' as const,
            pendingAttachments: variables.attachments,
          }

          if (!current) {
            return {
              pages: [
                {
                  items: [optimisticMessage],
                  nextCursor: undefined,
                },
              ],
              pageParams: [null],
            }
          }

          const firstPage = current.pages[0]
          if (!firstPage) {
            return {
              ...current,
              pages: [
                {
                  items: [optimisticMessage],
                  nextCursor: undefined,
                },
              ],
            }
          }

          const firstPageHasMessage = firstPage.items.some(
            item => item.clientMessageId === optimisticClientMessageId
          )
          if (firstPageHasMessage) {
            return current
          }

          const nextFirstPage = {
            ...firstPage,
            items: [...firstPage.items, optimisticMessage],
          }

          return {
            ...current,
            pages: [nextFirstPage, ...current.pages.slice(1)],
          }
        }
      )

      return {
        clientMessageId: optimisticClientMessageId,
      }
    },
    onSuccess: (result, variables, context) => {
      const resolvedClientMessageId = context?.clientMessageId
      if (resolvedClientMessageId) {
        optimisticSenderTypeByClientMessageIdRef.current.delete(
          resolvedClientMessageId
        )
        utils.supportChat.userGetMessages.setInfiniteData(
          {
            dialogId: variables.dialogId,
            limit: SUPPORT_CHAT_LIMIT,
          },
          (current: SupportChatMessagesCache | undefined) => {
            return updateCachedDialogMessages(current, items => {
              let changed = false
              const nextItems = items.map(item => {
                if (item.clientMessageId !== resolvedClientMessageId) {
                  return item
                }

                changed = true
                return {
                  ...item,
                  id: result.message.id,
                  text: result.message.text,
                  attachments: result.message.attachments,
                  senderType: result.message.senderType,
                  createdAt: result.message.createdAt,
                  clientMessageId: result.message.clientMessageId,
                  status: 'sent' as const,
                  pendingAttachments: undefined,
                }
              })

              return {
                items: nextItems,
                changed,
              }
            })
          }
        )
      }

      utils.supportChat.userListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.staffListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.getUnansweredDialogsCount.invalidate().catch(() => undefined)
      utils.supportChat.userGetMessages
        .invalidate({ dialogId: variables.dialogId })
        .catch(() => undefined)
    },
    onError: (_error, variables, context) => {
      const resolvedClientMessageId = context?.clientMessageId
      if (!resolvedClientMessageId) {
        return
      }

      optimisticSenderTypeByClientMessageIdRef.current.delete(
        resolvedClientMessageId
      )

      utils.supportChat.userGetMessages.setInfiniteData(
        {
          dialogId: variables.dialogId,
          limit: SUPPORT_CHAT_LIMIT,
        },
        (current: SupportChatMessagesCache | undefined) => {
          return updateCachedDialogMessages(current, items => {
            let changed = false
            const nextItems = items.map(item => {
              if (item.clientMessageId !== resolvedClientMessageId) {
                return item
              }

              changed = true
              return {
                ...item,
                status: 'failed' as const,
              }
            })

            return {
              items: nextItems,
              changed,
            }
          })
        }
      )
    },
  })

  const markReadMutation = supportChatApi.supportChat.markDialogRead.useMutation({
    onSuccess: (_result, variables) => {
      utils.supportChat.userListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.staffListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.getUnansweredDialogsCount.invalidate().catch(() => undefined)
      utils.supportChat.userGetMessages
        .invalidate({ dialogId: variables.dialogId })
        .catch(() => undefined)
    },
  })

  const editMessageMutation = supportChatApi.supportChat.editMessage.useMutation({
    onSuccess: (_result, variables) => {
      utils.supportChat.userListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.staffListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.getUnansweredDialogsCount.invalidate().catch(() => undefined)
      utils.supportChat.userGetMessages
        .invalidate({ dialogId: variables.dialogId })
        .catch(() => undefined)
    },
  })

  const deleteMessageMutation = supportChatApi.supportChat.deleteMessage.useMutation({
    onSuccess: (_result, variables) => {
      utils.supportChat.userListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.staffListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.getUnansweredDialogsCount.invalidate().catch(() => undefined)
      utils.supportChat.userGetMessages
        .invalidate({ dialogId: variables.dialogId })
        .catch(() => undefined)
    },
  })

  const createDialog = async (params: {
    initialMessage: string
    topic?: string
    attachments?: SupportChatAttachmentInput[]
  }) => {
    return await createDialogMutation.mutateAsync(params)
  }

  const openStaffDialogForUser = async (params: { userId: string }) => {
    return await staffOpenDialogForUserMutation.mutateAsync(params)
  }

  const sendMessage = async (params: {
    dialogId: string
    text?: string
    attachments?: SupportChatAttachmentInput[]
    clientMessageId?: string
    optimisticSenderType?: ChatMessageSenderType
  }) => {
    const resolvedClientMessageId = params.clientMessageId ?? createClientMessageId()
    optimisticSenderTypeByClientMessageIdRef.current.set(
      resolvedClientMessageId,
      params.optimisticSenderType ?? 'USER'
    )
    return await sendMessageMutation.mutateAsync({
      dialogId: params.dialogId,
      text: params.text,
      attachments: params.attachments,
      clientMessageId: resolvedClientMessageId,
    })
  }

  const cancelFailedMessage = (params: {
    dialogId: string
    clientMessageId: string
  }) => {
    utils.supportChat.userGetMessages.setInfiniteData(
      {
        dialogId: params.dialogId,
        limit: SUPPORT_CHAT_LIMIT,
      },
      (current: SupportChatMessagesCache | undefined) => {
        return updateCachedDialogMessages(current, items => {
          const nextItems = items.filter(
            item => item.clientMessageId !== params.clientMessageId
          )
          return {
            items: nextItems,
            changed: nextItems.length !== items.length,
          }
        })
      }
    )
  }

  const markDialogRead = async (params: {
    dialogId: string
    lastReadMessageId: string
  }) => {
    return await markReadMutation.mutateAsync(params)
  }

  const editMessage = async (params: {
    dialogId: string
    messageId: string
    text: string
  }) => {
    return await editMessageMutation.mutateAsync(params)
  }

  const deleteMessage = async (params: {
    dialogId: string
    messageId: string
  }) => {
    return await deleteMessageMutation.mutateAsync(params)
  }

  return {
    openStaffDialogForUser,
    createDialog,
    sendMessage,
    markDialogRead,
    editMessage,
    deleteMessage,
    cancelFailedMessage,
    isOpeningStaffDialog: staffOpenDialogForUserMutation.isPending,
    isCreatingDialog: createDialogMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    isMarkingRead: markReadMutation.isPending,
    isEditingMessage: editMessageMutation.isPending,
    isDeletingMessage: deleteMessageMutation.isPending,
  }
}

export const isIncomingChatMessageForUser = (
  senderType: ChatMessageSenderType
) => senderType === 'STAFF'
