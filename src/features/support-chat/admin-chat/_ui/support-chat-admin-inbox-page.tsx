'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Paperclip, Send, MessageSquareWarning } from 'lucide-react'
import { toast } from 'sonner'

import { useAdminAbility } from '@/features/admin-panel/users/_hooks/use-admin-ability'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'
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

export function SupportChatAdminInboxPage() {
  const abilityQuery = useAdminAbility()
  const ability = abilityQuery.data

  const canAccessSupportChat = ability?.canManageSupportChats
  const [onlyUnanswered, setOnlyUnanswered] = useState(false)
  const [selectedDialogId, setSelectedDialogId] = useState<string | undefined>()
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])

  const dialogsQuery = useStaffDialogs(onlyUnanswered ? true : undefined)
  const dialogs = dialogsQuery.dialogs

  const messagesQuery = useStaffDialogMessages(selectedDialogId)
  const messages = messagesQuery.messages

  const {
    sendMessage,
    markDialogRead,
    isSendingMessage,
    isMarkingRead,
  } = useSupportChatActions()

  useSupportChatStaffSse(selectedDialogId)

  const lastMarkedMessageIdRef = useRef<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

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
  }, [markDialogRead, messages, selectedDialogId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectedDialog = useMemo(
    () => dialogs.find(dialog => dialog.dialogId === selectedDialogId),
    [dialogs, selectedDialogId]
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedDialogId) {
      toast.error('Выберите диалог для ответа')
      return
    }

    const trimmedText = message.trim()
    const hasText = trimmedText.length > 0
    const hasFiles = files.length > 0

    if (!hasText && !hasFiles) {
      toast.error('Введите ответ или добавьте вложение')
      return
    }

    try {
      const attachments = await toAttachments(files)

      await sendMessage({
        dialogId: selectedDialogId,
        text: hasText ? trimmedText : undefined,
        attachments,
      })

      setMessage('')
      setFiles([])
    } catch (error) {
      const errorMessage = resolveSupportChatClientErrorMessage(
        error,
        'Не удалось отправить ответ'
      )
      toast.error(errorMessage)
    }
  }

  const handleSelectDialog = (dialogId: string) => {
    setSelectedDialogId(dialogId)
    lastMarkedMessageIdRef.current = null
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
      <Card className="h-[78vh]">
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
              onClick={() => setOnlyUnanswered(prev => !prev)}
            >
              Только неотвеченные
            </Button>

            {dialogsQuery.hasNextPage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={dialogsQuery.isFetchingNextPage}
                onClick={() => dialogsQuery.fetchNextPage()}
              >
                {dialogsQuery.isFetchingNextPage ? 'Загрузка...' : 'Еще'}
              </Button>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-2 overflow-y-auto">
          {dialogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Диалогов нет для выбранного фильтра.
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
                onClick={() => handleSelectDialog(dialog.dialogId)}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {dialog.user.name ?? dialog.user.id}
                  </span>
                  {dialog.unreadCount > 0 ? <Badge>{dialog.unreadCount}</Badge> : null}
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
          })}
        </CardContent>
      </Card>

      <Card className="h-[78vh]">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg">
            {selectedDialog ? `Диалог: ${selectedDialog.user.name ?? selectedDialog.user.id}` : 'Выберите диалог'}
          </CardTitle>

          {selectedDialog && messagesQuery.hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={messagesQuery.isFetchingNextPage}
              onClick={() => messagesQuery.fetchNextPage()}
            >
              {messagesQuery.isFetchingNextPage ? 'Загрузка...' : 'Загрузить историю'}
            </Button>
          ) : null}
        </CardHeader>

        <CardContent className="flex h-full flex-col gap-3">
          <div className="min-h-0 flex-1 overflow-y-auto rounded-md border p-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Нет сообщений в диалоге.</p>
            ) : null}

            <div className="space-y-2">
              {messages.map(item => {
                const isOutgoing = item.senderType !== 'USER'

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
                      <SupportChatMessageAttachments
                        dialogId={item.dialogId}
                        attachments={item.attachments}
                      />
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
              placeholder="Ответить пользователю"
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
              <Button type="submit" disabled={isSendingMessage}>
                <Send className="mr-2 h-4 w-4" />
                {isSendingMessage ? 'Отправка...' : 'Отправить'}
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
