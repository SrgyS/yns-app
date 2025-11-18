'use client'

import type { AdminUserPayment } from '../../../_domain/user-detail'
import { AdminDataTable } from '@/features/admin-panel/ui/data-table'
import { Card, CardContent } from '@/shared/ui/card'
import { paymentColumns } from './columns'

export function PaymentsTable({ data }: { data: AdminUserPayment[] }) {
  const sorted = [...data].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  return (
    <AdminDataTable
      columns={paymentColumns}
      data={sorted}
      emptyPlaceholder={
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Платежи не найдены
          </CardContent>
        </Card>
      }
    />
  )
}
