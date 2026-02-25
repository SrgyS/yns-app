'use client'

import React from 'react'
import { AccordionBlock } from '@/kernel/domain/course-page'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/ui/accordion'

export function AccordionBlockComponent({ title, items }: AccordionBlock) {
  return (
    <section className="space-y-4 py-5 md:space-y-6 md:py-8">
      {title && (
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      )}
      <Accordion type="single" collapsible className="w-full">
        {items.map((item, index) => (
          <AccordionItem
            className="border-b-primary/30"
            key={`${item.title}-${index}`}
            value={`item-${index}`}
          >
            <AccordionTrigger className="text-sm md:text-base">
              {item.title}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground text-sm">
              {item.content}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
