'use client'

import { useAdminUsers } from '../_hooks/use-admin-users'
import { Spinner } from '@/shared/ui/spinner'

export function AdminUsersPage() {
  const { data, isLoading, isFetching, filters } = useAdminUsers()

  if (isLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center text-sm text-muted-foreground">
        Не удалось загрузить пользователей
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Пользователи</h1>
          <p className="text-sm text-muted-foreground">
            Найдено {data.total} записей. Страница {data.page} из {data.pageCount || 1}.
          </p>
        </div>
        {isFetching && <Spinner className="size-5 text-muted-foreground" />}
      </div>
      <pre className="rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground overflow-x-auto">
        {JSON.stringify({ filters, data }, null, 2)}
      </pre>
    </div>
  )
}
