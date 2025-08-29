import { courseDetailsApi } from '@/features/course-details/_api'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { ChevronRight } from 'lucide-react'

import { useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/shared/ui/card'

export function CourseBanner({ courseSlug }: { courseSlug: string }) {
  const router = useRouter()
  const { data: session } = useAppSession()
  const { data: courseDetails, isLoading } =
    courseDetailsApi.courseDetails.get.useQuery({
      courseSlug,
    })
//TODO: показывать дату окончания доступа
  const handleGoToProfile = () => {
    router.push(`/profile/${session?.user?.id}`)
  }

  if (isLoading) {
    return <Skeleton className="h-6 w-[300px]" />
  }

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle>{courseDetails?.title}</CardTitle>
        <CardDescription>доступ до ...</CardDescription>
        <CardAction>
          <Button
            variant="secondary"
            size="icon"
            className="size-8"
            onClick={handleGoToProfile}
          >
            <ChevronRight />
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  )
}
