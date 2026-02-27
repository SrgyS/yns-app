'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react'
import {
  MessageSquareWarning,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAdminAbility } from '@/features/admin-panel/users/_hooks/use-admin-ability'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { SupportChatConversationCard } from '../../_ui/support-chat-conversation-card'
import { toSupportChatAttachments } from '../../_ui/support-chat-attachments-upload'
import { resolveSupportChatClientErrorMessage } from '../../_domain/client-error-message'

import {
  useStaffDialogMessages,
  useStaffDialogs,
  useSupportChatActions,
  useSupportChatStaffSse,
} from '../../_vm/use-support-chat'

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0]

type StaffMessage = ReturnType<
  typeof useStaffDialogMessages
>['messages'][number]
type StaffDialog = ReturnType<typeof useStaffDialogs>['dialogs'][number]

type RefCell<T> = {
  current: T
}

type StaffDialogsQuery = ReturnType<typeof useStaffDialogs>
type MarkDialogRead = ReturnType<typeof useSupportChatActions>['markDialogRead']

function toastSupportChatActionError(error: unknown, fallbackMessage: string) {
  const errorMessage = resolveSupportChatClientErrorMessage(
    error,
    fallbackMessage
  )
  toast.error(errorMessage)
}

export function SupportChatAdminInboxPage() {
  const abilityQuery = useAdminAbility()
  const ability = abilityQuery.data

  const canAccessSupportChat = ability?.canManageSupportChats
  const [onlyUnanswered, setOnlyUnanswered] = useState(false)
  const [selectedDialogId, setSelectedDialogId] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const dialogsQuery = useStaffDialogs(onlyUnanswered ? true : undefined)
  const dialogs = dialogsQuery.dialogs
  const orderedDialogs = useMemo(() => {
    return [...dialogs].sort((left, right) => {
      const unresolvedDiff =
        Number(right.isUnanswered) - Number(left.isUnanswered)
      if (unresolvedDiff !== 0) {
        return unresolvedDiff
      }

      return (
        new Date(right.lastMessageAt).getTime() -
        new Date(left.lastMessageAt).getTime()
      )
    })
  }, [dialogs])

  const messagesQuery = useStaffDialogMessages(selectedDialogId)
  const messages = messagesQuery.messages

  const {
    sendMessage,
    markDialogRead,
    editMessage,
    deleteMessage,
    isSendingMessage,
    isEditingMessage,
    isDeletingMessage,
  } = useSupportChatActions()
  const trimmedMessage = message.trim()
  const hasDraftText = trimmedMessage.length > 0
  const hasDraftFiles = files.length > 0

  useSupportChatStaffSse(selectedDialogId)

  const dialogsLoadMoreRef = useRef<HTMLDivElement | null>(null)

  const resetLastMarkedMessageId = useMarkLatestIncomingAsRead({
    messages,
    selectedDialogId,
    markDialogRead,
  })

  useDialogsInfiniteScroll({
    dialogsLoadMoreRef,
    hasNextPage: dialogsQuery.hasNextPage,
    isFetchingNextPage: dialogsQuery.isFetchingNextPage,
    fetchNextPage: dialogsQuery.fetchNextPage,
  })

  const selectedDialog = useMemo(
    () => orderedDialogs.find(dialog => dialog.dialogId === selectedDialogId),
    [orderedDialogs, selectedDialogId]
  )

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault()

    if (!selectedDialogId) {
      toast.error('Выберите диалог для ответа')
      return
    }

    const hasText = hasDraftText
    const hasFiles = hasDraftFiles

    if (!hasText && !hasFiles) {
      toast.error('Введите ответ или добавьте вложение')
      return
    }

    const textPayload = hasText ? trimmedMessage : undefined

    try {
      const attachments = await toSupportChatAttachments(files)

      await sendMessage({
        dialogId: selectedDialogId,
        text: textPayload,
        attachments,
      })

      setMessage('')
      setFiles([])
    } catch (error) {
      toastSupportChatActionError(error, 'Не удалось отправить ответ')
    }
  }

  const handleSelectDialog = (dialogId: string) => {
    setSelectedDialogId(dialogId)
    setShowMobileChat(true)
    resetLastMarkedMessageId()
  }

  const handleBackToDialogs = () => {
    setShowMobileChat(false)
  }

  const handleToggleOnlyUnanswered = () => {
    setOnlyUnanswered(prev => !prev)
  }

  const startEditMessage = (messageId: string, text: string | null) => {
    setEditingMessageId(messageId)
    setEditingText(text ?? '')
  }

  const handleEditSubmit = async () => {
    if (!selectedDialogId || !editingMessageId) {
      return
    }

    const trimmed = editingText.trim()
    if (trimmed.length === 0) {
      toast.error('Текст сообщения не может быть пустым')
      return
    }

    try {
      await editMessage({
        dialogId: selectedDialogId,
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
    if (!selectedDialogId) {
      return
    }

    try {
      await deleteMessage({
        dialogId: selectedDialogId,
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

  if (abilityQuery.isLoading) {
    return <p className="text-fluid-sm text-muted-foreground">Загрузка...</p>
  }

  if (!canAccessSupportChat) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-fluid-lg">Доступ ограничен</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-fluid-sm text-muted-foreground">
            У вас нет прав на управление support-чатами.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden lg:grid-cols-[360px_1fr]">
      <SupportChatAdminDialogsCard
        showMobileChat={showMobileChat}
        onlyUnanswered={onlyUnanswered}
        onToggleOnlyUnanswered={handleToggleOnlyUnanswered}
        orderedDialogs={orderedDialogs}
        selectedDialogId={selectedDialogId}
        onSelectDialog={handleSelectDialog}
        dialogsLoadMoreRef={dialogsLoadMoreRef}
        isFetchingNextPage={dialogsQuery.isFetchingNextPage}
      />

      <SupportChatAdminConversationCard
        showMobileChat={showMobileChat}
        selectedDialog={selectedDialog}
        handleBackToDialogs={handleBackToDialogs}
        messages={messages}
        hasMoreMessages={messagesQuery.hasNextPage}
        isFetchingMoreMessages={messagesQuery.isFetchingNextPage}
        fetchMoreMessages={() => messagesQuery.fetchNextPage()}
        editingMessageId={editingMessageId}
        editingText={editingText}
        isEditingMessage={isEditingMessage}
        isDeletingMessage={isDeletingMessage}
        onEditingTextChange={setEditingText}
        handleEditSubmit={handleEditSubmit}
        startEditMessage={startEditMessage}
        handleDeleteMessage={handleDeleteMessage}
        onCancelEdit={handleCancelEdit}
        message={message}
        onMessageChange={handleMessageChange}
        onFilesChange={handleFilesChange}
        files={files}
        handleSubmit={handleSubmit}
        isSubmitting={isSendingMessage}
        isSubmitDisabled={isSendingMessage || (!hasDraftText && !hasDraftFiles)}
      />
    </div>
  )
}

type SupportChatAdminDialogsCardProps = {
  showMobileChat: boolean
  onlyUnanswered: boolean
  onToggleOnlyUnanswered: () => void
  orderedDialogs: StaffDialog[]
  selectedDialogId: string | undefined
  onSelectDialog: (dialogId: string) => void
  dialogsLoadMoreRef: RefCell<HTMLDivElement | null>
  isFetchingNextPage: boolean
}

function SupportChatAdminDialogsCard({
  showMobileChat,
  onlyUnanswered,
  onToggleOnlyUnanswered,
  orderedDialogs,
  selectedDialogId,
  onSelectDialog,
  dialogsLoadMoreRef,
  isFetchingNextPage,
}: Readonly<SupportChatAdminDialogsCardProps>) {
  return (
    <Card
      className={`h-full min-w-0 overflow-hidden ${showMobileChat ? 'hidden lg:flex' : 'flex'} flex-col`}
    >
      <CardHeader className="space-y-3">
        <CardTitle className="text-fluid-base flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5" />
          Обращения
        </CardTitle>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={onlyUnanswered ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleOnlyUnanswered}
          >
            Только неотвеченные
          </Button>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 space-y-2 overflow-y-auto">
        {orderedDialogs.length === 0 ? (
          <p className="text-fluid-sm text-muted-foreground">
            Диалогов нет для выбранного фильтра.
          </p>
        ) : null}

        {orderedDialogs.map(dialog => (
          <SupportChatAdminDialogListItem
            key={dialog.dialogId}
            dialog={dialog}
            isActive={dialog.dialogId === selectedDialogId}
            onSelectDialog={onSelectDialog}
          />
        ))}
        <div ref={dialogsLoadMoreRef} className="h-4" />
        {isFetchingNextPage ? (
          <p className="text-fluid-sm text-center text-muted-foreground">
            Загрузка диалогов...
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

type SupportChatAdminDialogListItemProps = {
  dialog: StaffDialog
  isActive: boolean
  onSelectDialog: (dialogId: string) => void
}

function SupportChatAdminDialogListItem({
  dialog,
  isActive,
  onSelectDialog,
}: Readonly<SupportChatAdminDialogListItemProps>) {
  return (
    <button
      type="button"
      className={`w-full rounded-md border px-3 py-2 text-left transition ${
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50'
      }`}
      onClick={() => onSelectDialog(dialog.dialogId)}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-fluid-base font-medium">
            {dialog.user.name ?? dialog.user.id}
          </span>
          {dialog.isUnanswered ? (
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          ) : null}
        </div>
      </div>

      {dialog.hasUnansweredIncoming ? (
        <Badge variant="destructive" className="mt-2">
          Не отвечено
        </Badge>
      ) : null}

      <p className="text-fluid-sm mt-2 text-muted-foreground">
        {new Date(dialog.lastMessageAt).toLocaleString()}
      </p>
    </button>
  )
}

type SupportChatAdminConversationCardProps = {
  showMobileChat: boolean
  selectedDialog: StaffDialog | undefined
  handleBackToDialogs: () => void
  hasMoreMessages: boolean
  isFetchingMoreMessages: boolean
  fetchMoreMessages: () => void
  messages: StaffMessage[]
  editingMessageId: string | null
  editingText: string
  isEditingMessage: boolean
  isDeletingMessage: boolean
  onEditingTextChange: (value: string) => void
  handleEditSubmit: () => void
  startEditMessage: (messageId: string, text: string | null) => void
  handleDeleteMessage: (messageId: string) => void
  onCancelEdit: () => void
  message: string
  onMessageChange: (value: string) => void
  onFilesChange: (files: File[]) => void
  files: File[]
  handleSubmit: (event: FormSubmitEvent) => void
  isSubmitting: boolean
  isSubmitDisabled: boolean
}

function SupportChatAdminConversationCard({
  showMobileChat,
  selectedDialog,
  handleBackToDialogs,
  hasMoreMessages,
  isFetchingMoreMessages,
  fetchMoreMessages,
  messages,
  editingMessageId,
  editingText,
  isEditingMessage,
  isDeletingMessage,
  onEditingTextChange,
  handleEditSubmit,
  startEditMessage,
  handleDeleteMessage,
  onCancelEdit,
  message,
  onMessageChange,
  onFilesChange,
  files,
  handleSubmit,
  isSubmitting,
  isSubmitDisabled,
}: Readonly<SupportChatAdminConversationCardProps>) {
  const isOutgoingMessage = useCallback((senderType: string) => {
    return senderType !== 'USER'
  }, [])

  return (
    <SupportChatConversationCard
      cardClassName={`h-full gap-2 min-w-0 py-2 overflow-hidden ${showMobileChat ? 'flex' : 'hidden lg:flex'} flex-col`}
      headerClassName="px-2"
      title={
        selectedDialog
          ? `Диалог: ${selectedDialog.user.name ?? selectedDialog.user.id}`
          : 'Выберите диалог'
      }
      backButton={
        showMobileChat
          ? {
              label: 'Назад',
              onClick: handleBackToDialogs,
              className: 'lg:hidden has-[>svg]:ps-0',
            }
          : undefined
      }
      hasMoreMessages={selectedDialog ? hasMoreMessages : false}
      isFetchingMoreMessages={isFetchingMoreMessages}
      onFetchMoreMessages={fetchMoreMessages}
      messages={messages}
      selectedDialogKey={selectedDialog?.dialogId}
      emptyStateText="Нет сообщений в диалоге."
      editingMessageId={editingMessageId}
      editingText={editingText}
      isEditingMessage={isEditingMessage}
      isDeletingMessage={isDeletingMessage}
      onEditingTextChange={onEditingTextChange}
      onCancelEdit={onCancelEdit}
      onSubmitEdit={handleEditSubmit}
      onStartEdit={startEditMessage}
      onDelete={handleDeleteMessage}
      message={message}
      onMessageChange={onMessageChange}
      onFilesChange={onFilesChange}
      files={files}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isSubmitDisabled={isSubmitDisabled}
      isOutgoingMessage={isOutgoingMessage}
      fileInputId="support-chat-admin-file-input"
    />
  )
}

type UseMarkLatestIncomingAsReadArgs = {
  messages: StaffMessage[]
  selectedDialogId: string | undefined
  markDialogRead: MarkDialogRead
}

function useMarkLatestIncomingAsRead({
  messages,
  selectedDialogId,
  markDialogRead,
}: UseMarkLatestIncomingAsReadArgs) {
  const lastMarkedMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!messages.length || !selectedDialogId) {
      return
    }

    const latestIncoming = [...messages]
      .reverse()
      .find(item => item.senderType === 'USER')

    if (!latestIncoming) {
      return
    }

    if (lastMarkedMessageIdRef.current === latestIncoming.id) {
      return
    }

    lastMarkedMessageIdRef.current = latestIncoming.id
    markDialogRead({
      dialogId: selectedDialogId,
      lastReadMessageId: latestIncoming.id,
    }).catch(() => {
      lastMarkedMessageIdRef.current = null
    })
  }, [selectedDialogId, markDialogRead, messages])

  return () => {
    lastMarkedMessageIdRef.current = null
  }
}

type UseDialogsInfiniteScrollArgs = {
  dialogsLoadMoreRef: RefCell<HTMLDivElement | null>
  hasNextPage: StaffDialogsQuery['hasNextPage']
  isFetchingNextPage: StaffDialogsQuery['isFetchingNextPage']
  fetchNextPage: StaffDialogsQuery['fetchNextPage']
}

function useDialogsInfiniteScroll({
  dialogsLoadMoreRef,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: UseDialogsInfiniteScrollArgs) {
  useEffect(() => {
    const target = dialogsLoadMoreRef.current
    if (!target) {
      return
    }

    if (!hasNextPage) {
      return
    }

    const observer = new IntersectionObserver(entries => {
      const [entry] = entries
      if (!entry?.isIntersecting) {
        return
      }

      if (isFetchingNextPage) {
        return
      }

      fetchNextPage().catch(() => undefined)
    })

    observer.observe(target)
    return () => {
      observer.disconnect()
    }
  }, [dialogsLoadMoreRef, fetchNextPage, hasNextPage, isFetchingNextPage])
}
