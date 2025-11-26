import { createContext, useContext } from 'react'
import type { AdminUserListFilters } from '../../../_domain/types'
import type { AdminUsersFilterKey } from '../../../_hooks/use-admin-users'

export type TableContextValue = {
  filters: AdminUserListFilters
  onFilterChange: (key: AdminUsersFilterKey, value: string) => void
}

const AdminUsersTableContext = createContext<TableContextValue | null>(null)

export const AdminUsersTableProvider = ({
  children,
  value,
}: {
  children: React.ReactNode
  value: TableContextValue
}) => (
  <AdminUsersTableContext.Provider value={value}>
    {children}
  </AdminUsersTableContext.Provider>
)

export function useAdminUsersTableContext() {
  const ctx = useContext(AdminUsersTableContext)
  if (!ctx) {
    throw new Error('AdminUsersTableContext is not provided')
  }
  return ctx
}
