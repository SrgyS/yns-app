import { Skeleton } from '@/shared/ui/skeleton/skeleton'

export default function Loading() {
  return (
    <>
      <div className="fixed top-4 right-4 md:hidden">
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>

      <section className="m-auto max-w-200 space-y-8 py-14">
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2 text-center">
            <Skeleton className="mx-auto h-7 w-48" />
            <Skeleton className="mx-auto h-4 w-56" />
          </div>
        </div>

        <div className="rounded-xl border bg-card">
          <div className="space-y-2 p-6">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-28" />
          <div className="grid gap-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="space-y-4 rounded-xl border bg-card p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="h-6 w-24" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-56" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
