'use client'

import React from 'react'
import { AppImage } from '@/shared/ui/app-image'
import { TextBlock } from '@/kernel/domain/course-page'
import { cn } from '@/shared/ui/utils'

export function TextBlockComponent({
  title,
  content,
  align = 'left',
  background = 'default',
  image,
  imagePosition = 'right',
}: TextBlock) {
  const Content = (
    <div className="space-y-4">
      {title && (
        <h2
          className={cn(
            'text-2xl font-semibold tracking-tight',
            align === 'center' && 'text-center',
            align === 'right' && 'text-right'
          )}
        >
          {title}
        </h2>
      )}
      <div
        className={cn(
          'prose md:prose-lg dark:prose-invert max-w-none text-foreground/80',
          align === 'center' && 'text-center',
          align === 'right' && 'text-right'
        )}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )

  if (image) {
    return (
      <section
        className={cn(
          'py-8',
          background === 'muted' && 'bg-muted rounded-xl p-8'
        )}
      >
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div
            className={cn(
              imagePosition === 'right' ? 'md:order-1' : 'md:order-2'
            )}
          >
            {Content}
          </div>
          <div
            className={cn(
              'relative aspect-video w-full overflow-hidden rounded-xl md:aspect-4/3',
              imagePosition === 'right' ? 'md:order-2' : 'md:order-1'
            )}
          >
            <AppImage
              src={image}
              alt={title || ''}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      className={cn(
        'space-y-4 py-8',
        background === 'muted' && 'bg-muted rounded-xl p-8'
      )}
    >
      {Content}
    </section>
  )
}
