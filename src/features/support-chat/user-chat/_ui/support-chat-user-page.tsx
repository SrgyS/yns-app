'use client'

import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { toast } from 'sonner'

import { SupportChatConversationCard } from '../../_ui/support-chat-conversation-card'
import { toSupportChatAttachments } from '../../_ui/support-chat-attachments-upload'
import { resolveSupportChatClientErrorMessage } from '../../_domain/client-error-message'
import {
  isIncomingChatMessageForUser,
  useDialogMessages,
  useSupportChatActions,
  useSupportChatSse,
  useUserDialogs,
} from '../../_vm/use-support-chat'

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0]

type UserMessage = ReturnType<typeof useDialogMessages>['messages'][number]
type MarkDialogRead = ReturnType<typeof useSupportChatActions>['markDialogRead']

function toastSupportChatActionError(error: unknown, fallbackMessage: string) {
  const errorMessage = resolveSupportChatClientErrorMessage(error, fallbackMessage)
  toast.error(errorMessage)
}

export function SupportChatUserPage() {
  const { dialogs } = useUserDialogs()
  const [selectedDialogId, setSelectedDialogId] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const effectiveSelectedDialogId = selectedDialogId ?? dialogs[0]?.dialogId

  const {
    createDialog,
    sendMessage,
    markDialogRead,
    editMessage,
    deleteMessage,
    isCreatingDialog,
    isSendingMessage,
    isEditingMessage,
    isDeletingMessage,
  } = useSupportChatActions()
  const trimmedMessage = message.trim()
  const hasDraftText = trimmedMessage.length > 0
  const hasDraftFiles = files.length > 0

  const {
    messages,
    hasNextPage: hasMoreMessages,
    fetchNextPage: fetchMoreMessages,
    isFetchingNextPage: isFetchingMoreMessages,
    isPending: isMessagesPending,
    isFetching: isMessagesFetching,
  } = useDialogMessages(effectiveSelectedDialogId)
  useSupportChatSse(effectiveSelectedDialogId)

  useMarkLatestIncomingAsRead({
    messages,
    effectiveSelectedDialogId,
    markDialogRead,
  })

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault()

    const hasText = hasDraftText
    const hasFiles = hasDraftFiles

    if (!hasText && !hasFiles) {
      toast.error('Введите сообщение или добавьте вложение')
      return
    }

    const textPayload = hasText ? trimmedMessage : undefined
    const initialMessageText = hasText ? trimmedMessage : ''

    try {
      const attachments = await toSupportChatAttachments(files)

      if (effectiveSelectedDialogId) {
        await sendMessage({
          dialogId: effectiveSelectedDialogId,
          text: textPayload,
          attachments,
        })
      } else {
        const created = await createDialog({
          initialMessage: initialMessageText,
          attachments,
        })
        setSelectedDialogId(created.dialogId)
      }

      setMessage('')
      setFiles([])
    } catch (error) {
      toastSupportChatActionError(error, 'Не удалось отправить сообщение')
    }
  }

  const startEditMessage = (messageId: string, text: string | null) => {
    setEditingMessageId(messageId)
    setEditingText(text ?? '')
  }

  const handleEditSubmit = async () => {
    if (!effectiveSelectedDialogId || !editingMessageId) {
      return
    }

    const trimmed = editingText.trim()
    if (trimmed.length === 0) {
      toast.error('Текст сообщения не может быть пустым')
      return
    }

    try {
      await editMessage({
        dialogId: effectiveSelectedDialogId,
        messageId: editingMessageId,
        text: trimmed,
      })
      setEditingMessageId(null)
      setEditingText('')
      toast.success('Сообщение изменено (изменено)')
    } catch (error) {
      toastSupportChatActionError(error, 'Не удалось изменить сообщение')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!effectiveSelectedDialogId) {
      return
    }

    try {
      await deleteMessage({
        dialogId: effectiveSelectedDialogId,
        messageId,
      })
      toast.success('Сообщение удалено')
    } catch (error) {
      toastSupportChatActionError(error, 'Не удалось удалить сообщение')
    }
  }

  const handleCancelEdit = () => {
    setEditingMessageId(null)
    setEditingText('')
  }

  const handleMessageChange = (value: string) => {
    setMessage(value)
  }

  const handleFilesChange = (nextFiles: File[]) => {
    setFiles(nextFiles)
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden">
      <SupportChatConversationCard
        cardClassName="h-full min-w-0 overflow-hidden flex flex-col border-none p-0 gap-1"
        headerClassName="space-y-2"
        backButton={{ mode: 'link', label: 'Назад', href: '/platform/profile' }}
        hasMoreMessages={hasMoreMessages}
        isFetchingMoreMessages={isFetchingMoreMessages}
        onFetchMoreMessages={() => fetchMoreMessages()}
        messages={messages}
        selectedDialogKey={effectiveSelectedDialogId}
        isLoadingMessages={
          Boolean(effectiveSelectedDialogId) &&
          (isMessagesPending || isMessagesFetching) &&
          messages.length === 0
        }
        emptyStateText="Сообщений пока нет."
        editingMessageId={editingMessageId}
        editingText={editingText}
        isEditingMessage={isEditingMessage}
        isDeletingMessage={isDeletingMessage}
        onEditingTextChange={setEditingText}
        onCancelEdit={handleCancelEdit}
        onSubmitEdit={handleEditSubmit}
        onStartEdit={startEditMessage}
        onDelete={handleDeleteMessage}
        message={message}
        onMessageChange={handleMessageChange}
        onFilesChange={handleFilesChange}
        files={files}
        onSubmit={handleSubmit}
        isSubmitting={isSendingMessage || isCreatingDialog}
        isSubmitDisabled={
          (isSendingMessage || isCreatingDialog) ||
          (!hasDraftText && !hasDraftFiles)
        }
        outgoingSenderType="USER"
        fileInputId="support-chat-user-file-input"
      />
    </div>
  )
}

type UseMarkLatestIncomingAsReadArgs = {
  messages: UserMessage[]
  effectiveSelectedDialogId: string | undefined
  markDialogRead: MarkDialogRead
}

function useMarkLatestIncomingAsRead({
  messages,
  effectiveSelectedDialogId,
  markDialogRead,
}: UseMarkLatestIncomingAsReadArgs) {
  const lastMarkedMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!messages.length) {
      return
    }

    const latestMessage = messages.at(-1)
    if (!latestMessage) {
      return
    }

    const isIncoming = isIncomingChatMessageForUser(latestMessage.senderType)
    if (!isIncoming || !effectiveSelectedDialogId) {
      return
    }

    if (lastMarkedMessageIdRef.current === latestMessage.id) {
      return
    }

    lastMarkedMessageIdRef.current = latestMessage.id
    markDialogRead({
      dialogId: effectiveSelectedDialogId,
      lastReadMessageId: latestMessage.id,
    }).catch(() => {
      lastMarkedMessageIdRef.current = null
    })
  }, [effectiveSelectedDialogId, markDialogRead, messages])

  return () => {
    lastMarkedMessageIdRef.current = null
  }
}
