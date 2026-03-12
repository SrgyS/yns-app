'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import ReactKinescopePlayer, {
  type EventErrorTypes,
  type EventReadyTypes,
  type EventTimeUpdateTypes,
  type EventDurationChangeTypes,
} from '@kinescope/react-kinescope-player'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { cn } from '@/shared/ui/utils'

const WATCHED_PERCENT_THRESHOLD = 0.95
const DEFAULT_HEIGHT = 300
const INIT_RETRY_TIMEOUTS_MS = [2_000, 4_000]
const MAX_INIT_RETRIES = INIT_RETRY_TIMEOUTS_MS.length

type KinescopePlayerOptions = {
  url?: string
  size?: {
    width?: number | string
    height?: number | string
  }
  behavior?: {
    autoPlay?: boolean | 'viewable'
    autoPause?: boolean | 'reset'
    preload?: boolean | 'none' | 'metadata' | 'auto'
    localStorage?:
      | boolean
      | {
          quality?: 'item' | 'global' | boolean
          time?: boolean
          textTrack?: 'item' | 'global' | boolean
        }
    loop?: boolean
    playsInline?: boolean
    muted?: boolean
    textTrack?: boolean | string
    playlist?: {
      autoSwitch?: boolean
      initialItem?: string
      loop?: boolean
    }
  }
  ui?: {
    language?: 'ru' | 'en'
    controls?: boolean
    mainPlayButton?: boolean
    playbackRateButton?: boolean
    watermark?: {
      text: string
      mode?: 'stripes' | 'random'
      scale?: number
      displayTimeout?: number | { visible: number; hidden: number }
    }
  }
  theme?: unknown
  settings?: {
    externalId?: string
  }
  autoplay?: boolean
}

export type KinescopePlayerProps = {
  videoId?: string
  options?: KinescopePlayerOptions
  completionState?: boolean
  className?: string
  style?: CSSProperties
  onEnded?: () => void
  onWatched?: () => void
  onError?: (error: Error) => void
  onPlay?: () => void
  onPause?: () => void
}

const toStyleSize = (
  value: number | string | undefined,
  fallback: string
): string => {
  if (typeof value === 'number') {
    return `${value}px`
  }

  if (typeof value === 'string') {
    return value
  }

  return fallback
}

const extractVideoIdFromUrl = (url?: string): string | undefined => {
  if (!url?.includes('/embed/')) {
    return undefined
  }

  const sanitizedUrl = url.split('?')[0]
  const extractedId = sanitizedUrl.split('/embed/')[1]

  return extractedId || undefined
}

const normalizePlayerError = (error: unknown): Error => {
  if (error instanceof Error) {
    return error
  }

  return new Error('Failed to initialize Kinescope player')
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
  onPlay,
  onPause,
}: Readonly<KinescopePlayerProps>) {
    const watchedReportedRef = useRef(false)
    const durationRef = useRef(0)
    const isReadyRef = useRef(false)
    const initRetryCountRef = useRef(0)

    const [playerInstanceKey, setPlayerInstanceKey] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const resolvedVideoId = useMemo(() => {
      return videoId ?? extractVideoIdFromUrl(options?.url)
    }, [videoId, options?.url])

    const widthStyle = toStyleSize(options?.size?.width, '100%')
    const heightStyle = toStyleSize(
      options?.size?.height,
      `${DEFAULT_HEIGHT}px`
    )

    useEffect(() => {
      watchedReportedRef.current = false
      durationRef.current = 0
      isReadyRef.current = false
      initRetryCountRef.current = 0
      setIsLoading(Boolean(resolvedVideoId))
      setPlayerInstanceKey(0)
    }, [resolvedVideoId])

    const restartPlayer = (): boolean => {
      if (isReadyRef.current) {
        return false
      }

      if (initRetryCountRef.current >= MAX_INIT_RETRIES) {
        return false
      }

      initRetryCountRef.current += 1
      isReadyRef.current = false
      setIsLoading(true)
      setPlayerInstanceKey(prev => prev + 1)
      return true
    }

    useEffect(() => {
      if (!resolvedVideoId) {
        return
      }

      const fallbackTimeout = setTimeout(() => {
        if (!isReadyRef.current) {
          const restarted = restartPlayer()
          if (restarted) {
            return
          }
        }
        setIsLoading(false)
      }, INIT_RETRY_TIMEOUTS_MS[initRetryCountRef.current] ?? 6_000)

      return () => {
        clearTimeout(fallbackTimeout)
      }
    }, [resolvedVideoId, playerInstanceKey])

    useEffect(() => {
      if (completionState === false) {
        watchedReportedRef.current = false
      }
    }, [completionState])

    const reportWatched = () => {
      if (watchedReportedRef.current) {
        return
      }

      watchedReportedRef.current = true
      onEnded?.()
      onWatched?.()
    }

    const handleReady = (event: EventReadyTypes) => {
      durationRef.current = event.duration
      isReadyRef.current = true
      setIsLoading(false)
    }

    const handleInit = () => {
      isReadyRef.current = true
      setIsLoading(false)
    }

    const handleDurationChange = (event: EventDurationChangeTypes) => {
      durationRef.current = event.duration
    }

    const handleTimeUpdate = (event: EventTimeUpdateTypes) => {
      const duration = durationRef.current
      const watchedPercent = duration > 0 ? event.currentTime / duration : 0

      if (!duration || watchedReportedRef.current) {
        return
      }

      if (watchedPercent >= WATCHED_PERCENT_THRESHOLD) {
        reportWatched()
      }
    }

    const handlePlayerError = (error: unknown) => {
      if (!isReadyRef.current) {
        const restarted = restartPlayer()
        if (restarted) {
          return
        }
      }

      const normalizedError = normalizePlayerError(error)

      setIsLoading(false)
      onError?.(normalizedError)
    }

    if (!resolvedVideoId) {
      return null
    }

    return (
      <div
        className={cn('relative', className)}
        style={{
          width: widthStyle,
          height: heightStyle,
          ...style,
        }}
      >
        <ReactKinescopePlayer
          key={`${resolvedVideoId}-${playerInstanceKey}`}
          videoId={resolvedVideoId}
          width={options?.size?.width ?? '100%'}
          height={options?.size?.height ?? '100%'}
          autoPlay={options?.behavior?.autoPlay ?? options?.autoplay ?? false}
          autoPause={options?.behavior?.autoPause}
          loop={options?.behavior?.loop}
          playsInline={options?.behavior?.playsInline}
          preload={options?.behavior?.preload}
          muted={options?.behavior?.muted}
          textTrack={options?.behavior?.textTrack}
          language={options?.ui?.language}
          controls={options?.ui?.controls}
          mainPlayButton={options?.ui?.mainPlayButton}
          playbackRateButton={options?.ui?.playbackRateButton}
          watermark={options?.ui?.watermark}
          localStorage={options?.behavior?.localStorage}
          playlistOptions={options?.behavior?.playlist}
          theme={options?.theme as never}
          externalId={options?.settings?.externalId}
          className="h-full w-full"
          onInit={handleInit}
          onReady={handleReady}
          onDurationChange={handleDurationChange}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={reportWatched}
          onTimeUpdate={handleTimeUpdate}
          onError={(error: EventErrorTypes) => handlePlayerError(error)}
          onInitError={handlePlayerError}
          onJSLoadError={() =>
            handlePlayerError(
              new Error('Failed to load Kinescope player script')
            )
          }
        />

        {isLoading && (
          <Skeleton className="pointer-events-none absolute inset-0 z-20 h-full w-full" />
        )}
      </div>
    )
}

KinescopePlayer.displayName = 'KinescopePlayer'
