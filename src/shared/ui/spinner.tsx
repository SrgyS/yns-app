import { cn } from '@/shared/ui/utils'
import { HTMLAttributes } from 'react'

type SpinnerProps = HTMLAttributes<HTMLSpanElement> & {
  'aria-label'?: string
}

export function Spinner({
  className,
  'aria-label': ariaLabel = 'Загрузка',
  ...props
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={cn(
        'inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent',
        className
      )}
      {...props}
    >
      <span className="sr-only">{ariaLabel}</span>
    </span>
  )
}
