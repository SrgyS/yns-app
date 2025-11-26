'use client'

import { ColumnDef } from '@tanstack/react-table'
import Image from 'next/image'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { AdminWorkoutRow, useWorkoutTableContext } from './context'

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const padded = secs < 10 ? `0${secs}` : secs
  return `${mins}:${padded}`
}

const statusBadge = (workout: AdminWorkoutRow) => {
  if (workout.needsReview) {
    return <Badge variant="destructive">Заполнить карточку</Badge>
  }
  if (workout.manuallyEdited) {
    return <Badge variant="secondary">Данные заполнены</Badge>
  }
  return <Badge variant="outline">Готово</Badge>
}

export const workoutColumns: ColumnDef<AdminWorkoutRow>[] = [
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) => {
      const workout = row.original
      return (
        <div className="flex items-center gap-3">
          {workout.posterUrl ? (
            <div className="relative h-14 w-24 overflow-hidden rounded border">
              <Image
                src={workout.posterUrl}
                alt={workout.title}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-14 w-24 items-center justify-center rounded border text-xs text-muted-foreground">
              Нет обложки
            </div>
          )}
          <div className="flex flex-col max-w-56 sm:max-w-sm">
            <span className="font-medium text-wrap">{workout.title}</span>
            <span className="text-xs text-muted-foreground">
              {formatDuration(workout.durationSec ?? 0)}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground max-w-24">
        {row.original.slug}
      </span>
    ),
  },
  {
    accessorKey: 'section',
    header: 'Секция',
    cell: ({ row }) => row.original.section,
  },
  {
    accessorKey: 'difficulty',
    header: 'Сложность',
    cell: ({ row }) => row.original.difficulty,
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата загрузки',
    cell: ({ row }) => {
      const value = row.original.createdAt
      return (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {value ? format(new Date(value), 'dd.MM.yyyy', { locale: ru }) : '—'}
        </span>
      )
    },
  },
  {
    id: 'status',
    header: 'Статус',
    cell: ({ row }) => statusBadge(row.original),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => <ActionsCell workout={row.original} />,
  },
]

function ActionsCell({ workout }: Readonly<{ workout: AdminWorkoutRow }>) {
  const { onEdit } = useWorkoutTableContext()
  return (
    <div className="flex justify-end">
      <Button size="sm" variant="outline" onClick={() => onEdit(workout)}>
        Редактировать
      </Button>
    </div>
  )
}
