'use client'

import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardTitle } from '@/shared/ui/card'
import Image from 'next/image'
import Link from 'next/link'

type ServiceCardProps = {
  title: string
  description: string
  priceTitle: string
  imageUrl?: string
  href: string
}

export function ServiceCard({
  title,
  description,
  priceTitle,
  imageUrl,
  href,
}: ServiceCardProps) {
  return (
    <Card className="overflow-hidden py-2 rounded-3xl">
      <CardContent className="px-2 h-full">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-center h-full">
          <div className="space-y-4 pl-2 pb-2">
            <div className="space-y-3">
              <CardTitle className="pt-2 text-xl font-bold text-primary">
                {title}
              </CardTitle>
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {description}
              </div>
            </div>
            <Button size="lg" className='rounded-2xl' asChild>
              <Link href={href}>
                {priceTitle}
              </Link>
            </Button>
          </div>
          <div className="relative min-h-[220px] md:min-h-full rounded-2xl overflow-hidden">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={title}
                fill
                className="object-cover object-bottom"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
