'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import type { AdminUserAccess } from '../../../_domain/user-detail'
import { formatDate } from '../../utils/format-date'

const REASON_LABELS: Record<string, string> = {
  paid: 'Куплен',
  free: 'Бесплатно',
  manual: 'Выдан вручную',
}

export const accessColumns: ColumnDef<AdminUserAccess>[] = [
  {
    accessorKey: 'courseTitle',
    header: 'Курс',
    cell: ({ row }) => (
      <div>
        <div className="font-medium text-wrap">{row.original.courseTitle}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.contentType === 'SUBSCRIPTION'
            ? 'Подписка'
            : 'Фиксированный курс'}
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'period',
    header: 'Период',
    cell: ({ row }) => {
      const isActive = row.original.isActive
      return (
        <div>
          <Badge variant={isActive ? 'secondary' : 'outline'}>
            {isActive ? 'Активен' : 'Завершён'}
          </Badge>
          <div className="mt-1 text-xs text-muted-foreground">
            до {formatDate(row.original.expiresAt)}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'reason',
    header: 'Причина',
    cell: ({ row }) => REASON_LABELS[row.original.reason] ?? row.original.reason,
  },
  {
    accessorKey: 'admin',
    header: 'Сотрудник',
    cell: ({ row }) => row.original.adminName ?? row.original.adminEmail ?? '—',
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: () => (
      <div className="flex flex-wrap gap-2 text-xs">
        <Button variant="outline" size="sm" disabled>
          Продлить
        </Button>
        <Button variant="outline" size="sm" disabled>
          Изменить период
        </Button>
        <Button variant="outline" size="sm" disabled>
          Закрыть
        </Button>
      </div>
    ),
  },
]
