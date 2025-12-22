'use client'

import { AdminDataTable } from '@/shared/ui/data-table'
import { workoutColumns } from './columns'
import { LoadMoreHint } from '@/shared/ui/load-more-hint'

export type AdminWorkoutRow = {
  id: string
  videoId: string
  title: string
  durationSec: number
  section: string
  difficulty: string
  posterUrl?: string | null
  needsReview: boolean
  manuallyEdited: boolean
  createdAt: string
}

type AdminWorkoutsTableProps = Readonly<{
  data: AdminWorkoutRow[]
  total: number
  isLoading?: boolean
  isFetchingNextPage: boolean
  hasNextPage: boolean
  loadMoreRef: React.RefObject<HTMLDivElement | null>
  onEdit: (workout: AdminWorkoutRow) => void
}>

export function AdminWorkoutsTable({
  data,
  total,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  loadMoreRef,
  onEdit,
}: AdminWorkoutsTableProps) {
  return (
    <>
      <AdminDataTable
        className="w-full"
        columns={workoutColumns}
        data={data}
        isLoading={isLoading}
        meta={{ onEdit }}
        emptyPlaceholder={
          <div className="py-10 text-center text-sm text-muted-foreground">
            Тренировки не найдены
          </div>
        }
      />
      <div className="mt-2 text-sm text-muted-foreground">
        {total ? `${data.length} из ${total}` : null}
      </div>
      <LoadMoreHint
        ref={loadMoreRef}
        isLoadingMore={isFetchingNextPage}
        hasNextPage={hasNextPage}
      />
    </>
  )
}
