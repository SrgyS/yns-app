'use client'

import React from 'react'
import { CourseBlock } from '@/kernel/domain/course-page'
import { HeroBlockComponent } from './blocks/hero-block'
import { TextBlockComponent } from './blocks/text-block'
import { TariffsBlockComponent } from './blocks/tariffs-block'
import { AccordionBlockComponent } from './blocks/accordion-block'
import { ListBlockComponent } from './blocks/list-block'
import { VideoBlockComponent } from './blocks/video-block'
import { HighlightsBlockComponent } from './blocks/highlights-block'
import { FitCheckBlockComponent } from './blocks/fit-check-block'
import { SystemBlockComponent } from './blocks/system-block'
import { SignatureBlockComponent } from './blocks/signature-block'
import { StartEffectsBlockComponent } from './blocks/start-effects-block'
import { TestimonialsBlockComponent } from './blocks/testimonials-block'
import { Course } from '@/entities/course'

type BlockRendererProps = {
  blocks: CourseBlock[]
  course: Course
}

export function BlockRenderer({ blocks, course }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return null
  }

  return (
    <div className="space-y-8">
      {blocks
        .filter((block) => block.isVisible)
        .map((block) => {
          switch (block.type) {
            case 'hero':
              return (
                <HeroBlockComponent key={block.id} {...block} course={course} />
              )
            case 'text':
              return <TextBlockComponent key={block.id} {...block} />
            case 'tariffs':
              return (
                <TariffsBlockComponent key={block.id} {...block} course={course} />
              )
            case 'accordion':
              return <AccordionBlockComponent key={block.id} {...block} />
            case 'list':
              return <ListBlockComponent key={block.id} {...block} />
            case 'video':
              return <VideoBlockComponent key={block.id} {...block} />
            case 'highlights':
              return <HighlightsBlockComponent key={block.id} {...block} />
            case 'fit-check':
              return <FitCheckBlockComponent key={block.id} {...block} />
            case 'system':
              return <SystemBlockComponent key={block.id} {...block} />
            case 'signature':
              return <SignatureBlockComponent key={block.id} {...block} />
            case 'start-effects':
              return <StartEffectsBlockComponent key={block.id} {...block} />
            case 'testimonials':
              return <TestimonialsBlockComponent key={block.id} {...block} />
            default:
              return null
          }
        })}
    </div>
  )
}
