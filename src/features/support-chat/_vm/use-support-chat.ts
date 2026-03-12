'use client'

import { useEffect, useMemo, useRef } from 'react'
import { ChatMessageSenderType } from '@/shared/lib/client-enums'

import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'
import { supportChatApi } from '../_api'

type SupportChatAttachmentInput = {
  attachmentId: string
  name: string
  mimeType: string
  sizeBytes: number
}

export type SupportChatPendingAttachmentInput = SupportChatAttachmentInput & {
  previewUrl?: string
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

const ignoreAsyncError = (promise: Promise<unknown>) => {
  promise.catch(() => undefined)
}

const getMessagesCacheInput = (dialogId: string) => ({
  dialogId,
  limit: SUPPORT_CHAT_LIMIT,
})

export const createClientMessageId = () => {
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
      pendingAttachments?: SupportChatPendingAttachmentInput[]
    }>
    nextCursor?: string
  }>
  pageParams: Array<string | null>
}

type SupportChatMessageItem = SupportChatMessagesCache['pages'][number]['items'][number]

const revokeAttachmentPreviewUrls = (
  attachments: SupportChatPendingAttachmentInput[] | undefined
) => {
  if (!attachments) {
    return
  }

  attachments.forEach(attachment => {
    if (attachment.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl)
    }
  })
}

const resolveAttachmentPreviewUrl = (
  attachment: SupportChatAttachmentInput | SupportChatPendingAttachmentInput
) => {
  if ('previewUrl' in attachment) {
    return attachment.previewUrl
  }

  return undefined
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

const reconcileCreatedMessageInCache = (
  current: SupportChatMessagesCache | undefined,
  messagePayload: NonNullable<SupportChatMessageCreatedSsePayload['message']>
) => {
  if (!current) {
    return current
  }

  let hasChanges = false
  const nextPages = current.pages.map(page => {
    let pageChanged = false
    const nextItems: typeof page.items = []

    for (const item of page.items) {
      if (item.clientMessageId !== messagePayload.clientMessageId) {
        nextItems.push(item)
        continue
      }

      pageChanged = true
      hasChanges = true
      nextItems.push({
        ...item,
        id: messagePayload.id,
        text: messagePayload.text,
        senderType: messagePayload.senderType,
        createdAt: messagePayload.createdAt,
        clientMessageId: messagePayload.clientMessageId,
        status: 'sent',
        pendingAttachments: undefined,
      })
    }

    if (!pageChanged) {
      return page
    }

    return {
      ...page,
      items: nextItems,
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

const markMessageSent = (params: {
  items: SupportChatMessageItem[]
  clientMessageId: string
  message: {
    id: string
    text: string | null
    attachments?: unknown
    senderType: ChatMessageSenderType
    createdAt: string
    clientMessageId: string | null
  }
}) => {
  let changed = false
  const nextItems: SupportChatMessageItem[] = []

  for (const item of params.items) {
    if (item.clientMessageId !== params.clientMessageId) {
      nextItems.push(item)
      continue
    }

    changed = true
    nextItems.push({
      ...item,
      id: params.message.id,
      text: params.message.text,
      attachments: params.message.attachments ?? item.attachments,
      senderType: params.message.senderType,
      createdAt: params.message.createdAt,
      clientMessageId: params.message.clientMessageId,
      status: 'sent',
      canEdit: true,
      canDelete: true,
      pendingAttachments: undefined,
    })
  }

  return {
    items: nextItems,
    changed,
  }
}

const markMessageFailed = (
  items: SupportChatMessageItem[],
  clientMessageId: string
) => {
  let changed = false
  const nextItems: SupportChatMessageItem[] = []

  for (const item of items) {
    if (item.clientMessageId !== clientMessageId) {
      nextItems.push(item)
      continue
    }

    changed = true
    nextItems.push({
      ...item,
      status: 'failed',
    })
  }

  return {
    items: nextItems,
    changed,
  }
}

const markMessageEdited = (
  items: SupportChatMessageItem[],
  messageId: string,
  text: string,
  editedAt: string
) => {
  let changed = false
  const nextItems: SupportChatMessageItem[] = []

  for (const item of items) {
    if (item.id !== messageId) {
      nextItems.push(item)
      continue
    }

    changed = true
    nextItems.push({
      ...item,
      text,
      editedAt,
    })
  }

  return {
    items: nextItems,
    changed,
  }
}

const removeMessageByClientMessageId = (
  items: SupportChatMessageItem[],
  clientMessageId: string
) => {
  const nextItems = items.filter(item => item.clientMessageId !== clientMessageId)
  return {
    items: nextItems,
    changed: nextItems.length !== items.length,
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
        ignoreAsyncError(utils.supportChat.userListDialogs.invalidate())
      }

      if (dialogScope === 'staff') {
        ignoreAsyncError(utils.supportChat.staffListDialogs.invalidate())
      }

      ignoreAsyncError(utils.supportChat.getUnansweredDialogsCount.invalidate())
    }

    const invalidateMessages = () => {
      if (!dialogId) {
        return
      }

      ignoreAsyncError(utils.supportChat.userGetMessages.invalidate({ dialogId }))
    }

    const applyMessageCreatedReconcile = (
      payload: SupportChatMessageCreatedSsePayload
    ): boolean => {
      if (!dialogId) {
        return false
      }

      if (payload.dialogId !== dialogId) {
        return false
      }

      const messagePayload = payload.message
      if (!messagePayload?.clientMessageId) {
        return false
      }

      let wasReconciled = false
      utils.supportChat.userGetMessages.setInfiniteData(
        getMessagesCacheInput(dialogId),
        current => {
          const next = reconcileCreatedMessageInCache(current, messagePayload)
          wasReconciled = next !== current
          return next
        }
      )

      return wasReconciled
    }

    const handleDialogCreated = () => {
      invalidateDialogs()
    }

    const handleMessageCreated = (event: Event) => {
      const messageEvent = event as MessageEvent<string>
      let shouldInvalidateMessages = true
      try {
        const payload = JSON.parse(
          messageEvent.data
        ) as SupportChatMessageCreatedSsePayload
        if (payload.type === 'message.created') {
          const reconciled = applyMessageCreatedReconcile(payload)
          if (reconciled) {
            shouldInvalidateMessages = false
          }
        }
      } catch {
        // ignore malformed payload and keep fallback invalidation flow
      }

      invalidateDialogs()
      if (shouldInvalidateMessages) {
        invalidateMessages()
      }
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
  const pendingAttachmentsByClientMessageIdRef = useRef(
    new Map<string, SupportChatPendingAttachmentInput[]>()
  )

  useEffect(() => {
    const pendingAttachmentsByClientMessageId =
      pendingAttachmentsByClientMessageIdRef.current

    return () => {
      pendingAttachmentsByClientMessageId.forEach(attachments => {
        revokeAttachmentPreviewUrls(attachments)
      })
      pendingAttachmentsByClientMessageId.clear()
    }
  }, [])

  const invalidateDialogLists = () => {
    ignoreAsyncError(utils.supportChat.userListDialogs.invalidate())
    ignoreAsyncError(utils.supportChat.staffListDialogs.invalidate())
    ignoreAsyncError(utils.supportChat.getUnansweredDialogsCount.invalidate())
  }

  const invalidateMessages = (dialogId: string) => {
    ignoreAsyncError(utils.supportChat.userGetMessages.invalidate({ dialogId }))
  }

  const cleanupPendingAttachments = (clientMessageId: string) => {
    const pendingAttachments =
      pendingAttachmentsByClientMessageIdRef.current.get(clientMessageId)
    revokeAttachmentPreviewUrls(pendingAttachments)
    pendingAttachmentsByClientMessageIdRef.current.delete(clientMessageId)
  }

  const setMessagesInfiniteData = (
    dialogId: string,
    updater:
      | SupportChatMessagesCache
      | undefined
      | ((
          current: SupportChatMessagesCache | undefined
        ) => SupportChatMessagesCache | undefined)
  ) => {
    utils.supportChat.userGetMessages.setInfiniteData(
      getMessagesCacheInput(dialogId),
      updater
    )
  }

  const staffOpenDialogForUserMutation =
    supportChatApi.supportChat.staffOpenDialogForUser.useMutation({
      onSuccess: () => {
        ignoreAsyncError(utils.supportChat.staffListDialogs.invalidate())
        ignoreAsyncError(utils.supportChat.getUnansweredDialogsCount.invalidate())
      },
    })

  const createDialogMutation = supportChatApi.supportChat.createDialog.useMutation({
    onSuccess: () => {
      ignoreAsyncError(utils.supportChat.userListDialogs.invalidate())
      ignoreAsyncError(utils.supportChat.getUnansweredDialogsCount.invalidate())
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

      const optimisticPendingAttachments =
        pendingAttachmentsByClientMessageIdRef.current.get(
          optimisticClientMessageId
        ) ?? variables.attachments

      await utils.supportChat.userGetMessages.cancel({ dialogId: variables.dialogId })

      setMessagesInfiniteData(
        variables.dialogId,
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
              optimisticPendingAttachments?.map(attachment => ({
                id: attachment.attachmentId,
                name: attachment.name,
                path:
                  resolveAttachmentPreviewUrl(attachment) ??
                  `/api/support-chat/attachments/${variables.dialogId}/${attachment.attachmentId}`,
                type: attachment.mimeType,
                sizeBytes: attachment.sizeBytes,
              })) ?? [],
            editedAt: null,
            deletedAt: null,
            deletedBy: null,
            canEdit: true,
            canDelete: true,
            createdAt: new Date().toISOString(),
            readAt: null,
            clientMessageId: optimisticClientMessageId,
            status: 'sending' as const,
            pendingAttachments: optimisticPendingAttachments,
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
        setMessagesInfiniteData(
          variables.dialogId,
          (current: SupportChatMessagesCache | undefined) => {
            return updateCachedDialogMessages(current, items =>
              markMessageSent({
                items,
                clientMessageId: resolvedClientMessageId,
                message: result.message,
              })
            )
          }
        )
        cleanupPendingAttachments(resolvedClientMessageId)
        optimisticSenderTypeByClientMessageIdRef.current.delete(
          resolvedClientMessageId
        )
      }

      invalidateDialogLists()
      invalidateMessages(variables.dialogId)
    },
    onError: (_error, variables, context) => {
      const resolvedClientMessageId = context?.clientMessageId
      if (!resolvedClientMessageId) {
        return
      }

      optimisticSenderTypeByClientMessageIdRef.current.delete(
        resolvedClientMessageId
      )

      setMessagesInfiniteData(
        variables.dialogId,
        (current: SupportChatMessagesCache | undefined) => {
          return updateCachedDialogMessages(current, items =>
            markMessageFailed(items, resolvedClientMessageId)
          )
        }
      )
    },
  })

  const markReadMutation = supportChatApi.supportChat.markDialogRead.useMutation({
    onSuccess: (_result, variables) => {
      invalidateDialogLists()
      invalidateMessages(variables.dialogId)
    },
  })

  const editMessageMutation = supportChatApi.supportChat.editMessage.useMutation({
    onMutate: async variables => {
      await utils.supportChat.userGetMessages.cancel({
        dialogId: variables.dialogId,
      })

      const previousMessages = utils.supportChat.userGetMessages.getInfiniteData(
        getMessagesCacheInput(variables.dialogId)
      )

      const optimisticEditedAt = new Date().toISOString()
      setMessagesInfiniteData(
        variables.dialogId,
        (current: SupportChatMessagesCache | undefined) => {
          return updateCachedDialogMessages(current, items =>
            markMessageEdited(
              items,
              variables.messageId,
              variables.text,
              optimisticEditedAt
            )
          )
        }
      )

      return {
        previousMessages,
      }
    },
    onSuccess: (_result, variables) => {
      invalidateDialogLists()
      invalidateMessages(variables.dialogId)
    },
    onError: (_error, variables, context) => {
      if (!context?.previousMessages) {
        return
      }

      setMessagesInfiniteData(variables.dialogId, context.previousMessages)
    },
  })

  const deleteMessageMutation = supportChatApi.supportChat.deleteMessage.useMutation({
    onSuccess: (_result, variables) => {
      invalidateDialogLists()
      invalidateMessages(variables.dialogId)
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
    pendingAttachments?: SupportChatPendingAttachmentInput[]
    clientMessageId?: string
    optimisticSenderType?: ChatMessageSenderType
  }) => {
    const resolvedClientMessageId = params.clientMessageId ?? createClientMessageId()
    optimisticSenderTypeByClientMessageIdRef.current.set(
      resolvedClientMessageId,
      params.optimisticSenderType ?? 'USER'
    )

    if (params.pendingAttachments && params.pendingAttachments.length > 0) {
      pendingAttachmentsByClientMessageIdRef.current.set(
        resolvedClientMessageId,
        params.pendingAttachments
      )
    }

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
    cleanupPendingAttachments(params.clientMessageId)

    setMessagesInfiniteData(
      params.dialogId,
      (current: SupportChatMessagesCache | undefined) => {
        return updateCachedDialogMessages(current, items =>
          removeMessageByClientMessageId(items, params.clientMessageId)
        )
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
