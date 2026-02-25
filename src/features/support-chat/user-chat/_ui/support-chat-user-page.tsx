'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Paperclip, Send, MessagesSquare } from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
import {
  isIncomingSupportMessageForUser,
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

export function SupportChatUserPage() {
  const { dialogs, hasNextPage, fetchNextPage, isFetchingNextPage } = useUserDialogs()
  const [selectedDialogId, setSelectedDialogId] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const lastMarkedMessageIdRef = useRef<string | null>(null)

  const {
    createDialog,
    sendMessage,
    markDialogRead,
    isCreatingDialog,
    isSendingMessage,
    isMarkingRead,
  } = useSupportChatActions()

  const {
    messages,
    hasNextPage: hasMoreMessages,
    fetchNextPage: fetchMoreMessages,
    isFetchingNextPage: isFetchingMoreMessages,
  } = useDialogMessages(selectedDialogId)
  const latestMessageId = messages[messages.length - 1]?.id

  useSupportChatSse(selectedDialogId)

  useEffect(() => {
    if (selectedDialogId) {
      return
    }

    const firstDialogId = dialogs[0]?.dialogId
    if (firstDialogId) {
      setSelectedDialogId(firstDialogId)
    }
  }, [dialogs, selectedDialogId])

  useEffect(() => {
    if (!messages.length) {
      return
    }

    const latestMessage = messages[messages.length - 1]
    if (!latestMessage) {
      return
    }

    const isIncoming = isIncomingSupportMessageForUser(latestMessage.senderType)
    if (!isIncoming || !selectedDialogId) {
      return
    }

    if (lastMarkedMessageIdRef.current === latestMessage.id) {
      return
    }

    lastMarkedMessageIdRef.current = latestMessage.id
    markDialogRead({
      dialogId: selectedDialogId,
      lastReadMessageId: latestMessage.id,
    }).catch(() => {
      lastMarkedMessageIdRef.current = null
    })
  }, [markDialogRead, messages, selectedDialogId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [latestMessageId])

  const selectedDialog = useMemo(
    () => dialogs.find(dialog => dialog.dialogId === selectedDialogId),
    [dialogs, selectedDialogId]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedText = message.trim()
    const hasText = trimmedText.length > 0
    const hasFiles = files.length > 0

    if (!hasText && !hasFiles) {
      toast.error('Введите сообщение или добавьте вложение')
      return
    }

    try {
      const attachments = await toAttachments(files)

      if (selectedDialogId) {
        await sendMessage({
          dialogId: selectedDialogId,
          text: hasText ? trimmedText : undefined,
          attachments,
        })
      } else {
        const created = await createDialog({
          initialMessage: hasText ? trimmedText : 'Вложение без текста',
          attachments,
        })
        setSelectedDialogId(created.dialogId)
      }

      setMessage('')
      setFiles([])
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Не удалось отправить сообщение'
      toast.error(errorMessage)
    }
  }

  const selectDialog = (dialogId: string) => {
    setSelectedDialogId(dialogId)
    lastMarkedMessageIdRef.current = null
  }

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
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

          {dialogs.map(dialog => {
            const isActive = dialog.dialogId === selectedDialogId

            return (
              <button
                key={dialog.dialogId}
                type="button"
                className={`w-full rounded-md border px-3 py-2 text-left transition ${
                  isActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => selectDialog(dialog.dialogId)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Диалог</span>
                  {dialog.unreadCount > 0 ? (
                    <Badge>{dialog.unreadCount}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {dialog.lastMessagePreview ?? 'Нет сообщений'}
                </p>
              </button>
            )
          })}
        </CardContent>
      </Card>

      <Card className="h-[75vh]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg">{selectedDialog ? 'Переписка' : 'Новый диалог'}</CardTitle>
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
          <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Сообщений пока нет. Напишите в поддержку.
              </p>
            ) : null}

            <div className="space-y-2">
              {messages.map(item => {
                const isOutgoing = item.senderType === 'USER'

                return (
                  <div
                    key={item.id}
                    className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                        isOutgoing
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}
                    >
                      {item.text ? <p className="whitespace-pre-wrap">{item.text}</p> : null}
                      {Array.isArray(item.attachments) && item.attachments.length > 0 ? (
                        <div className="mt-2 space-y-1 text-xs opacity-90">
                          {item.attachments.map((attachment: any, index: number) => (
                            <p key={`${item.id}-${index}`}>📎 {attachment.name ?? 'Вложение'}</p>
                          ))}
                        </div>
                      ) : null}
                      <p className="mt-1 text-[10px] opacity-75">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div ref={messagesEndRef} />
          </div>

          <form className="space-y-2" onSubmit={handleSubmit}>
            <Textarea
              value={message}
              onChange={event => setMessage(event.target.value)}
              placeholder="Введите сообщение"
              rows={3}
            />

            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted">
                <Paperclip className="h-4 w-4" />
                Вложить файл
                <Input
                  type="file"
                  className="hidden"
                  multiple
                  onChange={event => {
                    const fileList = Array.from(event.target.files ?? [])
                    setFiles(fileList)
                  }}
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
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                disabled={isMarkingRead}
              >
                К последнему
              </Button>
              <Button type="submit" disabled={isSendingMessage || isCreatingDialog}>
                <Send className="mr-2 h-4 w-4" />
                {isSendingMessage || isCreatingDialog ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
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
