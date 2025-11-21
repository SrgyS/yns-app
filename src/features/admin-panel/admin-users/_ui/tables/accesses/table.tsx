'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AdminUserAccess } from '../../../_domain/user-detail'
import { Card, CardContent } from '@/shared/ui/card'
import { AdminDataTable } from '@/features/admin-panel/ui/data-table'
import { accessColumns } from './columns'
import { AccessesTableContext } from './context'
import { adminUsersApi } from '../../../_api'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Label } from '@/shared/ui/label'
import { Button } from '@/shared/ui/button'
import { Spinner } from '@/shared/ui/spinner'
import { Calendar } from '@/shared/ui/calendar'

type AccessesTableProps = Readonly<{
  data: AdminUserAccess[]
  userId: string
  canEditAccess: boolean
}>

export function AccessesTable({
  data,
  userId,
  canEditAccess,
}: AccessesTableProps) {
  const utils = adminUsersApi.useUtils()
  const [extendTarget, setExtendTarget] = useState<
    { id: string; expiresAt: string | null } | undefined
  >(undefined)
  const closeMutation = adminUsersApi.admin.user.access.close.useMutation({
    onSuccess: () => {
      toast.success('Доступ закрыт')
      utils.admin.user.detail.invalidate({ userId }).catch(() => undefined)
    },
    onError: () => {
      toast.error('Не удалось закрыть доступ. Попробуйте ещё раз.')
    },
  })
  const extendMutation = adminUsersApi.admin.user.access.extend.useMutation({
    onSuccess: () => {
      toast.success('Доступ обновлён')
      setExtendTarget(undefined)
      utils.admin.user.detail.invalidate({ userId }).catch(() => undefined)
    },
    onError: error => {
      toast.error(error.message ?? 'Не удалось обновить доступ')
    },
  })

  const { status, variables, mutate } = closeMutation

  const contextValue = useMemo(
    () => ({
      canEditAccess,
      isClosing: status === 'pending',
      closingAccessId: status === 'pending' ? variables?.accessId : undefined,
      userId,
      onClose: (accessId: string) => {
        if (!canEditAccess) {
          return
        }
        mutate({ accessId })
      },
      onExtend: (access: { id: string; expiresAt: string | null }) => {
        if (!canEditAccess) {
          return
        }
        setExtendTarget(access)
      },
    }),
    [canEditAccess, status, variables?.accessId, mutate, userId]
  )

  return (
    <AccessesTableContext.Provider value={contextValue}>
      <AdminDataTable
        columns={accessColumns}
        data={data}
        emptyPlaceholder={
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Доступы не найдены
            </CardContent>
          </Card>
        }
      />
      <ExtendAccessDialog
        target={extendTarget}
        onClose={() => setExtendTarget(undefined)}
        isSubmitting={extendMutation.status === 'pending'}
        onSubmit={value => {
          if (!extendTarget) return
          extendMutation.mutate({
            accessId: extendTarget.id,
            expiresAt: value.toISOString(),
          })
        }}
      />
    </AccessesTableContext.Provider>
  )
}

type ExtendDialogProps = {
  target?: { id: string; expiresAt: string | null }
  onClose(): void
  isSubmitting: boolean
  onSubmit(value: Date): void
}

function ExtendAccessDialog({
  target,
  onClose,
  isSubmitting,
  onSubmit,
}: Readonly<ExtendDialogProps>) {
  const open = Boolean(target)
  const [dateValue, setDateValue] = useState<Date | undefined>(undefined)

  useEffect(() => {
    if (target?.expiresAt) {
      setDateValue(new Date(target.expiresAt))
    } else {
      setDateValue(undefined)
    }
  }, [target])

  const handleOpenChange = (next: boolean) => {
    if (!next && !isSubmitting) {
      onClose()
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!target || !dateValue) {
      return
    }
    onSubmit(dateValue)
  }

  const disabledDate = (date: Date) =>
    date < new Date(new Date().setHours(0, 0, 0, 0))

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={day => day && setDateValue(day)}
              disabled={disabledDate}
              className="rounded-md border shadow-sm"
              captionLayout="dropdown-months"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => !isSubmitting && onClose()}
              disabled={isSubmitting}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting || !dateValue}>
              {isSubmitting && <Spinner className="mr-2 size-3" />} Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
