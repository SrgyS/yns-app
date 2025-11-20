'use client'

import { useEffect, useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { format } from 'date-fns'
import { toast } from 'sonner'
import type { AdminUserAccess } from '../../../_domain/user-detail'
import { formatDate } from '../../utils/format-date'
import { useAccessesTableContext } from './context'
import { adminUsersApi } from '../../../_api'

const REASON_LABELS: Record<string, string> = {
  paid: 'Куплен',
  free: 'Бесплатно',
  manual: 'Выдан вручную',
}

export const accessColumns: ColumnDef<AdminUserAccess>[] = [
  {
    accessorKey: 'courseTitle',
    header: 'Курс',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-wrap">{row.original.courseTitle}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.contentType === 'SUBSCRIPTION'
            ? 'Подписка'
            : 'Фиксированный курс'}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'period',
    header: 'Период',
    cell: ({ row }) => {
      const isActive = row.original.isActive
      const start = row.original.startsAt
      const end = row.original.expiresAt
      const periodText = end
        ? `с ${formatDate(start)} по ${formatDate(end)}`
        : `с ${formatDate(start)} бессрочно`
      return (
        <div>
          <Badge variant={isActive ? 'secondary' : 'outline'}>
            {isActive ? 'Активен' : 'Завершён'}
          </Badge>
          <div className="mt-1 text-xs text-muted-foreground text-wrap">
            {periodText}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'reason',
    header: 'Причина',
    cell: ({ row }) => (
      <span className="text-wrap">
        {REASON_LABELS[row.original.reason] ?? row.original.reason}
      </span>
    ),
  },
  {
    accessorKey: 'admin',
    header: 'Выдал',
    cell: ({ row }) => {
      const name = row.original.adminName ?? row.original.adminEmail
      return name ? <span className="text-wrap">{name}</span> : '—'
    },
  },
  {
    accessorKey: 'closedBy',
    header: 'Закрыл',
    cell: ({ row }) => {
      if (!row.original.closedAt) {
        return '—'
      }

      return (
        <>
          <div className="text-sm font-medium">
            {row.original.closedByName ?? '—'}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDate(row.original.closedAt)}
          </div>
        </>
      )
    },
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }) => <AccessActionsCell access={row.original} />,
  },
]

function AccessActionsCell({ access }: Readonly<{ access: AdminUserAccess }>) {
  const { canEditAccess, onClose, isClosing, closingAccessId } =
    useAccessesTableContext()

  const isActive = access.isActive
  const isClosingCurrent = isClosing && closingAccessId === access.id
  const canClose = canEditAccess && isActive && !isClosingCurrent

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      <ExtendAccessDialog access={access} />
      <Button variant="outline" size="sm" disabled>
        Изменить период
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={!canClose}
        className="hover:bg-destructive/80"
        onClick={() => onClose(access.id)}
      >
        {isClosingCurrent && <Spinner className="mr-2 size-2" />} Закрыть
      </Button>
    </div>
  )
}

function ExtendAccessDialog({ access }: Readonly<{ access: AdminUserAccess }>) {
  const { canEditAccess, userId } = useAccessesTableContext()
  const [open, setOpen] = useState(false)
  const [dateValue, setDateValue] = useState('')
  const utils = adminUsersApi.useUtils()

  const extendMutation = adminUsersApi.admin.user.access.extend.useMutation({
    onSuccess: () => {
      toast.success('Доступ продлён')
      setOpen(false)
      utils.admin.user.detail.invalidate({ userId }).catch(() => undefined)
    },
    onError: error => {
      toast.error(error.message ?? 'Не удалось продлить доступ')
    },
  })

  useEffect(() => {
    if (open) {
      setDateValue(
        access.expiresAt ? format(new Date(access.expiresAt), 'yyyy-MM-dd') : ''
      )
    }
  }, [open, access.expiresAt])

  const handleOpenChange = (next: boolean) => {
    if (extendMutation.status === 'pending') {
      return
    }
    setOpen(next)
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!dateValue) {
      toast.error('Выберите дату окончания доступа')
      return
    }
    extendMutation.mutate({
      accessId: access.id,
      expiresAt: new Date(dateValue).toISOString(),
    })
  }

  const isSubmitting = extendMutation.status === 'pending'
  const minDate = format(new Date(), 'yyyy-MM-dd')

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={!canEditAccess}>
          Продлить
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Продлить доступ</DialogTitle>
          <DialogDescription>
            Укажите новую дату окончания доступа для пользователя.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Доступ действует до</Label>
            <Input
              type="date"
              value={dateValue}
              min={minDate}
              onChange={event => setDateValue(event.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting || !dateValue}>
              {isSubmitting && <Spinner className="mr-2 size-3" />} Продлить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
