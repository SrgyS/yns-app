import { Skeleton } from '@/shared/ui/skeleton/skeleton'

export default function Loading() {
  return (
    <section className="mx-auto max-w-2xl space-y-8 py-4 sm:pt-14">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="space-y-4 rounded-3xl border border-border/70 bg-card/80 p-5"
          >
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </section>
  )
}
