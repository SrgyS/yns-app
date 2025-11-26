'use client'

import { AdminDataTable } from '@/shared/ui/data-table'
import { AdminWorkoutRow, WorkoutTableContextProvider } from './context'
import { workoutColumns } from './columns'

type AdminWorkoutsTableProps = Readonly<{
  data: AdminWorkoutRow[]
  total: number
  isLoading?: boolean
  isFetchingNextPage: boolean
  loadMoreRef: React.RefObject<HTMLDivElement | null>
  onEdit: (workout: AdminWorkoutRow) => void
}>

export function AdminWorkoutsTable({
  data,
  total,
  isLoading,
  isFetchingNextPage,
  loadMoreRef,
  onEdit,
}: AdminWorkoutsTableProps) {
  return (
    <WorkoutTableContextProvider value={{ onEdit }}>
      <AdminDataTable
        className="w-full"
        columns={workoutColumns}
        data={data}
        isLoading={isLoading}
        emptyPlaceholder={
          <div className="py-10 text-center text-sm text-muted-foreground">
            Тренировки не найдены
          </div>
        }
      />
      <div className="mt-2 text-sm text-muted-foreground">
        {total ? `${data.length} из ${total}` : null}
      </div>
      {isFetchingNextPage ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : null}
      <div ref={loadMoreRef} className="h-4 w-full" />
    </WorkoutTableContextProvider>
  )
}
