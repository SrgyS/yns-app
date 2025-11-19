'use client'

import { useAdminUserDetail } from '../_hooks/use-admin-user-detail'
import { useAdminPermissions } from '../_hooks/use-admin-permissions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { ProfileAvatar } from '@/entities/user/client'
import { formatDate } from './utils/format-date'
import { AccessesTable } from './tables/accesses'
import { PaymentsTable } from './tables/payments'
import { Badge } from '@/shared/ui/badge'
import { GrantAccessDialog } from './grant-access-dialog'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { FullPageSpinner } from '@/shared/ui/full-page-spinner'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  STAFF: 'Сотрудник',
  USER: 'Пользователь',
}

export function AdminUserDetailPage({ userId }: Readonly<{ userId: string }>) {
  const { data, isLoading } = useAdminUserDetail(userId)
  const { data: viewerPermissions, isLoading: isPermissionsLoading } =
    useAdminPermissions()

  if (isLoading || isPermissionsLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-10">
        <FullPageSpinner isLoading />
      </div>
    )
  }

  if (!viewerPermissions?.canManageUsers) {
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
          <Card className="w-full">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <ProfileAvatar profile={profile} className="size-20" />
                <div>
                  <p className="text-lg font-semibold">
                    {profile.name || 'Без имени'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
                <Badge variant="secondary">
                  {ROLE_LABELS[profile.role] ?? profile.role}
                </Badge>
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">Телефон</dt>
                  <dd className="font-semibold">{profile.phone ?? '—'}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">Дата регистрации</dt>
                  <dd className="font-semibold">
                    {formatDate(profile.createdAt)}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">
                    Последняя активность
                  </dt>
                  <dd className="font-semibold">
                    {formatDate(profile.lastActivityAt)}
                  </dd>
                </div>
              </dl>
              <div className="mt-6 space-y-2">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer"
                  disabled={!viewerPermissions.canLoginAsUser}
                >
                  Войти под пользователем
                </Button>
                <Button variant="outline" className="w-full cursor-pointer">
                  Сбросить пароль
                </Button>
                <Button variant="outline" className="w-full cursor-pointer">
                  Отправить сообщение
                </Button>
              </div>
            </CardContent>
          </Card>
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
              disabled={!viewerPermissions.canGrantAccess}
            />
          </div>
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
                  canEditAccess={viewerPermissions.canEditAccess}
                />
              </TabsContent>
              <TabsContent value="payments">
                <PaymentsTable
                  data={viewerPermissions.canViewPayments ? data.payments : []}
                />
              </TabsContent>
              <TabsContent value="activity">
                <Card>
                  <CardContent className="py-10 text-center text-sm text-muted-foreground">
                    История активности пока недоступна
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </div>
    </>
  )
}
