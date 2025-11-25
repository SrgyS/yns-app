'use client'

import { Card, CardContent } from '@/shared/ui/card'
import { AdminDataTable } from '@/features/admin-panel/ui/data-table'
import { AdminWorkoutRow, WorkoutTableContextProvider } from './context'
import { workoutColumns } from './columns'

type AdminWorkoutsTableProps = Readonly<{
  data: AdminWorkoutRow[]
  total: number
  isFetchingNextPage: boolean
  loadMoreRef: React.RefObject<HTMLDivElement | null>
  onEdit: (workout: AdminWorkoutRow) => void
}>

export function AdminWorkoutsTable({
  data,
  total,
  isFetchingNextPage,
  loadMoreRef,
  onEdit,
}: AdminWorkoutsTableProps) {
  return (
    <WorkoutTableContextProvider value={{ onEdit }}>
      <AdminDataTable
        columns={workoutColumns}
        data={data}
        emptyPlaceholder={
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Тренировки не найдены
            </CardContent>
          </Card>
        }
      />
      <div className="mt-4 text-sm text-muted-foreground">
        {total ? `${data.length} из ${total}` : null}
      </div>
      <div ref={loadMoreRef} className="h-10 w-full" />
      {isFetchingNextPage ? (
        <p className="text-sm text-muted-foreground">Загрузка...</p>
      ) : null}
    </WorkoutTableContextProvider>
  )
}
