import { Skeleton } from '@/shared/ui/skeleton/skeleton'

export default function Loading() {
  return (
    <section className="space-y-6 py-4">
      <header className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-border/70 bg-card/80"
          >
            <Skeleton className="aspect-4/3 w-full rounded-none" />
            <div className="space-y-3 p-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
