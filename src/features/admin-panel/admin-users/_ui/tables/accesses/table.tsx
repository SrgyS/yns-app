'use client'

import { useMemo } from 'react'
import type { AdminUserAccess } from '../../../_domain/user-detail'
import { Card, CardContent } from '@/shared/ui/card'
import { AdminDataTable } from '@/features/admin-panel/ui/data-table'
import { accessColumns } from './columns'
import { AccessesTableContext } from './context'
import { adminUsersApi } from '../../../_api'
import { toast } from 'sonner'

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
  const closeMutation = adminUsersApi.admin.user.access.close.useMutation({
    onSuccess: () => {
      toast.success('Доступ закрыт')
      utils.admin.user.detail.invalidate({ userId }).catch(() => undefined)
    },
    onError: () => {
      toast.error('Не удалось закрыть доступ. Попробуйте ещё раз.')
    },
  })

  const { status, variables, mutate } = closeMutation

  const contextValue = useMemo(
    () => ({
      canEditAccess,
      isClosing: status === 'pending',
      closingAccessId: status === 'pending' ? variables?.accessId : undefined,
      onClose: (accessId: string) => {
        if (!canEditAccess) {
          return
        }
        mutate({ accessId })
      },
    }),
    [canEditAccess, status, variables?.accessId, mutate]
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
    </AccessesTableContext.Provider>
  )
}
