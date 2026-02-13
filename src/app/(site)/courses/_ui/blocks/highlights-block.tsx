'use client'

import React from 'react'
import { HighlightsBlock } from '@/kernel/domain/course-page'
import { Card, CardContent } from '@/shared/ui/card'

export function HighlightsBlockComponent({ items }: HighlightsBlock) {
  return (
    <section className="grid gap-3 md:grid-cols-4">
      {items.map((item, index) => (
        <Card
          key={`${item.label}-${index}`}
          className="rounded-3xl border bg-muted/10 shadow-none"
        >
          <CardContent className="px-4 py-4">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className="mt-1 text-sm font-medium">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
