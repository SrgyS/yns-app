'use client'

import { useAdminUsers } from '../_hooks/use-admin-users'
import { Spinner } from '@/shared/ui/spinner'
import { DataTable } from './users-table/data-table'
import {
  AdminUsersTableProvider,
  adminUsersColumns,
} from './users-table/column'
import { AdminUsersPagination } from './admin-users-pagination'
import { AdminUsersSortButton } from './admin-users-sort-button'

export function AdminUsersPage() {
  const { data, isLoading, isFetching, filters, setFilter, setSorting } =
    useAdminUsers()

  if (!data) {
    return (
      <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
        {isLoading ? <Spinner /> : 'Не удалось загрузить пользователей'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
          {isFetching && <Spinner className="size-5 text-muted-foreground" />}
        </div>
      </div>
      <AdminUsersTableProvider
        value={{
          filters,
          onFilterChange: (key, value) => setFilter(key, value),
        }}
      >
        <DataTable columns={adminUsersColumns} data={data.items} />
      </AdminUsersTableProvider>
      <AdminUsersPagination
        page={data.page}
        pageCount={data.pageCount}
        onChange={page => setFilter('page', String(page), { resetPage: false })}
      />
    </div>
  )
}
