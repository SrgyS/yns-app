'use client'

import { useEffect, useMemo } from 'react'
import { ChatMessageSenderType } from '@prisma/client'

import { CACHE_SETTINGS } from '@/shared/lib/cache/cache-constants'
import { supportChatApi } from '../_api'

type SupportChatAttachmentInput = {
  filename: string
  mimeType: string
  sizeBytes: number
  base64: string
}

const SUPPORT_CHAT_LIMIT = 20
type SupportChatDialogScope = 'user' | 'staff'

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
    const merged = pages.flatMap(page => page.items)
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

    const handleDialogCreated = () => {
      invalidateDialogs()
    }

    const handleMessageCreated = () => {
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

  const createDialogMutation = supportChatApi.supportChat.createDialog.useMutation({
    onSuccess: () => {
      utils.supportChat.userListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.getUnansweredDialogsCount.invalidate().catch(() => undefined)
    },
  })

  const sendMessageMutation = supportChatApi.supportChat.sendMessage.useMutation({
    onSuccess: (_result, variables) => {
      utils.supportChat.userListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.staffListDialogs.invalidate().catch(() => undefined)
      utils.supportChat.getUnansweredDialogsCount.invalidate().catch(() => undefined)
      utils.supportChat.userGetMessages
        .invalidate({ dialogId: variables.dialogId })
        .catch(() => undefined)
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

  const sendMessage = async (params: {
    dialogId: string
    text?: string
    attachments?: SupportChatAttachmentInput[]
  }) => {
    return await sendMessageMutation.mutateAsync(params)
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
    createDialog,
    sendMessage,
    markDialogRead,
    editMessage,
    deleteMessage,
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
