import Link from 'next/link'
import { Edit } from 'lucide-react'
import { Button } from '@/shared/ui/button'

export const EditWorkoutDaysButton = ({ enrollmentId }: { enrollmentId: string }) => {
  return (
    <Button asChild variant="outline">
      <Link href={`/edit-workout-days/${enrollmentId}`}>
        <Edit className="mr-2 h-4 w-4" />
        Изменить дни
      </Link>
    </Button>
  )
}
