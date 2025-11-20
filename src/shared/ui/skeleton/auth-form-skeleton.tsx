import { Skeleton } from '@/shared/ui/skeleton/skeleton'

// Skeleton для auth форм
export function AuthFormSkeleton() {
  return (
    <div className="grid gap-6">
      {/* Email форма skeleton */}
      <div className="grid gap-2">
        {/* Email input skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
        {/* Password input skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
        {/* Submit button skeleton */}
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Разделитель skeleton */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Skeleton className="w-full h-px" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <Skeleton className="bg-background px-2 text-muted-foreground w-16 h-4" />
        </div>
      </div>

      {/* OAuth кнопки skeleton - Google*/}
      <div className="grid gap-2">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  )
}
