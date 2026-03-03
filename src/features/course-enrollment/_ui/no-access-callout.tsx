import Link from 'next/link'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

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
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardFooter>
        <Button asChild>
          <Link href={ctaHref}>{ctaLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
