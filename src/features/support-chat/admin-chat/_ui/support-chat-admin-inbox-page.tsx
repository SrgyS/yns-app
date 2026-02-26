'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react'
import {
  ArrowLeft,
  EllipsisVertical,
  Paperclip,
  Pencil,
  Send,
  Trash2,
  MessageSquareWarning,
} from 'lucide-react'
import { toast } from 'sonner'

import { useAdminAbility } from '@/features/admin-panel/users/_hooks/use-admin-ability'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { SupportChatMessageAttachments } from '../../_ui/support-chat-message-attachments'
import { resolveSupportChatClientErrorMessage } from '../../_domain/client-error-message'

import {
  useStaffDialogMessages,
  useStaffDialogs,
  useSupportChatActions,
  useSupportChatStaffSse,
} from '../../_vm/use-support-chat'

type SupportChatAttachmentInput = {
  filename: string
  mimeType: string
  sizeBytes: number
  base64: string
}

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0]
type InputChangeEvent = Parameters<
  NonNullable<ComponentProps<'input'>['onChange']>
>[0]

type StaffMessage = ReturnType<
  typeof useStaffDialogMessages
>['messages'][number]
type StaffDialog = ReturnType<typeof useStaffDialogs>['dialogs'][number]

type RefCell<T> = {
  current: T
}

type StaffDialogsQuery = ReturnType<typeof useStaffDialogs>
type StaffMessagesQuery = ReturnType<typeof useStaffDialogMessages>
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

  const effectiveSelectedDialogId = selectedDialogId

  const messagesQuery = useStaffDialogMessages(effectiveSelectedDialogId)
  const messages = messagesQuery.messages

  const {
    sendMessage,
    markDialogRead,
    editMessage,
    deleteMessage,
    isSendingMessage,
    isMarkingRead,
    isEditingMessage,
    isDeletingMessage,
  } = useSupportChatActions()
  const trimmedMessage = message.trim()
  const hasDraftText = trimmedMessage.length > 0
  const hasDraftFiles = files.length > 0

  useSupportChatStaffSse(effectiveSelectedDialogId)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const dialogsLoadMoreRef = useRef<HTMLDivElement | null>(null)

  const resetLastMarkedMessageId = useMarkLatestIncomingAsRead({
    messages,
    effectiveSelectedDialogId,
    markDialogRead,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useDialogsInfiniteScroll({
    dialogsLoadMoreRef,
    hasNextPage: dialogsQuery.hasNextPage,
    isFetchingNextPage: dialogsQuery.isFetchingNextPage,
    fetchNextPage: dialogsQuery.fetchNextPage,
  })

  const selectedDialog = useMemo(
    () =>
      orderedDialogs.find(
        dialog => dialog.dialogId === effectiveSelectedDialogId
      ),
    [orderedDialogs, effectiveSelectedDialogId]
  )

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault()

    if (!effectiveSelectedDialogId) {
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
      const attachments = await toAttachments(files)

      await sendMessage({
        dialogId: effectiveSelectedDialogId,
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

  const scrollToLastMessage = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (abilityQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Загрузка...</p>
  }

  if (!canAccessSupportChat) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Доступ ограничен</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            У вас нет прав на управление support-чатами.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <SupportChatAdminDialogsCard
        showMobileChat={showMobileChat}
        onlyUnanswered={onlyUnanswered}
        onToggleOnlyUnanswered={handleToggleOnlyUnanswered}
        orderedDialogs={orderedDialogs}
        selectedDialogId={effectiveSelectedDialogId}
        onSelectDialog={handleSelectDialog}
        dialogsLoadMoreRef={dialogsLoadMoreRef}
        isFetchingNextPage={dialogsQuery.isFetchingNextPage}
      />

      <SupportChatAdminConversationCard
        showMobileChat={showMobileChat}
        selectedDialog={selectedDialog}
        messagesQuery={messagesQuery}
        handleBackToDialogs={handleBackToDialogs}
        messages={messages}
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
        messagesEndRef={messagesEndRef}
        onScrollToLastMessage={scrollToLastMessage}
        isMarkingRead={isMarkingRead}
        isSendingMessage={isSendingMessage}
        hasDraftText={hasDraftText}
        hasDraftFiles={hasDraftFiles}
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
    <Card className={`h-[78vh] ${showMobileChat ? 'hidden lg:block' : ''}`}>
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquareWarning className="h-5 w-5" />
          Support inbox
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

      <CardContent className="space-y-2 overflow-y-auto">
        {orderedDialogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
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
          <p className="text-center text-xs text-muted-foreground">
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
          <span className="text-sm font-medium">
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

      <p className="mt-2 text-xs text-muted-foreground">
        {new Date(dialog.lastMessageAt).toLocaleString()}
      </p>
    </button>
  )
}

type SupportChatAdminConversationCardProps = {
  showMobileChat: boolean
  selectedDialog: StaffDialog | undefined
  messagesQuery: StaffMessagesQuery
  handleBackToDialogs: () => void
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
  messagesEndRef: RefCell<HTMLDivElement | null>
  onScrollToLastMessage: () => void
  isMarkingRead: boolean
  isSendingMessage: boolean
  hasDraftText: boolean
  hasDraftFiles: boolean
}

function SupportChatAdminConversationCard({
  showMobileChat,
  selectedDialog,
  messagesQuery,
  handleBackToDialogs,
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
  messagesEndRef,
  onScrollToLastMessage,
  isMarkingRead,
  isSendingMessage,
  hasDraftText,
  hasDraftFiles,
}: Readonly<SupportChatAdminConversationCardProps>) {
  const handleFileInputChange = (event: InputChangeEvent) => {
    const fileList = Array.from(event.target.files ?? [])
    onFilesChange(fileList)
  }

  return (
    <Card
      className={`h-[78vh] ${showMobileChat ? 'block' : 'hidden lg:block'}`}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          {showMobileChat ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={handleBackToDialogs}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Назад
            </Button>
          ) : null}
        </div>
        <CardTitle className="text-lg">
          {selectedDialog
            ? `Диалог: ${selectedDialog.user.name ?? selectedDialog.user.id}`
            : 'Выберите диалог'}
        </CardTitle>

        {selectedDialog && messagesQuery.hasNextPage ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={messagesQuery.isFetchingNextPage}
            onClick={() => messagesQuery.fetchNextPage()}
          >
            {messagesQuery.isFetchingNextPage
              ? 'Загрузка...'
              : 'Загрузить историю'}
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-3">
        <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Нет сообщений в диалоге.
            </p>
          ) : null}

          <div className="space-y-2">
            {messages.map(item => (
              <SupportChatAdminMessageItem
                key={item.id}
                item={item}
                editingMessageId={editingMessageId}
                editingText={editingText}
                isEditingMessage={isEditingMessage}
                isDeletingMessage={isDeletingMessage}
                onEditingTextChange={onEditingTextChange}
                onCancelEdit={onCancelEdit}
                onSubmitEdit={handleEditSubmit}
                onStartEdit={startEditMessage}
                onDelete={handleDeleteMessage}
              />
            ))}
          </div>
          <div ref={messagesEndRef} />
        </div>

        <form className="space-y-2" onSubmit={handleSubmit}>
          <Textarea
            value={message}
            onChange={event => onMessageChange(event.target.value)}
            placeholder="Ответить пользователю"
            rows={3}
          />

          <div className="flex flex-wrap items-center gap-2">
            <label
              htmlFor="support-chat-admin-file-input"
              className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
            >
              <Paperclip className="h-4 w-4" />
              Прикрепить файл
              <Input
                id="support-chat-admin-file-input"
                type="file"
                className="hidden"
                multiple
                onChange={handleFileInputChange}
              />
            </label>

            {files.map(file => (
              <Badge key={file.name}>{file.name}</Badge>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onScrollToLastMessage}
              disabled={isMarkingRead}
            >
              К последнему
            </Button>
            <Button
              type="submit"
              disabled={isSendingMessage || (!hasDraftText && !hasDraftFiles)}
            >
              <Send className="mr-2 h-4 w-4" />
              {isSendingMessage ? 'Отправка...' : 'Отправить'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

type UseMarkLatestIncomingAsReadArgs = {
  messages: StaffMessage[]
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
    if (!messages.length || !effectiveSelectedDialogId) {
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
      dialogId: effectiveSelectedDialogId,
      lastReadMessageId: latestIncoming.id,
    }).catch(() => {
      lastMarkedMessageIdRef.current = null
    })
  }, [effectiveSelectedDialogId, markDialogRead, messages])

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

type SupportChatAdminMessageItemProps = {
  item: StaffMessage
  editingMessageId: string | null
  editingText: string
  isEditingMessage: boolean
  isDeletingMessage: boolean
  onEditingTextChange: (value: string) => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
  onStartEdit: (messageId: string, text: string | null) => void
  onDelete: (messageId: string) => void
}

function SupportChatAdminMessageItem({
  item,
  editingMessageId,
  editingText,
  isEditingMessage,
  isDeletingMessage,
  onEditingTextChange,
  onCancelEdit,
  onSubmitEdit,
  onStartEdit,
  onDelete,
}: Readonly<SupportChatAdminMessageItemProps>) {
  const isOutgoing = item.senderType !== 'USER'
  const isEditing = editingMessageId === item.id
  const containerClass = isOutgoing ? 'justify-end' : 'justify-start'
  const bubbleClass = isOutgoing
    ? 'bg-primary text-primary-foreground'
    : 'bg-muted text-foreground'

  return (
    <div className={`flex ${containerClass}`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${bubbleClass}`}
      >
        <SupportChatAdminMessageItemContent
          item={item}
          isEditing={isEditing}
          editingText={editingText}
          isEditingMessage={isEditingMessage}
          onEditingTextChange={onEditingTextChange}
          onCancelEdit={onCancelEdit}
          onSubmitEdit={onSubmitEdit}
        />

        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-[10px] opacity-75">
            {new Date(item.createdAt).toLocaleString()}
            {item.editedAt ? ' (изменено)' : ''}
          </p>
          <SupportChatAdminMessageItemActions
            item={item}
            isDeletingMessage={isDeletingMessage}
            onStartEdit={onStartEdit}
            onDelete={onDelete}
          />
        </div>
      </div>
    </div>
  )
}

type SupportChatAdminMessageItemContentProps = {
  item: StaffMessage
  isEditing: boolean
  editingText: string
  isEditingMessage: boolean
  onEditingTextChange: (value: string) => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
}

function SupportChatAdminMessageItemContent({
  item,
  isEditing,
  editingText,
  isEditingMessage,
  onEditingTextChange,
  onCancelEdit,
  onSubmitEdit,
}: Readonly<SupportChatAdminMessageItemContentProps>) {
  if (item.deletedAt) {
    return <p className="italic opacity-80">Сообщение удалено</p>
  }

  return (
    <>
      <SupportChatMessageAttachments
        dialogId={item.dialogId}
        attachments={item.attachments}
      />
      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editingText}
            onChange={event => onEditingTextChange(event.target.value)}
            rows={3}
            className="bg-background text-foreground"
          />
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancelEdit}
            >
              Отмена
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={onSubmitEdit}
              disabled={isEditingMessage}
            >
              {isEditingMessage ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </div>
        </div>
      ) : null}
      {!isEditing && item.text ? (
        <p className="whitespace-pre-wrap">{item.text}</p>
      ) : null}
    </>
  )
}

type SupportChatAdminMessageItemActionsProps = {
  item: StaffMessage
  isDeletingMessage: boolean
  onStartEdit: (messageId: string, text: string | null) => void
  onDelete: (messageId: string) => void
}

function SupportChatAdminMessageItemActions({
  item,
  isDeletingMessage,
  onStartEdit,
  onDelete,
}: Readonly<SupportChatAdminMessageItemActionsProps>) {
  if (!item.canEdit && !item.canDelete) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6">
          <EllipsisVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {item.canEdit ? (
          <DropdownMenuItem onClick={() => onStartEdit(item.id, item.text)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Редактировать
          </DropdownMenuItem>
        ) : null}
        {item.canDelete ? (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onDelete(item.id)}
            disabled={isDeletingMessage}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Удалить
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

async function toAttachments(
  files: File[]
): Promise<SupportChatAttachmentInput[] | undefined> {
  if (files.length === 0) {
    return undefined
  }

  const mapped = await Promise.all(
    files.map(async file => ({
      filename: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      base64: await fileToBase64(file),
    }))
  )

  return mapped
}

async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string') {
        resolve(result)
        return
      }

      reject(new Error('Не удалось обработать файл'))
    }

    reader.onerror = () => {
      reject(new Error('Не удалось обработать файл'))
    }

    reader.readAsDataURL(file)
  })
}
