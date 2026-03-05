'use client'
import {
  useEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  AlertCircle,
  CheckCheck,
  Clock,
  EllipsisVertical,
  Paperclip,
  Pencil,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import { MAX_ATTACHMENTS_PER_MESSAGE } from '../_domain/attachment-schema'
import { SUPPORT_CHAT_ATTACHMENT_ACCEPT } from './support-chat-attachments-upload'
import { SupportChatMessageAttachments } from './support-chat-message-attachments'
import { BackButton } from '@/shared/ui/back-button'

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0]
type InputChangeEvent = Parameters<
  NonNullable<ComponentProps<'input'>['onChange']>
>[0]

export type SupportChatPendingAttachmentInput = {
  filename: string
  mimeType: string
  sizeBytes: number
  base64: string
}

export type SupportChatMessageItem = {
  id: string
  dialogId: string
  senderType: string
  clientMessageId?: string | null
  status?: 'sending' | 'sent' | 'failed'
  pendingAttachments?: SupportChatPendingAttachmentInput[]
  text: string | null
  attachments?: unknown
  editedAt: string | null
  deletedAt: string | null
  deletedBy?: string | null
  canEdit: boolean
  canDelete: boolean
  createdAt: string
  readAt: string | null
}

type SupportChatSenderType = SupportChatMessageItem['senderType']

type SupportChatBackButton =
  | {
      mode: 'link'
      label: string
      href: string
      className?: string
    }
  | {
      mode: 'action'
      label: string
      onClick: () => void
      className?: string
    }

type SupportChatConversationCardProps = {
  cardClassName?: string
  headerClassName?: string
  title?: ReactNode
  backButton?: SupportChatBackButton
  hasMoreMessages: boolean
  isFetchingMoreMessages: boolean
  onFetchMoreMessages: () => void
  messages: SupportChatMessageItem[]
  selectedDialogKey?: string
  isLoadingMessages?: boolean
  emptyStateText: string
  editingMessageId: string | null
  editingText: string
  isEditingMessage: boolean
  isDeletingMessage: boolean
  onEditingTextChange: (value: string) => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
  onStartEdit: (messageId: string, text: string | null) => void
  onDelete: (messageId: string) => void
  onRetryFailedMessage?: (message: SupportChatMessageItem) => void
  onCancelFailedMessage?: (message: SupportChatMessageItem) => void
  message: string
  onMessageChange: (value: string) => void
  onFilesChange: (files: File[]) => void
  onRemoveFile: (index: number) => void
  files: File[]
  onSubmit: (event: FormSubmitEvent) => void
  isSubmitting: boolean
  isSubmitDisabled: boolean
  outgoingSenderType: SupportChatSenderType
  placeholder?: string
  fileInputId: string
}

type MergeSelectedFilesResult = {
  nextFiles: File[]
  hasDuplicates: boolean
  exceedsLimit: boolean
}

export function SupportChatConversationCard({
  cardClassName,
  headerClassName,
  title,
  backButton,
  hasMoreMessages,
  isFetchingMoreMessages,
  onFetchMoreMessages,
  messages,
  selectedDialogKey,
  isLoadingMessages = false,
  emptyStateText,
  editingMessageId,
  editingText,
  isEditingMessage,
  isDeletingMessage,
  onEditingTextChange,
  onCancelEdit,
  onSubmitEdit,
  onStartEdit,
  onDelete,
  onRetryFailedMessage,
  onCancelFailedMessage,
  message,
  onMessageChange,
  onFilesChange,
  onRemoveFile,
  files,
  onSubmit,
  isSubmitting,
  isSubmitDisabled,
  outgoingSenderType,
  placeholder = 'Сообщение...',
  fileInputId,
}: Readonly<SupportChatConversationCardProps>) {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const messageTextareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const hasInitialScrollForDialogRef = useRef(false)
  const lastRenderedMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    hasInitialScrollForDialogRef.current = false
  }, [selectedDialogKey])

  useEffect(() => {
    if (!selectedDialogKey || messages.length === 0) {
      return
    }

    if (hasInitialScrollForDialogRef.current) {
      return
    }

    requestAnimationFrame(() => {
      const container = messagesContainerRef.current
      if (!container) {
        return
      }

      container.scrollTop = container.scrollHeight
      hasInitialScrollForDialogRef.current = true
    })
  }, [messages, selectedDialogKey])

  useEffect(() => {
    if (!selectedDialogKey || messages.length === 0) {
      return
    }

    const latestMessage = messages.at(-1)
    if (!latestMessage) {
      return
    }

    if (lastRenderedMessageIdRef.current === latestMessage.id) {
      return
    }

    lastRenderedMessageIdRef.current = latestMessage.id
    if (latestMessage.senderType !== outgoingSenderType) {
      return
    }

    requestAnimationFrame(() => {
      const container = messagesContainerRef.current
      if (!container) {
        return
      }

      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      })
    })
  }, [messages, outgoingSenderType, selectedDialogKey])

  useEffect(() => {
    const textarea = messageTextareaRef.current
    if (!textarea) {
      return
    }

    textarea.style.height = 'auto'
    const maxHeight = 220
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight)
    textarea.style.height = `${nextHeight}px`
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [message])

  const handleFileInputChange = (event: InputChangeEvent) => {
    const selectedFiles = Array.from(event.target.files ?? [])
    const mergedFiles = mergeSelectedFiles(files, selectedFiles)

    if (mergedFiles.hasDuplicates) {
      toast.error('Такой файл уже добавлен')
    }

    if (mergedFiles.exceedsLimit) {
      toast.error(
        `Можно прикрепить не более ${MAX_ATTACHMENTS_PER_MESSAGE} файлов`
      )
    }

    onFilesChange(mergedFiles.nextFiles)
    event.target.value = ''
  }

  return (
    <Card className={cardClassName}>
      <SupportChatConversationHeader
        headerClassName={headerClassName}
        backButton={backButton}
        title={title}
        hasMoreMessages={hasMoreMessages}
        isFetchingMoreMessages={isFetchingMoreMessages}
        onFetchMoreMessages={onFetchMoreMessages}
      />

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-2">
        <SupportChatMessagesViewport
          containerRef={messagesContainerRef}
          messages={messages}
          isLoadingMessages={isLoadingMessages}
          emptyStateText={emptyStateText}
          editingMessageId={editingMessageId}
          editingText={editingText}
          isEditingMessage={isEditingMessage}
          isDeletingMessage={isDeletingMessage}
          onEditingTextChange={onEditingTextChange}
          onCancelEdit={onCancelEdit}
          onSubmitEdit={onSubmitEdit}
          onStartEdit={onStartEdit}
          onDelete={onDelete}
          onRetryFailedMessage={onRetryFailedMessage}
          onCancelFailedMessage={onCancelFailedMessage}
          outgoingSenderType={outgoingSenderType}
        />

        <SupportChatComposer
          messageTextareaRef={messageTextareaRef}
          fileInputRef={fileInputRef}
          fileInputId={fileInputId}
          message={message}
          onMessageChange={onMessageChange}
          placeholder={placeholder}
          isSubmitting={isSubmitting}
          isSubmitDisabled={isSubmitDisabled}
          onSubmit={onSubmit}
          onFileInputChange={handleFileInputChange}
          files={files}
          onRemoveFile={onRemoveFile}
        />
      </CardContent>
    </Card>
  )
}

function mergeSelectedFiles(
  existingFiles: File[],
  selectedFiles: File[]
): MergeSelectedFilesResult {
  const nextFiles = [...existingFiles]
  let hasDuplicates = false

  selectedFiles.forEach(file => {
    const isDuplicate = nextFiles.some(currentFile => {
      return getFileSignature(currentFile) === getFileSignature(file)
    })

    if (isDuplicate) {
      hasDuplicates = true
      return
    }

    nextFiles.push(file)
  })

  const exceedsLimit = nextFiles.length > MAX_ATTACHMENTS_PER_MESSAGE

  return {
    nextFiles: nextFiles.slice(0, MAX_ATTACHMENTS_PER_MESSAGE),
    hasDuplicates,
    exceedsLimit,
  }
}

function getFileSignature(file: File) {
  return [file.name, file.size, file.lastModified, file.type].join(':')
}

type SupportChatConversationHeaderProps = {
  headerClassName?: string
  backButton?: SupportChatBackButton
  title?: ReactNode
  hasMoreMessages: boolean
  isFetchingMoreMessages: boolean
  onFetchMoreMessages: () => void
}

function SupportChatConversationHeader({
  headerClassName,
  backButton,
  title,
  hasMoreMessages,
  isFetchingMoreMessages,
  onFetchMoreMessages,
}: Readonly<SupportChatConversationHeaderProps>) {
  return (
    <CardHeader className={headerClassName}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <SupportChatBackButtonSlot backButton={backButton} />
          <SupportChatConversationTitle title={title} />
        </div>
        <SupportChatLoadMoreButton
          hasMoreMessages={hasMoreMessages}
          isFetchingMoreMessages={isFetchingMoreMessages}
          onFetchMoreMessages={onFetchMoreMessages}
        />
      </div>
    </CardHeader>
  )
}

function SupportChatBackButtonSlot({
  backButton,
}: Readonly<{
  backButton?: SupportChatBackButton
}>) {
  if (!backButton) {
    return null
  }

  return <SupportChatBackButtonView backButton={backButton} />
}

function SupportChatConversationTitle({
  title,
}: Readonly<{
  title?: ReactNode
}>) {
  if (!title) {
    return null
  }

  return (
    <CardTitle className="text-fluid-base min-w-0 truncate">{title}</CardTitle>
  )
}

function SupportChatLoadMoreButton({
  hasMoreMessages,
  isFetchingMoreMessages,
  onFetchMoreMessages,
}: Readonly<{
  hasMoreMessages: boolean
  isFetchingMoreMessages: boolean
  onFetchMoreMessages: () => void
}>) {
  if (!hasMoreMessages) {
    return null
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={isFetchingMoreMessages}
      onClick={onFetchMoreMessages}
    >
      {isFetchingMoreMessages ? 'Загрузка...' : 'Загрузить историю'}
    </Button>
  )
}

type SupportChatMessagesViewportProps = {
  containerRef: RefObject<HTMLDivElement | null>
  messages: SupportChatMessageItem[]
  isLoadingMessages: boolean
  emptyStateText: string
  editingMessageId: string | null
  editingText: string
  isEditingMessage: boolean
  isDeletingMessage: boolean
  onEditingTextChange: (value: string) => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
  onStartEdit: (messageId: string, text: string | null) => void
  onDelete: (messageId: string) => void
  onRetryFailedMessage?: (message: SupportChatMessageItem) => void
  onCancelFailedMessage?: (message: SupportChatMessageItem) => void
  outgoingSenderType: SupportChatSenderType
}

const SupportChatMessagesViewport = ({
  containerRef,
  messages,
  isLoadingMessages,
  emptyStateText,
  editingMessageId,
  editingText,
  isEditingMessage,
  isDeletingMessage,
  onEditingTextChange,
  onCancelEdit,
  onSubmitEdit,
  onStartEdit,
  onDelete,
  onRetryFailedMessage,
  onCancelFailedMessage,
  outgoingSenderType,
}: Readonly<SupportChatMessagesViewportProps>) => {
  return (
    <div
      ref={containerRef}
      className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto rounded-md border p-3"
    >
      <SupportChatMessagesStatus
        isLoadingMessages={isLoadingMessages}
        messagesCount={messages.length}
        emptyStateText={emptyStateText}
      />

      <div className="space-y-2">
        {messages.map((item, index) => {
          return (
            <SupportChatMessageListItem
              key={item.id}
              item={item}
              previousItem={messages[index - 1]}
              editingMessageId={editingMessageId}
              editingText={editingText}
              isEditingMessage={isEditingMessage}
              isDeletingMessage={isDeletingMessage}
              onEditingTextChange={onEditingTextChange}
              onCancelEdit={onCancelEdit}
              onSubmitEdit={onSubmitEdit}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
              onRetryFailedMessage={onRetryFailedMessage}
              onCancelFailedMessage={onCancelFailedMessage}
              outgoingSenderType={outgoingSenderType}
            />
          )
        })}
      </div>
    </div>
  )
}

type SupportChatMessagesStatusProps = {
  isLoadingMessages: boolean
  messagesCount: number
  emptyStateText: string
}

function SupportChatMessagesStatus({
  isLoadingMessages,
  messagesCount,
  emptyStateText,
}: Readonly<SupportChatMessagesStatusProps>) {
  if (isLoadingMessages) {
    return (
      <p className="text-fluid-sm text-muted-foreground">
        Загрузка сообщений...
      </p>
    )
  }

  if (messagesCount > 0) {
    return null
  }

  return <p className="text-fluid-sm text-muted-foreground">{emptyStateText}</p>
}

type SupportChatMessageListItemProps = {
  item: SupportChatMessageItem
  previousItem?: SupportChatMessageItem
  editingMessageId: string | null
  editingText: string
  isEditingMessage: boolean
  isDeletingMessage: boolean
  onEditingTextChange: (value: string) => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
  onStartEdit: (messageId: string, text: string | null) => void
  onDelete: (messageId: string) => void
  onRetryFailedMessage?: (message: SupportChatMessageItem) => void
  onCancelFailedMessage?: (message: SupportChatMessageItem) => void
  outgoingSenderType: SupportChatSenderType
}

function SupportChatMessageListItem({
  item,
  previousItem,
  editingMessageId,
  editingText,
  isEditingMessage,
  isDeletingMessage,
  onEditingTextChange,
  onCancelEdit,
  onSubmitEdit,
  onStartEdit,
  onDelete,
  onRetryFailedMessage,
  onCancelFailedMessage,
  outgoingSenderType,
}: Readonly<SupportChatMessageListItemProps>) {
  const shouldShowDateBadge =
    !previousItem || !isSameCalendarDate(previousItem.createdAt, item.createdAt)

  return (
    <div>
      <SupportChatDateBadge
        shouldShowDateBadge={shouldShowDateBadge}
        createdAt={item.createdAt}
      />
      <SupportChatMessageBubble
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
        onRetryFailedMessage={onRetryFailedMessage}
        onCancelFailedMessage={onCancelFailedMessage}
        outgoingSenderType={outgoingSenderType}
      />
    </div>
  )
}

function SupportChatDateBadge({
  shouldShowDateBadge,
  createdAt,
}: Readonly<{
  shouldShowDateBadge: boolean
  createdAt: string
}>) {
  if (!shouldShowDateBadge) {
    return null
  }

  return (
    <div className="my-3 flex justify-center">
      <Badge
        variant="secondary"
        className="rounded-full border border-border/70 bg-background/90 px-3 py-0.5 font-medium"
      >
        {formatMessageDate(createdAt)}
      </Badge>
    </div>
  )
}

type SupportChatComposerProps = {
  messageTextareaRef: RefObject<HTMLTextAreaElement | null>
  fileInputRef: RefObject<HTMLInputElement | null>
  fileInputId: string
  message: string
  onMessageChange: (value: string) => void
  placeholder: string
  isSubmitting: boolean
  isSubmitDisabled: boolean
  onSubmit: (event: FormSubmitEvent) => void
  onFileInputChange: (event: InputChangeEvent) => void
  files: File[]
  onRemoveFile: (index: number) => void
}

function SupportChatComposer({
  messageTextareaRef,
  fileInputRef,
  fileInputId,
  message,
  onMessageChange,
  placeholder,
  isSubmitting,
  isSubmitDisabled,
  onSubmit,
  onFileInputChange,
  files,
  onRemoveFile,
}: Readonly<SupportChatComposerProps>) {
  return (
    <form className="shrink-0 space-y-2 border-t pt-3 mb-1" onSubmit={onSubmit}>
      <div className="relative">
        <Textarea
          ref={messageTextareaRef}
          name="message"
          value={message}
          onChange={event => onMessageChange(event.target.value)}
          placeholder={placeholder}
          rows={1}
          className="text-base min-h-10 resize-none px-12 py-2"
        />

        <Input
          ref={fileInputRef}
          id={fileInputId}
          type="file"
          className="hidden"
          multiple
          accept={SUPPORT_CHAT_ATTACHMENT_ACCEPT}
          onChange={onFileInputChange}
        />

        <SupportChatAttachButton
          onClick={() => fileInputRef.current?.click()}
        />
        <SupportChatSubmitButton
          isSubmitting={isSubmitting}
          isSubmitDisabled={isSubmitDisabled}
        />
      </div>

      <SupportChatDraftAttachments files={files} onRemoveFile={onRemoveFile} />
    </form>
  )
}

function SupportChatAttachButton({
  onClick,
}: Readonly<{
  onClick: () => void
}>) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="absolute bottom-1 left-2 h-8 w-8 rounded-full"
      aria-label="Прикрепить файл"
      onClick={onClick}
    >
      <Paperclip className="h-4 w-4" />
    </Button>
  )
}

function SupportChatSubmitButton({
  isSubmitting,
  isSubmitDisabled,
}: Readonly<{
  isSubmitting: boolean
  isSubmitDisabled: boolean
}>) {
  return (
    <Button
      type="submit"
      size="icon"
      className="absolute bottom-1 right-2 h-8 w-8 rounded-full"
      aria-label={isSubmitting ? 'Отправка...' : 'Отправить'}
      disabled={isSubmitDisabled}
    >
      <Send className="h-4 w-4" />
    </Button>
  )
}

function SupportChatDraftAttachments({
  files,
  onRemoveFile,
}: Readonly<{
  files: File[]
  onRemoveFile: (index: number) => void
}>) {
  if (files.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {files.map((file, index) => (
        <Badge key={getFileSignature(file)} className="max-w-40 gap-1 pr-1">
          <span className="block min-w-0 flex-1 truncate">{file.name}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-5 rounded-full text-current hover:bg-black/10"
            aria-label={`Удалить ${file.name}`}
            onClick={() => onRemoveFile(index)}
          >
            <X className="size-3" />
          </Button>
        </Badge>
      ))}
    </div>
  )
}

function SupportChatBackButtonView({
  backButton,
}: Readonly<{
  backButton: SupportChatBackButton
}>) {
  if (backButton.mode === 'link') {
    return (
      <BackButton
        href={backButton.href}
        label={backButton.label}
        variant="ghost"
        size="sm"
        iconOnly={false}
        className={backButton.className ?? 'has-[>svg]:ps-0'}
      />
    )
  }

  return (
    <BackButton
      onClick={backButton.onClick}
      label={backButton.label}
      variant="ghost"
      size="sm"
      iconOnly={false}
      className={backButton.className ?? 'has-[>svg]:ps-0'}
    />
  )
}

type SupportChatMessageBubbleProps = {
  item: SupportChatMessageItem
  editingMessageId: string | null
  editingText: string
  isEditingMessage: boolean
  isDeletingMessage: boolean
  onEditingTextChange: (value: string) => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
  onStartEdit: (messageId: string, text: string | null) => void
  onDelete: (messageId: string) => void
  onRetryFailedMessage?: (message: SupportChatMessageItem) => void
  onCancelFailedMessage?: (message: SupportChatMessageItem) => void
  outgoingSenderType: SupportChatSenderType
}

function SupportChatMessageBubble({
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
  onRetryFailedMessage,
  onCancelFailedMessage,
  outgoingSenderType,
}: Readonly<SupportChatMessageBubbleProps>) {
  const isOutgoing = item.senderType === outgoingSenderType
  const isEditing = editingMessageId === item.id
  const hasText = Boolean(item.text && item.text.trim().length > 0)
  const shouldRenderTextBubble = isEditing || Boolean(item.deletedAt) || hasText
  const hasMessageActions =
    item.status !== 'sending' &&
    item.status !== 'failed' &&
    (item.canEdit || item.canDelete)
  const containerClass = isOutgoing ? 'justify-end' : 'justify-start'
  const bubbleClass = isOutgoing
    ? 'bg-primary text-primary-foreground'
    : 'bg-muted text-foreground'

  return (
    <div className={`min-w-0 flex ${containerClass}`}>
      <div className="relative min-w-0 max-w-[80%]">
        <SupportChatMessageAttachments
          dialogId={item.dialogId}
          attachments={item.attachments}
        />
        {shouldRenderTextBubble ? (
          <div
            className={`text-fluid-sm min-w-0 rounded-2xl px-3 py-2 ${bubbleClass}`}
          >
            <SupportChatMessageBubbleContent
              item={item}
              isEditing={isEditing}
              editingText={editingText}
              isEditingMessage={isEditingMessage}
              onEditingTextChange={onEditingTextChange}
              onCancelEdit={onCancelEdit}
              onSubmitEdit={onSubmitEdit}
            />
            <SupportChatMessageMeta
              item={item}
              isOutgoing={isOutgoing}
              hasMessageActions={hasMessageActions}
              onRetryFailedMessage={onRetryFailedMessage}
              onCancelFailedMessage={onCancelFailedMessage}
            />
          </div>
        ) : (
          <div className="flex justify-end">
            <SupportChatMessageMeta
              item={item}
              isOutgoing={isOutgoing}
              hasMessageActions={hasMessageActions}
              onRetryFailedMessage={onRetryFailedMessage}
              onCancelFailedMessage={onCancelFailedMessage}
            />
          </div>
        )}
        {hasMessageActions ? (
          <div className="absolute bottom-0 right-0">
            <SupportChatMessageActions
              item={item}
              isDeletingMessage={isDeletingMessage}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

type SupportChatMessageBubbleContentProps = {
  item: SupportChatMessageItem
  isEditing: boolean
  editingText: string
  isEditingMessage: boolean
  onEditingTextChange: (value: string) => void
  onCancelEdit: () => void
  onSubmitEdit: () => void
}

function SupportChatMessageBubbleContent({
  item,
  isEditing,
  editingText,
  isEditingMessage,
  onEditingTextChange,
  onCancelEdit,
  onSubmitEdit,
}: Readonly<SupportChatMessageBubbleContentProps>) {
  if (item.deletedAt) {
    return <p className="italic opacity-80">Сообщение удалено</p>
  }

  return (
    <>
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
              className="text-foreground"
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
        <p className="whitespace-pre-wrap wrap-break-word">{item.text}</p>
      ) : null}
    </>
  )
}

type SupportChatMessageMetaProps = {
  item: SupportChatMessageItem
  isOutgoing: boolean
  hasMessageActions: boolean
  onRetryFailedMessage?: (message: SupportChatMessageItem) => void
  onCancelFailedMessage?: (message: SupportChatMessageItem) => void
}

function SupportChatMessageMeta({
  item,
  isOutgoing,
  hasMessageActions,
  onRetryFailedMessage,
  onCancelFailedMessage,
}: Readonly<SupportChatMessageMetaProps>) {
  const metaText = formatMessageTime(item.editedAt ?? item.createdAt)
  const shouldShowReadIcon =
    isOutgoing &&
    item.status !== 'sending' &&
    item.status !== 'failed' &&
    isReadByCounterparty(item)

  return (
    <div
      className={`relative flex items-end justify-end gap-1 ${
        hasMessageActions ? 'pr-2' : ''
      }`}
    >
      <div className="flex items-center gap-1 text-[11px] leading-none opacity-75">
        <p className="italic">{metaText}</p>
        {item.status === 'sending' ? (
          <Clock className="h-4 w-4 opacity-80" />
        ) : null}
        {item.status === 'failed' ? (
          <AlertCircle className="h-4 w-4 text-black" />
        ) : null}
        {shouldShowReadIcon ? (
          <CheckCheck className="h-3 w-3 opacity-80" />
        ) : null}
      </div>
      {item.status === 'failed' ? (
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="h-6 px-2 text-[11px]"
            onClick={() => onRetryFailedMessage?.(item)}
          >
            Повторить
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-[11px]"
            onClick={() => onCancelFailedMessage?.(item)}
          >
            Отмена
          </Button>
        </div>
      ) : null}
    </div>
  )
}

type SupportChatMessageActionsProps = {
  item: Pick<
    SupportChatMessageItem,
    'id' | 'text' | 'canEdit' | 'canDelete' | 'status'
  >
  isDeletingMessage: boolean
  onStartEdit: (messageId: string, text: string | null) => void
  onDelete: (messageId: string) => void
}

function SupportChatMessageActions({
  item,
  isDeletingMessage,
  onStartEdit,
  onDelete,
}: Readonly<SupportChatMessageActionsProps>) {
  if (item.status === 'sending' || item.status === 'failed') {
    return null
  }

  if (!item.canEdit && !item.canDelete) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5 text-black">
          <EllipsisVertical className="h-3 w-3" />
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

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

function isSameCalendarDate(left: string, right: string) {
  const leftDate = new Date(left)
  const rightDate = new Date(right)

  return (
    leftDate.getFullYear() === rightDate.getFullYear() &&
    leftDate.getMonth() === rightDate.getMonth() &&
    leftDate.getDate() === rightDate.getDate()
  )
}

function formatMessageDate(value: string) {
  return dateFormatter.format(new Date(value))
}

function formatMessageTime(value: string) {
  return timeFormatter.format(new Date(value))
}

function isReadByCounterparty(item: SupportChatMessageItem) {
  if (item.deletedAt) {
    return false
  }

  return !item.canEdit && !item.canDelete
}
