import { Skeleton } from '@/shared/ui/skeleton/skeleton'

export function DayPageSkeleton() {
  return (
    <section className="mx-auto flex w-full max-w-160 flex-col space-y-5 px-3 py-4 sm:space-y-6 sm:px-4 md:px-6">
      <div className="space-y-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-xl" />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-3xl" />
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
      </div>
    </section>
  )
}
