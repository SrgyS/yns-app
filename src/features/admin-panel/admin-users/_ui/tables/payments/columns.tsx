'use client'

import { ColumnDef } from '@tanstack/react-table'
import type { AdminUserPayment } from '../../../_domain/user-detail'
import { formatDate } from '../../utils/format-date'

export const paymentColumns: ColumnDef<AdminUserPayment>[] = [
  {
    accessorKey: 'createdAt',
    header: 'Дата',
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    accessorKey: 'products',
    header: 'Продукты',
    cell: ({ row }) => (
      <div className="space-y-1">
        {row.original.products.map(product => (
          <div key={product.id}>
            {product.name}{' '}
            <span className="text-xs text-muted-foreground">
              × {product.quantity}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Сумма',
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.amount.toLocaleString('ru-RU')} ₽
      </span>
    ),
  },
]
