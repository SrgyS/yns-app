'use client'

import { useEffect, useMemo, useState, type ComponentProps } from 'react'
import { toast } from 'sonner'
import { addDays, endOfDay, startOfDay } from 'date-fns'
import { type DateRange } from 'react-day-picker'
import { useAdminUserDetail } from '../_hooks/use-admin-user-detail'
import { useAdminAbility } from '../_hooks/use-admin-ability'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Button } from '@/shared/ui/button'
import { AccessesTable } from './tables/accesses'
import { PaymentsTable } from './tables/payments'
import { GrantAccessDialog } from './grant-access-dialog'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FullPageSpinner } from '@/shared/ui/full-page-spinner'
import { AdminUserProfile } from './admin-user-profile'
import { ActivityTable } from './tables/activity'
import { adminUsersApi } from '../_api'
import { FreezeHistoryTable } from './tables/freezes'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Calendar } from '@/shared/ui/calendar'
import { Label } from '@/shared/ui/label'
import { Spinner } from '@/shared/ui/spinner'
import { Card, CardContent, CardFooter } from '@/shared/ui/card'

export function AdminUserDetailPage({ userId }: Readonly<{ userId: string }>) {
  const { data, isLoading } = useAdminUserDetail(userId)
  const { data: viewerAbility, isLoading: isPermissionsLoading } =
    useAdminAbility()

  if (isLoading || isPermissionsLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <FullPageSpinner isLoading />
      </div>
    )
  }

  if (!viewerAbility?.canManageUsers) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
        Нет прав для просмотра этой страницы
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center text-muted-foreground">
        Пользователь не найден
      </div>
    )
  }

  const profile = data.profile
  const now = Date.now()
  const activeAccess = data.accesses.find(access => access.isActive)
  const activeFreeze = data.freezes.find(
    freeze =>
      !freeze.canceledAt &&
      new Date(freeze.start).getTime() <= now &&
      new Date(freeze.end).getTime() >= now
  )
  const defaultAccessId = activeAccess?.id ?? data.accesses[0]?.id ?? null

  const tabs = [
    {
      value: 'accesses',
      label: 'Доступы',
    },
    {
      value: 'payments',
      label: 'Платежи',
    },
    {
      value: 'activity',
      label: 'Активность',
    },
    {
      value: 'freezes',
      label: 'Заморозки',
    },
  ]

  return (
    <>
      <Button variant="outline" size="sm" asChild className="mb-2">
        <Link href="/admin/users">
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
      <div className="grid gap-8 md:grid-cols-[300px_1fr]">
        <aside className="space-y-4 min-w-0">
          <AdminUserProfile
            userId={userId}
            profile={profile}
            viewerAbility={viewerAbility}
          />
        </aside>
        <section className="space-y-6 min-w-0">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col">
              <h1 className="text-2xl font-semibold">
                Управление пользователем
              </h1>
              <p className="text-sm text-muted-foreground">
                Просмотр доступов, платежей и активности
              </p>
            </div>
            <GrantAccessDialog
              userId={userId}
              disabled={!viewerAbility.canGrantAccess}
            />
            <FreezeUserDialog
              userId={userId}
              accessId={activeAccess?.id}
              expiresAt={activeAccess?.expiresAt ?? null}
              disabled={
                !viewerAbility.canEditAccess ||
                !activeAccess ||
                Boolean(activeFreeze)
              }
            />
          </div>
          {activeFreeze && (
            <Card className='max-w-fit border-sky-500'>
              <CardContent>
                Активная заморозка:{' '}
                <span className="font-semibold">
                  {new Date(activeFreeze.start).toLocaleDateString()} —{' '}
                  {new Date(activeFreeze.end).toLocaleDateString()}
                </span>
              </CardContent>
              <CardFooter>
                <CancelFreezeButton
                  userId={userId}
                  freezeId={activeFreeze.id}
                  accessId={defaultAccessId}
                  disabled={!viewerAbility.canEditAccess || !defaultAccessId}
                />
              </CardFooter>
            </Card>
          )}
          <div className="w-full overflow-x-auto md:overflow-visible">
            <Tabs defaultValue="accesses" className="space-y-4 w-full min-w-0">
              <div className="overflow-x-auto">
                <TabsList className="bg-transparent border-b p-0 gap-6 rounded-none">
                  {tabs.map(tab => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="relative max-w-fit rounded-none border-none px-4 pb-3 pt-2 text-sm font-medium shadow-none data-[state=active]:shadow-none after:absolute after:-bottom-px after:left-0 after:right-0 after:h-[3px] after:bg-transparent data-[state=active]:after:bg-primary data-[state=active]:after:z-10"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              <TabsContent value="accesses">
                <AccessesTable
                  data={data.accesses}
                  userId={userId}
                  canEditAccess={viewerAbility.canEditAccess}
                />
              </TabsContent>
              <TabsContent value="payments">
                <PaymentsTable
                  data={viewerAbility.canViewPayments ? data.payments : []}
                />
              </TabsContent>
              <TabsContent value="activity">
                <ActivityTable
                  data={data.activity}
                  lastActivityAt={data.profile.lastActivityAt}
                />
              </TabsContent>
              <TabsContent value="freezes">
                <FreezeHistoryTable freezes={data.freezes} />
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </>
  )
}

type FreezeUserDialogProps = {
  userId: string
  accessId?: string
  expiresAt: string | null
  disabled?: boolean
}

type FormSubmitEvent = Parameters<
  NonNullable<ComponentProps<'form'>['onSubmit']>
>[0]

function FreezeUserDialog({
  userId,
  accessId,
  expiresAt,
  disabled,
}: Readonly<FreezeUserDialogProps>) {
  const [open, setOpen] = useState(false)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [timeZone, setTimeZone] = useState<string | undefined>(undefined)
  const utils = adminUsersApi.useUtils()
  const freezeMutation = adminUsersApi.admin.user.access.freeze.useMutation({
    onSuccess: () => {
      toast.success('Заморозка активирована')
      setOpen(false)
      utils.admin.user.detail.invalidate({ userId }).catch(() => undefined)
    },
    onError: error => {
      toast.error(error.message ?? 'Не удалось заморозить доступ')
    },
  })

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [])

  useEffect(() => {
    if (open) {
      const today = new Date()
      setDateRange({ from: today, to: addDays(today, 6) })
    } else {
      setDateRange(undefined)
    }
  }, [open])

  const handleSubmit = (event: FormSubmitEvent) => {
    event.preventDefault()
    if (!accessId || !dateRange?.from || !dateRange.to) {
      return
    }
    const expiresAtDate = expiresAt ? new Date(expiresAt) : null
    if (expiresAtDate && dateRange.from >= expiresAtDate) {
      toast.error('Дата начала заморозки должна быть раньше окончания доступа')
      return
    }

    freezeMutation.mutate({
      accessId,
      start: startOfDay(new Date(dateRange.from)).toISOString(),
      end: endOfDay(new Date(dateRange.to)).toISOString(),
    })
  }

  const expiresAtDate = useMemo(
    () => (expiresAt ? new Date(expiresAt) : null),
    [expiresAt]
  )

  const disabledBeforeToday = (date: Date) =>
    date < new Date(new Date().setHours(0, 0, 0, 0))

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

  const buttonDisabled = disabled || !accessId

  return (
    <>
      <Button
        variant="outline"
        disabled={buttonDisabled}
        onClick={() => setOpen(true)}
      >
        Активировать заморозку
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-full sm:max-w-[720px]">
          <DialogHeader>
            <DialogTitle>Активировать заморозку</DialogTitle>
            <DialogDescription>
              Выберите период, когда доступ будет приостановлен.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label>Период заморозки</Label>
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleRangeSelect}
                disabled={disabledDate}
                timeZone={timeZone}
                numberOfMonths={
                  typeof globalThis !== 'undefined' &&
                  'window' in globalThis &&
                  globalThis.window.innerWidth < 640
                    ? 1
                    : 2
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
                onClick={() => !freezeMutation.isPending && setOpen(false)}
                disabled={freezeMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={
                  freezeMutation.isPending ||
                  !dateRange?.from ||
                  !dateRange.to ||
                  buttonDisabled
                }
              >
                {freezeMutation.isPending && (
                  <Spinner className="mr-2 size-3" />
                )}
                Заморозить
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

type CancelFreezeButtonProps = {
  userId: string
  freezeId: string
  accessId: string | null
  disabled?: boolean
}

function CancelFreezeButton({
  userId,
  freezeId,
  accessId,
  disabled,
}: Readonly<CancelFreezeButtonProps>) {
  const utils = adminUsersApi.useUtils()
  const unfreezeMutation =
    adminUsersApi.admin.user.access.freezeCancel.useMutation({
      onSuccess: () => {
        toast.success('Заморозка отменена')
        utils.admin.user.detail.invalidate({ userId }).catch(() => undefined)
      },
      onError: error => {
        toast.error(error.message ?? 'Не удалось отменить заморозку')
      },
    })

  const handleClick = () => {
    if (!accessId) {
      toast.error('Нет активного доступа для отмены заморозки')
      return
    }
    unfreezeMutation.mutate({
      accessId,
      freezeId,
    })
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-destructive hover:text-destructive"
      onClick={handleClick}
      disabled={disabled || unfreezeMutation.isPending}
    >
      {unfreezeMutation.isPending && <Spinner className="mr-2 size-3" />}
      Отменить
    </Button>
  )
}
