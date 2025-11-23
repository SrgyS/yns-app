'use client'

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
          <AdminUserProfile profile={profile} viewerAbility={viewerAbility} />
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
            </Tabs>
          </div>
        </section>
      </div>
    </>
  )
}
