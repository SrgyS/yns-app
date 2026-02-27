'use client'

import Link from 'next/link'
import { useEffect, useRef, type ComponentProps } from 'react'
import {
  ArrowLeft,
  CheckCheck,
  EllipsisVertical,
  Paperclip,
  Pencil,
  Send,
  Trash2,
} from 'lucide-react'

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
import { SupportChatMessageAttachments } from './support-chat-message-attachments'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip'

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0]
type InputChangeEvent = Parameters<
  NonNullable<ComponentProps<'input'>['onChange']>
>[0]

type SupportChatMessageItem = {
  id: string
  dialogId: string
  senderType: string
  text: string | null
  attachments?: unknown
  editedAt: string | null
  deletedAt: string | null
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
  title?: string
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
  message: string
  onMessageChange: (value: string) => void
  onFilesChange: (files: File[]) => void
  files: File[]
  onSubmit: (event: FormSubmitEvent) => void
  isSubmitting: boolean
  isSubmitDisabled: boolean
  outgoingSenderType: SupportChatSenderType
  placeholder?: string
  fileInputId: string
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
  message,
  onMessageChange,
  onFilesChange,
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
    const fileList = Array.from(event.target.files ?? [])
    onFilesChange(fileList)
  }

  return (
    <Card className={cardClassName}>
      <CardHeader className={headerClassName}>
        <div className="flex items-center justify-between gap-2">
          {backButton ? (
            <SupportChatBackButtonView backButton={backButton} />
          ) : (
            <div />
          )}
          {hasMoreMessages ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isFetchingMoreMessages}
              onClick={onFetchMoreMessages}
            >
              {isFetchingMoreMessages ? 'Загрузка...' : 'Загрузить историю'}
            </Button>
          ) : null}
        </div>
        {title ? (
          <CardTitle className="text-fluid-base">{title}</CardTitle>
        ) : null}
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-2">
        <div
          ref={messagesContainerRef}
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto rounded-md border p-3"
        >
          {isLoadingMessages ? (
            <p className="text-fluid-sm text-muted-foreground">
              Загрузка сообщений...
            </p>
          ) : null}
          {!isLoadingMessages && messages.length === 0 ? (
            <p className="text-fluid-sm text-muted-foreground">
              {emptyStateText}
            </p>
          ) : null}

          <div className="space-y-2">
            {messages.map((item, index) => {
              const previousItem = messages[index - 1]
              const showDateBadge =
                !previousItem ||
                !isSameCalendarDate(previousItem.createdAt, item.createdAt)

              return (
                <div key={item.id}>
                  {showDateBadge ? (
                    <div className="my-3 flex justify-center">
                      <Badge
                        variant="secondary"
                        className="rounded-full border border-border/70 bg-background/90 px-3 py-0.5 font-medium"
                      >
                        {formatMessageDate(item.createdAt)}
                      </Badge>
                    </div>
                  ) : null}
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
                    outgoingSenderType={outgoingSenderType}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <form className="shrink-0 space-y-2 border-t pt-3" onSubmit={onSubmit}>
          <div className="relative">
            <Textarea
              ref={messageTextareaRef}
              name="message"
              value={message}
              onChange={event => onMessageChange(event.target.value)}
              placeholder={placeholder}
              rows={1}
              className="text-fluid-sm min-h-10 resize-none px-12 py-2"
            />

            <Input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileInputChange}
            />

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute bottom-1 left-2 h-8 w-8 rounded-full"
                    aria-label="Прикрепить файл"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Прикрепить файл</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute bottom-1 right-2 h-8 w-8 rounded-full"
                    aria-label={isSubmitting ? 'Отправка...' : 'Отправить'}
                    disabled={isSubmitDisabled}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isSubmitting ? 'Отправка...' : 'Отправить'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {files.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              {files.map(file => (
                <Badge key={file.name} className="max-w-full truncate">
                  {file.name}
                </Badge>
              ))}
            </div>
          ) : null}
        </form>
      </CardContent>
    </Card>
  )
}

function SupportChatBackButtonView({
  backButton,
}: Readonly<{
  backButton: SupportChatBackButton
}>) {
  if (backButton.mode === 'link') {
    return (
      <Button
        variant="ghost"
        size="sm"
        className={backButton.className ?? 'has-[>svg]:ps-0'}
        asChild
      >
        <Link href={backButton.href}>
          <ArrowLeft className="mr-1 h-4 w-4" />
          {backButton.label}
        </Link>
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={backButton.className ?? 'has-[>svg]:ps-0'}
      onClick={backButton.onClick}
    >
      <ArrowLeft className="mr-1 h-4 w-4" />
      {backButton.label}
    </Button>
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
  outgoingSenderType,
}: Readonly<SupportChatMessageBubbleProps>) {
  const isOutgoing = item.senderType === outgoingSenderType
  const isEditing = editingMessageId === item.id
  const hasText = Boolean(item.text && item.text.trim().length > 0)
  const shouldRenderTextBubble = isEditing || Boolean(item.deletedAt) || hasText
  const containerClass = isOutgoing ? 'justify-end' : 'justify-start'
  const bubbleClass = isOutgoing
    ? 'bg-primary text-primary-foreground'
    : 'bg-muted text-foreground'

  return (
    <div className={`min-w-0 flex ${containerClass}`}>
      <div className="min-w-0 max-w-[80%]">
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
              isDeletingMessage={isDeletingMessage}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
            />
          </div>
        ) : (
          <div className="mt-1 flex justify-end">
            <SupportChatMessageMeta
              item={item}
              isOutgoing={isOutgoing}
              isDeletingMessage={isDeletingMessage}
              onStartEdit={onStartEdit}
              onDelete={onDelete}
            />
          </div>
        )}
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
        <p className="whitespace-pre-wrap break-words">{item.text}</p>
      ) : null}
    </>
  )
}

type SupportChatMessageMetaProps = {
  item: SupportChatMessageItem
  isOutgoing: boolean
  isDeletingMessage: boolean
  onStartEdit: (messageId: string, text: string | null) => void
  onDelete: (messageId: string) => void
}

function SupportChatMessageMeta({
  item,
  isOutgoing,
  isDeletingMessage,
  onStartEdit,
  onDelete,
}: Readonly<SupportChatMessageMetaProps>) {
  const metaText = item.editedAt
    ? `изменено ${formatMessageTime(item.editedAt)}`
    : formatMessageTime(item.createdAt)

  return (
    <div className="mt-1 flex items-end justify-end gap-1">
      <div className="flex items-center gap-1 text-[11px] leading-none opacity-75">
        <p className={item.editedAt ? 'italic' : ''}>{metaText}</p>
        {isOutgoing && isReadByCounterparty(item) ? (
          <CheckCheck className="h-3 w-3 opacity-80" />
        ) : null}
      </div>
      <SupportChatMessageActions
        item={item}
        isDeletingMessage={isDeletingMessage}
        onStartEdit={onStartEdit}
        onDelete={onDelete}
      />
    </div>
  )
}

type SupportChatMessageActionsProps = {
  item: Pick<SupportChatMessageItem, 'id' | 'text' | 'canEdit' | 'canDelete'>
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
  if (!item.canEdit && !item.canDelete) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5">
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
