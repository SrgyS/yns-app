'use client'

import React from 'react'
import { VideoBlock } from '@/kernel/domain/course-page'
import { KinescopePlayer } from '@/features/daily-plan/_ui/kinescope-player'
import { getImageUrl } from '@/shared/lib/images'
import { AppImage } from '@/shared/ui/app-image'
import { cn } from '@/shared/ui/utils'
import { Play } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

type VideoBlockComponentProps = VideoBlock & {
  variant?: 'default' | 'compact'
  className?: string
  showTitle?: boolean
}

const PLAYER_PREVIEW_IMAGE_URL = getImageUrl('player-img.jpg')

export function VideoBlockComponent({
  title,
  videoId,
  variant = 'default',
  className,
  showTitle,
}: VideoBlockComponentProps) {
  const isCompact = variant === 'compact'
  const shouldShowTitle = showTitle ?? (isCompact ? false : Boolean(title))

  return (
    <section
      className={cn(isCompact ? 'space-y-3' : 'space-y-6 py-8', className)}
    >
      {shouldShowTitle && title && (
        <h2
          className={cn(
            isCompact
              ? 'text-sm font-medium text-muted-foreground'
              : 'text-2xl font-semibold tracking-tight'
          )}
        >
          {title}
        </h2>
      )}
      <div className={cn(isCompact ? 'max-w-none' : 'mx-auto max-w-4xl')}>
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative group cursor-pointer rounded-xl overflow-hidden bg-muted aspect-video w-full flex items-center justify-center">
              <AppImage
                src={PLAYER_PREVIEW_IMAGE_URL}
                alt={title || 'Превью тренировки'}
                fill
                className="z-0 object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 420px"
              />
              <div className="absolute inset-0 z-10 bg-black/30" />
              <div className="relative z-20 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
                <Play className="h-6 w-6 ml-1" />
              </div>
            </div>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-1rem)] max-w-6xl p-0 overflow-hidden border-none bg-black sm:w-[calc(100vw-2rem)]">
            <DialogHeader className="px-6 pt-6 hidden">
              <DialogTitle>{title || 'Видео'}</DialogTitle>
            </DialogHeader>
            <VisuallyHidden>
              <DialogTitle>{title || 'Видео'}</DialogTitle>
            </VisuallyHidden>
            <div className="aspect-video w-full max-h-[85vh]">
              <KinescopePlayer
                videoId={videoId}
                className="h-full w-full"
                options={{
                  size: {
                    width: '100%',
                    height: '100%',
                  },
                  behavior: {
                    autoPlay: true,
                  },
                  ui: {
                    language: 'ru',
                  },
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  )
}
