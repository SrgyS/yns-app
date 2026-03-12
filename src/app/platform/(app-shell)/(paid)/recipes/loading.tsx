import { Skeleton } from '@/shared/ui/skeleton/skeleton'

export default function Loading() {
  return (
    <section className="space-y-6 py-4">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-9 w-24" />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border/80 bg-card"
          >
            <Skeleton className="h-32 w-full rounded-none md:h-40" />
            <div className="space-y-3 p-3">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
