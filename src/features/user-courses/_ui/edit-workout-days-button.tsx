import Link from 'next/link'
import { Edit } from 'lucide-react'
import { Button } from '@/shared/ui/button'

export const EditWorkoutDaysButton = ({
  enrollmentId,
  freezeUntil,
}: {
  enrollmentId: string
  freezeUntil: string | null
}) => {
  if (freezeUntil) {
    return (
      <Button variant="outline" disabled>
        <Edit className="mr-2 h-4 w-4" />
        Изменить дни
      </Button>
    )
  }

  return (
    <Button asChild variant="outline">
      <Link href={`/platform/edit-workout-days/${enrollmentId}`}>
        <Edit className="mr-2 h-4 w-4" />
        Изменить дни
      </Link>
    </Button>
  )
}
