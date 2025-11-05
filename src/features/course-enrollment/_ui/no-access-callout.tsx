import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'

type NoAccessCalloutProps = {
  title?: string
  description?: string
  ctaHref?: string
  ctaLabel?: string
  className?: string
}

export function NoAccessCallout({
  title = 'Нет доступных курсов',
  description = 'Оформите подписку или приобретите курс, чтобы продолжить.',
  ctaHref = '/',
  ctaLabel = 'Выбрать курс',
  className,
}: NoAccessCalloutProps) {
  return (
    <div className={className}>
      <Alert>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>

      <Button asChild className="mt-4">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  )
}
