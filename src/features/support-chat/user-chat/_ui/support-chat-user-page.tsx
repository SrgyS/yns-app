'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from 'react'
import {
  EllipsisVertical,
  Paperclip,
  Pencil,
  Send,
  Trash2,
  MessagesSquare,
} from 'lucide-react'
import { toast } from 'sonner'

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
  isIncomingChatMessageForUser,
  useDialogMessages,
  useSupportChatActions,
  useSupportChatSse,
  useUserDialogs,
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

type UserMessage = ReturnType<typeof useDialogMessages>['messages'][number]
type UserDialog = ReturnType<typeof useUserDialogs>['dialogs'][number]
type UserDialogsQuery = ReturnType<typeof useUserDialogs>
type MarkDialogRead = ReturnType<typeof useSupportChatActions>['markDialogRead']
type UserMessagesQuery = ReturnType<typeof useDialogMessages>
type RefCell<T> = { current: T }

function toastSupportChatActionError(error: unknown, fallbackMessage: string) {
  const errorMessage = resolveSupportChatClientErrorMessage(error, fallbackMessage)
  toast.error(errorMessage)
}

export function SupportChatUserPage() {
  const { dialogs, hasNextPage, fetchNextPage, isFetchingNextPage } = useUserDialogs()
  const [selectedDialogId, setSelectedDialogId] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const effectiveSelectedDialogId = selectedDialogId ?? dialogs[0]?.dialogId

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const {
    createDialog,
    sendMessage,
    markDialogRead,
    editMessage,
    deleteMessage,
    isCreatingDialog,
    isSendingMessage,
    isMarkingRead,
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
  } = useDialogMessages(effectiveSelectedDialogId)
  const latestMessageId = messages.at(-1)?.id

  useSupportChatSse(effectiveSelectedDialogId)

  const resetLastMarkedMessageId = useMarkLatestIncomingAsRead({
    messages,
    effectiveSelectedDialogId,
    markDialogRead,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [latestMessageId])

  const selectedDialog = useMemo(
    () => dialogs.find(dialog => dialog.dialogId === effectiveSelectedDialogId),
    [dialogs, effectiveSelectedDialogId]
  )

  const handleSubmit = async (event: FormSubmitEvent) => {
    event.preventDefault()

    const hasText = hasDraftText
    const hasFiles = hasDraftFiles

    if (!hasText && !hasFiles) {
      toast.error('Введите сообщение или добавьте вложение')
      return
    }

    const textPayload = hasText ? trimmedMessage : undefined
    const initialMessageText = hasText ? trimmedMessage : 'Вложение без текста'

    try {
      const attachments = await toAttachments(files)

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

  const selectDialog = (dialogId: string) => {
    setSelectedDialogId(dialogId)
    resetLastMarkedMessageId()
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

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
      <SupportChatUserDialogsCard
        dialogs={dialogs}
        hasNextPage={hasNextPage}
        fetchNextPage={fetchNextPage}
        isFetchingNextPage={isFetchingNextPage}
        effectiveSelectedDialogId={effectiveSelectedDialogId}
        selectDialog={selectDialog}
      />

      <SupportChatUserConversationCard
        selectedDialog={selectedDialog}
        hasMoreMessages={hasMoreMessages}
        isFetchingMoreMessages={isFetchingMoreMessages}
        fetchMoreMessages={fetchMoreMessages}
        messages={messages}
        editingMessageId={editingMessageId}
        editingText={editingText}
        isEditingMessage={isEditingMessage}
        isDeletingMessage={isDeletingMessage}
        onEditingTextChange={setEditingText}
        onCancelEdit={handleCancelEdit}
        onSubmitEdit={handleEditSubmit}
        onStartEdit={startEditMessage}
        onDelete={handleDeleteMessage}
        messagesEndRef={messagesEndRef}
        message={message}
        onMessageChange={handleMessageChange}
        onFilesChange={handleFilesChange}
        files={files}
        handleSubmit={handleSubmit}
        onScrollToLastMessage={scrollToLastMessage}
        isMarkingRead={isMarkingRead}
        isSendingMessage={isSendingMessage}
        isCreatingDialog={isCreatingDialog}
        hasDraftText={hasDraftText}
        hasDraftFiles={hasDraftFiles}
      />
    </div>
  )
}

type SupportChatUserDialogsCardProps = {
  dialogs: UserDialog[]
  hasNextPage: UserDialogsQuery['hasNextPage']
  fetchNextPage: UserDialogsQuery['fetchNextPage']
  isFetchingNextPage: UserDialogsQuery['isFetchingNextPage']
  effectiveSelectedDialogId: string | undefined
  selectDialog: (dialogId: string) => void
}

function SupportChatUserDialogsCard({
  dialogs,
  hasNextPage,
  fetchNextPage,
  isFetchingNextPage,
  effectiveSelectedDialogId,
  selectDialog,
}: Readonly<SupportChatUserDialogsCardProps>) {
  return (
    <Card className="h-[75vh]">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessagesSquare className="h-5 w-5" />
          Support чат
        </CardTitle>
        {hasNextPage ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage ? 'Загрузка...' : 'Загрузить еще диалоги'}
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-2 overflow-y-auto">
        {dialogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Диалогов пока нет. Отправьте первое сообщение в поддержку.
          </p>
        ) : null}

        {dialogs.map(dialog => (
          <SupportChatUserDialogListItem
            key={dialog.dialogId}
            dialog={dialog}
            isActive={dialog.dialogId === effectiveSelectedDialogId}
            onSelectDialog={selectDialog}
          />
        ))}
      </CardContent>
    </Card>
  )
}

type SupportChatUserDialogListItemProps = {
  dialog: UserDialog
  isActive: boolean
  onSelectDialog: (dialogId: string) => void
}

function SupportChatUserDialogListItem({
  dialog,
  isActive,
  onSelectDialog,
}: Readonly<SupportChatUserDialogListItemProps>) {
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
          <span className="text-sm font-medium">Диалог</span>
          {dialog.isUnanswered ? (
            <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
          ) : null}
        </div>
        {dialog.unreadCount > 0 ? <Badge>{dialog.unreadCount}</Badge> : null}
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {dialog.lastMessagePreview ?? 'Нет сообщений'}
      </p>
    </button>
  )
}

type SupportChatUserConversationCardProps = {
  selectedDialog: UserDialog | undefined
  hasMoreMessages: UserMessagesQuery['hasNextPage']
  isFetchingMoreMessages: UserMessagesQuery['isFetchingNextPage']
  fetchMoreMessages: UserMessagesQuery['fetchNextPage']
  messages: UserMessage[]
  editingMessageId: string | null
  editingText: string
  isEditingMessage: boolean
  isDeletingMessage: boolean
  onEditingTextChange: (value: string) => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
  onStartEdit: (messageId: string, text: string | null) => void
  onDelete: (messageId: string) => void
  messagesEndRef: RefCell<HTMLDivElement | null>
  message: string
  onMessageChange: (value: string) => void
  onFilesChange: (files: File[]) => void
  files: File[]
  handleSubmit: (event: FormSubmitEvent) => void
  onScrollToLastMessage: () => void
  isMarkingRead: boolean
  isSendingMessage: boolean
  isCreatingDialog: boolean
  hasDraftText: boolean
  hasDraftFiles: boolean
}

function SupportChatUserConversationCard({
  selectedDialog,
  hasMoreMessages,
  isFetchingMoreMessages,
  fetchMoreMessages,
  messages,
  editingMessageId,
  editingText,
  isEditingMessage,
  isDeletingMessage,
  onEditingTextChange,
  onCancelEdit,
  onSubmitEdit,
  onStartEdit,
  onDelete,
  messagesEndRef,
  message,
  onMessageChange,
  onFilesChange,
  files,
  handleSubmit,
  onScrollToLastMessage,
  isMarkingRead,
  isSendingMessage,
  isCreatingDialog,
  hasDraftText,
  hasDraftFiles,
}: Readonly<SupportChatUserConversationCardProps>) {
  return (
    <Card className="h-[75vh]">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">
          {selectedDialog ? 'Переписка' : 'Новый диалог'}
        </CardTitle>
        {selectedDialog && hasMoreMessages ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetchingMoreMessages}
            onClick={() => fetchMoreMessages()}
          >
            {isFetchingMoreMessages ? 'Загрузка...' : 'Загрузить историю'}
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="flex h-full flex-col gap-3">
        <SupportChatUserMessagesList
          messages={messages}
          editingMessageId={editingMessageId}
          editingText={editingText}
          isEditingMessage={isEditingMessage}
          isDeletingMessage={isDeletingMessage}
          onEditingTextChange={onEditingTextChange}
          onCancelEdit={onCancelEdit}
          onSubmitEdit={onSubmitEdit}
          onStartEdit={onStartEdit}
          onDelete={onDelete}
          messagesEndRef={messagesEndRef}
        />

        <SupportChatUserComposeForm
          message={message}
          onMessageChange={onMessageChange}
          onFilesChange={onFilesChange}
          files={files}
          handleSubmit={handleSubmit}
          onScrollToLastMessage={onScrollToLastMessage}
          isMarkingRead={isMarkingRead}
          isSendingMessage={isSendingMessage}
          isCreatingDialog={isCreatingDialog}
          hasDraftText={hasDraftText}
          hasDraftFiles={hasDraftFiles}
        />
      </CardContent>
    </Card>
  )
}

type SupportChatUserMessagesListProps = {
  messages: UserMessage[]
  editingMessageId: string | null
  editingText: string
  isEditingMessage: boolean
  isDeletingMessage: boolean
  onEditingTextChange: (value: string) => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
  onStartEdit: (messageId: string, text: string | null) => void
  onDelete: (messageId: string) => void
  messagesEndRef: RefCell<HTMLDivElement | null>
}

function SupportChatUserMessagesList({
  messages,
  editingMessageId,
  editingText,
  isEditingMessage,
  isDeletingMessage,
  onEditingTextChange,
  onCancelEdit,
  onSubmitEdit,
  onStartEdit,
  onDelete,
  messagesEndRef,
}: Readonly<SupportChatUserMessagesListProps>) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-3">
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Сообщений пока нет. Напишите в поддержку.
        </p>
      ) : null}

      <div className="space-y-2">
        {messages.map(item => (
          <SupportChatUserMessageItem
            key={item.id}
            item={item}
            editingMessageId={editingMessageId}
            editingText={editingText}
            isEditingMessage={isEditingMessage}
            isDeletingMessage={isDeletingMessage}
            onEditingTextChange={onEditingTextChange}
            onCancelEdit={onCancelEdit}
            onSubmitEdit={onSubmitEdit}
            onStartEdit={onStartEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      <div ref={messagesEndRef} />
    </div>
  )
}

type SupportChatUserComposeFormProps = {
  message: string
  onMessageChange: (value: string) => void
  onFilesChange: (files: File[]) => void
  files: File[]
  handleSubmit: (event: FormSubmitEvent) => void
  onScrollToLastMessage: () => void
  isMarkingRead: boolean
  isSendingMessage: boolean
  isCreatingDialog: boolean
  hasDraftText: boolean
  hasDraftFiles: boolean
}

function SupportChatUserComposeForm({
  message,
  onMessageChange,
  onFilesChange,
  files,
  handleSubmit,
  onScrollToLastMessage,
  isMarkingRead,
  isSendingMessage,
  isCreatingDialog,
  hasDraftText,
  hasDraftFiles,
}: Readonly<SupportChatUserComposeFormProps>) {
  const handleFileInputChange = (event: InputChangeEvent) => {
    const fileList = Array.from(event.target.files ?? [])
    onFilesChange(fileList)
  }

  const isSubmitting = isSendingMessage || isCreatingDialog

  return (
    <form className="space-y-2" onSubmit={handleSubmit}>
      <Textarea
        value={message}
        onChange={event => onMessageChange(event.target.value)}
        placeholder="Введите сообщение"
        rows={3}
      />

      <div className="flex flex-wrap items-center gap-2">
        <label
          htmlFor="support-chat-user-file-input"
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
        >
          <Paperclip className="h-4 w-4" />
          Прикрепить файл
          <Input
            id="support-chat-user-file-input"
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
          disabled={isSubmitting || (!hasDraftText && !hasDraftFiles)}
        >
          <Send className="mr-2 h-4 w-4" />
          {isSubmitting ? 'Отправка...' : 'Отправить'}
        </Button>
      </div>
    </form>
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

type SupportChatUserMessageItemProps = {
  item: UserMessage
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

function SupportChatUserMessageItem({
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
}: Readonly<SupportChatUserMessageItemProps>) {
  const isOutgoing = item.senderType === 'USER'
  const isEditing = editingMessageId === item.id
  const containerClass = isOutgoing ? 'justify-end' : 'justify-start'
  const bubbleClass = isOutgoing
    ? 'bg-primary text-primary-foreground'
    : 'bg-muted text-foreground'

  return (
    <div className={`flex ${containerClass}`}>
      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${bubbleClass}`}>
        <SupportChatUserMessageItemContent
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
          <SupportChatUserMessageItemActions
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

type SupportChatUserMessageItemContentProps = {
  item: UserMessage
  isEditing: boolean
  editingText: string
  isEditingMessage: boolean
  onEditingTextChange: (value: string) => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
}

function SupportChatUserMessageItemContent({
  item,
  isEditing,
  editingText,
  isEditingMessage,
  onEditingTextChange,
  onCancelEdit,
  onSubmitEdit,
}: Readonly<SupportChatUserMessageItemContentProps>) {
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

type SupportChatUserMessageItemActionsProps = {
  item: UserMessage
  isDeletingMessage: boolean
  onStartEdit: (messageId: string, text: string | null) => void
  onDelete: (messageId: string) => void
}

function SupportChatUserMessageItemActions({
  item,
  isDeletingMessage,
  onStartEdit,
  onDelete,
}: Readonly<SupportChatUserMessageItemActionsProps>) {
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
