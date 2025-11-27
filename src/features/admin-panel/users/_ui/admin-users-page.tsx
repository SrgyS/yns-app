'use client'

import { useAdminUsers } from '../_hooks/use-admin-users'
import {
  adminUsersColumns,
  UsersTable,
} from './tables/users'
import { AdminUsersPagination } from './admin-users-pagination'
import { AdminUsersSortButton } from './admin-users-sort-button'
import { FullPageSpinner } from '@/shared/ui/full-page-spinner'

export function AdminUsersPage() {
  const { data, isLoading, isFetching, filters, setFilter, setSorting } =
    useAdminUsers()

  if (!data) {
    return (
      <div className="flex min-h-80 items-center justify-center mx-auto text-sm text-muted-foreground">
        {isLoading ? (
          <FullPageSpinner isLoading />
        ) : (
          'Не удалось загрузить пользователей'
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 w-fit">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Пользователи</h1>
          <p className="text-sm text-muted-foreground">
            Всего {data.total} записей · страница {data.page} из{' '}
            {data.pageCount || 1}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminUsersSortButton
            sortBy={filters.sortBy}
            sortDir={filters.sortDir}
            onChange={setSorting}
          />
          {isFetching && <FullPageSpinner isLoading={isFetching} />}
        </div>
      </div>
      <UsersTable
        columns={adminUsersColumns}
        data={data.items}
        filters={filters}
        onFilterChange={(key, value) => setFilter(key, value)}
      />
      <AdminUsersPagination
        page={data.page}
        pageCount={data.pageCount}
        onChange={page => setFilter('page', String(page), { resetPage: false })}
      />
    </div>
  )
}
