'use client'

import React from 'react'
import { TestimonialsBlock } from '@/kernel/domain/course-page'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Quote } from 'lucide-react'

export function TestimonialsBlockComponent({
  title,
  items,
  showGallery,
}: TestimonialsBlock) {
  return (
    <section className="space-y-6">
      {title && (
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      )}

      {/* Testimonials Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => (
          <Card key={index} className="rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Quote className="h-4 w-4 text-muted-foreground" />
                <span>{item.title}</span>
              </CardTitle>
              <CardDescription>
                {item.author || 'Отзыв участницы'}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {item.text}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Media Gallery Placeholders */}
      {showGallery && (
        <div className="grid gap-3 md:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div
              key={index}
              className="relative aspect-4/5 overflow-hidden rounded-3xl border bg-muted/20"
            >
              <div className="absolute inset-0 bg-linear-to-br from-muted/10 via-transparent to-muted/20" />
              <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border bg-background/70 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
                Галерея {index}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
