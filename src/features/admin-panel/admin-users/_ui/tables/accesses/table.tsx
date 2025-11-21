'use client'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { addDays } from 'date-fns'
import { type DateRange } from 'react-day-picker'
import type { AdminUserAccess } from '../../../_domain/user-detail'
import { Card, CardContent } from '@/shared/ui/card'
import { AdminDataTable } from '@/features/admin-panel/ui/data-table'
import { accessColumns } from './columns'
import { AccessesTableContext } from './context'
import { adminUsersApi } from '../../../_api'
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

const createDialogOpenChangeHandler =
  (onClose: () => void, isSubmitting: boolean) => (next: boolean) => {
    if (!next && !isSubmitting) {
      onClose()
    }
  }

export function AccessesTable({
  data,
  userId,
  canEditAccess,
}: AccessesTableProps) {
  const utils = adminUsersApi.useUtils()
  const [extendTarget, setExtendTarget] = useState<
    { id: string; expiresAt: string | null } | undefined
  >(undefined)
  const [freezeTarget, setFreezeTarget] = useState<
    { id: string; expiresAt: string | null } | undefined
  >(undefined)
  const [unfreezeTarget, setUnfreezeTarget] = useState<
    { accessId: string; freezeId: string } | undefined
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
  const freezeMutation = adminUsersApi.admin.user.access.freeze.useMutation({
    onSuccess: () => {
      toast.success('Заморозка активирована')
      setFreezeTarget(undefined)
      utils.admin.user.detail.invalidate({ userId }).catch(() => undefined)
    },
    onError: error => {
      toast.error(error.message ?? 'Не удалось заморозить доступ')
    },
  })
  const unfreezeMutation =
    adminUsersApi.admin.user.access.freezeCancel.useMutation({
      onSuccess: () => {
        toast.success('Заморозка отменена')
        setUnfreezeTarget(undefined)
        utils.admin.user.detail.invalidate({ userId }).catch(() => undefined)
      },
      onError: error => {
        toast.error(error.message ?? 'Не удалось отменить заморозку')
      },
    })

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
      onFreeze: (access: { id: string; expiresAt: string | null }) => {
        if (!canEditAccess) {
          return
        }
        setFreezeTarget(access)
      },
      onUnfreeze: (freeze: { accessId: string; freezeId: string }) => {
        if (!canEditAccess) {
          return
        }
        setUnfreezeTarget(freeze)
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
      <FreezeDialog
        target={freezeTarget}
        onClose={() => setFreezeTarget(undefined)}
        isSubmitting={freezeMutation.status === 'pending'}
        onSubmit={(start, end) => {
          if (!freezeTarget) return
          freezeMutation.mutate({
            accessId: freezeTarget.id,
            start: start.toISOString(),
            end: end.toISOString(),
          })
        }}
      />
      <UnfreezeDialog
        target={unfreezeTarget}
        onClose={() => setUnfreezeTarget(undefined)}
        isSubmitting={unfreezeMutation.status === 'pending'}
        onSubmit={() => {
          if (!unfreezeTarget) return
          unfreezeMutation.mutate({
            accessId: unfreezeTarget.accessId,
            freezeId: unfreezeTarget.freezeId,
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

  const handleOpenChange = createDialogOpenChangeHandler(onClose, isSubmitting)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
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
              defaultMonth={dateValue ?? undefined}
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

type FreezeDialogProps = {
  target?: { id: string; expiresAt: string | null }
  onClose(): void
  isSubmitting: boolean
  onSubmit(start: Date, end: Date): void
}

function FreezeDialog({
  target,
  onClose,
  isSubmitting,
  onSubmit,
}: Readonly<FreezeDialogProps>) {
  const open = Boolean(target)

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)

  useEffect(() => {
    if (target) {
      const today = new Date()
      setDateRange({ from: today, to: addDays(today, 6) })
    } else {
      setDateRange({ from: undefined, to: undefined })
    }
  }, [target])

  const handleOpenChange = createDialogOpenChangeHandler(onClose, isSubmitting)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!target || !dateRange?.from || !dateRange.to) {
      return
    }
    const expiresAt = target.expiresAt ? new Date(target.expiresAt) : null
    if (expiresAt && dateRange.from >= expiresAt) {
      toast.error('Дата начала заморозки должна быть раньше окончания доступа')
      return
    }
    onSubmit(dateRange.from, dateRange.to)
  }

  const disabledBeforeToday = (date: Date) =>
    date < new Date(new Date().setHours(0, 0, 0, 0))

  const expiresAtDate = target?.expiresAt ? new Date(target.expiresAt) : null

  const disabledDate = (date: Date) =>
    disabledBeforeToday(date) ||
    Boolean(expiresAtDate && (dateRange?.from ? false : date >= expiresAtDate))

  const handleRangeSelect = (nextRange?: DateRange) => {
    if (!nextRange) {
      setDateRange(undefined)
      return
    }

    const { from } = nextRange
    if (!from) {
      setDateRange(undefined)
      return
    }

    if (expiresAtDate && from >= expiresAtDate) {
      return
    }

    setDateRange(nextRange)
  }

  let freezeDaysLabel = ''
  if (dateRange?.from && dateRange.to) {
    const days =
      Math.floor(
        (dateRange.to.getTime() - dateRange.from.getTime()) / 86_400_000
      ) + 1
    freezeDaysLabel =
      `${days} дн.` +
      (expiresAtDate ? `, доступ до ${expiresAtDate.toLocaleDateString()}` : '')
  } else if (expiresAtDate) {
    freezeDaysLabel = `Доступ до ${expiresAtDate.toLocaleDateString()}`
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-full sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Активировать заморозку</DialogTitle>
          <DialogDescription>
            Выберите период, когда доступ будет приостановлен.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Calendar
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={handleRangeSelect}
              disabled={disabledDate}
              numberOfMonths={
                globalThis?.window && window.innerWidth < 640 ? 1 : 2
              }
              className="w-full max-w-full rounded-lg border shadow-sm"
            />
            {freezeDaysLabel && (
              <div className="text-xs text-muted-foreground">
                {freezeDaysLabel}
              </div>
            )}
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
            <Button
              type="submit"
              disabled={isSubmitting || !dateRange?.from || !dateRange.to}
            >
              {isSubmitting && <Spinner className="mr-2 size-3" />} Заморозить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type UnfreezeDialogProps = {
  target?: { accessId: string; freezeId: string }
  onClose(): void
  isSubmitting: boolean
  onSubmit(): void
}

function UnfreezeDialog({
  target,
  onClose,
  isSubmitting,
  onSubmit,
}: Readonly<UnfreezeDialogProps>) {
  const open = Boolean(target)
  const handleOpenChange = createDialogOpenChangeHandler(onClose, isSubmitting)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Отменить заморозку</DialogTitle>
          <DialogDescription>
            Заморозка будет удалена. Продление доступа не будет откатываться.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => !isSubmitting && onClose()}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button type="button" variant="destructive" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting && <Spinner className="mr-2 size-3" />} Удалить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
