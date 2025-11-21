import { courseDetailsApi } from '@/features/course-details/_api'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { useAppSession } from '@/kernel/lib/next-auth/client'
import { ChevronRight } from 'lucide-react'
import { format, isValid } from 'date-fns'

import { useRouter } from 'next/navigation'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
} from '@/shared/ui/card'

type CourseBannerProps = {
  courseSlug: string
  accessExpiresAt?: Date | string | null
}

export function CourseBanner({
  courseSlug,
  accessExpiresAt,
}: CourseBannerProps) {
  const router = useRouter()
  const { data: session } = useAppSession()
  const { data: courseDetails, isLoading } =
    courseDetailsApi.courseDetails.get.useQuery({
      courseSlug,
    })

  const expirationDate =
    accessExpiresAt instanceof Date
      ? accessExpiresAt
      : accessExpiresAt
        ? new Date(accessExpiresAt)
        : null

  const formattedExpiration =
    expirationDate && isValid(expirationDate)
      ? format(expirationDate, 'dd.MM.yyyy')
      : null

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
        <CardDescription>
          {formattedExpiration
            ? `Доступ до ${formattedExpiration}`
            : 'Бессрочный доступ'}
        </CardDescription>
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
