'use client'

import React from 'react'
import { AppImage } from '@/shared/ui/app-image'
import Link from 'next/link'
import { ListBlock } from '@/kernel/domain/course-page'
import { Card, CardContent, CardHeader } from '@/shared/ui/card'
import { cn } from '@/shared/ui/utils'

export function ListBlockComponent({
  title,
  items,
  layout = 'grid',
}: ListBlock) {
  return (
    <section className="space-y-4 py-5 md:space-y-6 md:py-8">
      {title && (
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      )}
      <div
        className={cn(
          layout === 'grid'
            ? 'grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3'
            : 'space-y-3 md:space-y-4'
        )}
      >
        {items.map((item, index) => {

          return (
            <Card
              key={`${item.title}-${index}`}
              className="overflow-hidden rounded-3xl"
            >
              <CardHeader className="block space-y-0 p-4 md:p-6">
                {item.image && (
                  <div className="float-right ml-4 mb-2 -mr-4 -mt-2 h-20 w-20 overflow-hidden rounded-2xl relative">
                    <AppImage
                      src={item.image}
                      alt={item.title}
                      fill
                      sizes="80px"
                      className="object-contain"
                    />
                  </div>
                )}
                <h3 className="mb-2 text-base font-semibold md:mb-3 md:text-lg">
                  {item.title}
                </h3>
                <p className="text-[13px] leading-snug text-muted-foreground md:text-sm">
                  {item.description}
                </p>
              </CardHeader>
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <CardContent className="space-y-3 p-4 pt-0 md:space-y-4 md:p-6 md:pt-0">
                  {Object.entries(item.metadata).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-sm font-semibold">{key}</p>
                      {value.startsWith('http') ? (
                        <Link
                          href={value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          {value}
                        </Link>
                      ) : (
                        <p className="text-sm text-muted-foreground">{value}</p>
                      )}
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>
    </section>
  )
}
