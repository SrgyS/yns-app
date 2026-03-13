'use client'

import { type CSSProperties } from 'react'

import { Spinner } from '@/shared/ui/spinner'
import { cn } from '@/shared/ui/utils'

import {
  DEFAULT_HEIGHT,
  toStyleSize,
  type KinescopePlayerOptions,
} from './kinescope-player.utils'
import { useKinescopeIframePlayer } from './use-kinescope-iframe-player'

export type KinescopePlayerProps = {
  videoId?: string
  options?: KinescopePlayerOptions
  completionState?: boolean
  className?: string
  style?: CSSProperties
  /**
   * Native player end event (reaches real media end).
   * Use for UI-only reactions.
   */
  onEnded?: () => void
  /**
   * Domain completion signal (95% watched or native end).
   * Use for workout completion updates.
   */
  onWatched?: () => void
  onError?: (error: Error) => void
  onReady?: () => void
  onPlay?: () => void
  onPause?: () => void
}

export function KinescopePlayer({
  videoId,
  options,
  completionState,
  className,
  style,
  onEnded,
  onWatched,
  onError,
  onReady,
  onPlay,
  onPause,
}: Readonly<KinescopePlayerProps>) {
  const { hostRef, isLoading, sourceUrl } = useKinescopeIframePlayer({
    videoId,
    options,
    completionState,
    onEnded,
    onWatched,
    onError,
    onReady,
    onPlay,
    onPause,
  })

  const widthStyle = toStyleSize(options?.size?.width, '100%')
  const heightStyle = toStyleSize(options?.size?.height, `${DEFAULT_HEIGHT}px`)

  if (!sourceUrl) {
    return null
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border/70 bg-background sm:rounded-xl',
        className
      )}
      style={{
        width: widthStyle,
        height: heightStyle,
        ...style,
      }}
    >
      <div ref={hostRef} className="h-full w-full bg-background" />

      {isLoading ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-background">
          <Spinner />
        </div>
      ) : null}
    </div>
  )
}

KinescopePlayer.displayName = 'KinescopePlayer'
