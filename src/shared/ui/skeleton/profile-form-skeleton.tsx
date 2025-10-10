import { useAppearanceDelay } from '@/shared/lib/react'
import { Skeleton } from './skeleton'

export function ProfileFormSkeleton({ isLoading }: { isLoading?: boolean }) {
  const show = useAppearanceDelay(isLoading)

  if (show) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 flex-col">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-[84px] w-[84px] rounded-full" />
        </div>
        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-1/4 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  return null
}
