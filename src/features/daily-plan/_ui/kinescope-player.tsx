'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

import { load as loadKinescopeApi } from '@kinescope/player-iframe-api-loader'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/ui/utils'

const KINESCOPE_EMBED_BASE_URL = 'https://kinescope.io/embed/'
const KINESCOPE_API_VERSION = 'v2.164.2'

type KinescopeApi = Awaited<ReturnType<typeof loadKinescopeApi>>
type CreateOptions = Parameters<KinescopeApi['create']>[1]
type KinescopePlayerInstance = Awaited<ReturnType<KinescopeApi['create']>>

type KinescopePlayerOptions = Omit<CreateOptions, 'url'> & {
  url?: CreateOptions['url']
}

export type KinescopePlayerProps = {
  videoId?: string
  options?: KinescopePlayerOptions
  className?: string
  style?: CSSProperties
  onEnded?: () => void
  onError?: (error: unknown) => void
}

export type PlayerHandle = {
  destroy: () => void
  getInstance: () => KinescopePlayerInstance | null
}

let kinescopeApiPromise: Promise<KinescopeApi> | null = null

const DEFAULT_HEIGHT = 300

const toStyleSize = (value: number | string | undefined, fallback: string) => {
  if (typeof value === 'number') {
    return `${value}px`
  }
  if (typeof value === 'string') {
    return value
  }
  return fallback
}

export const KinescopePlayer = forwardRef<PlayerHandle, KinescopePlayerProps>(
  ({ videoId, options, className, style, onEnded, onError }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const playerInstanceRef = useRef<KinescopePlayerInstance | null>(null)
    const endedHandlerRef = useRef<((...args: unknown[]) => void) | null>(null)
    const apiRef = useRef<KinescopeApi | null>(null)
    const onEndedRef = useRef(onEnded)
    const onErrorRef = useRef(onError)
    const requestIdRef = useRef(0)
    const [isLoading, setIsLoading] = useState(false)
    const [loadError, setLoadError] = useState<Error | null>(null)
    const [attempt, setAttempt] = useState(0)

    const containerId = useMemo(
      () => `kinescope-player-${Math.random().toString(36).slice(2)}`,
      []
    )

    const normalized = useMemo(() => {
      const baseOptions: KinescopePlayerOptions = options ? { ...options } : {}

      const size = { ...(baseOptions.size ?? {}) }

      const widthValue = size.width
      const heightValue = size.height

      const widthStyle = toStyleSize(widthValue, '100%')
      const heightStyle = toStyleSize(heightValue, `${DEFAULT_HEIGHT}px`)

      const url =
        baseOptions.url ??
        (videoId ? `${KINESCOPE_EMBED_BASE_URL}${videoId}` : undefined)

      const createOptions: CreateOptions | null = url
        ? {
            ...baseOptions,
            url,
            size: {
              ...size,
              width: widthValue ?? '100%',
              height: heightValue ?? DEFAULT_HEIGHT,
            },
          }
        : null

      return {
        createOptions,
        widthStyle,
        heightStyle,
      }
    }, [options, videoId])

    useEffect(() => {
      onEndedRef.current = onEnded
    }, [onEnded])

    useEffect(() => {
      onErrorRef.current = onError
    }, [onError])

    useImperativeHandle(
      ref,
      () => ({
        destroy() {
          if (playerInstanceRef.current?.destroy) {
            playerInstanceRef.current.destroy()
          }
          playerInstanceRef.current = null
        },
        getInstance() {
          return playerInstanceRef.current
        },
      }),
      []
    )

    const { createOptions, widthStyle, heightStyle } = normalized

    useEffect(() => {
      const requestId = ++requestIdRef.current
      let isMounted = true

      const setupPlayer = async () => {
        if (typeof window === 'undefined') {
          return
        }

        if (!createOptions) {
          if (isMounted && requestId === requestIdRef.current) {
            setIsLoading(false)
            setLoadError(null)
          }
          return
        }

        if (isMounted && requestId === requestIdRef.current) {
          setIsLoading(true)
          setLoadError(null)
        }

        if (!kinescopeApiPromise) {
          kinescopeApiPromise = loadKinescopeApi(KINESCOPE_API_VERSION)
        }

        try {
          const api = await kinescopeApiPromise

          if (!isMounted || requestId !== requestIdRef.current) {
            return
          }

          apiRef.current = api

          const container = containerRef.current
          if (!container) return

          container.innerHTML = ''

          const innerContainer = document.createElement('div')
          innerContainer.id = containerId
          innerContainer.style.width = '100%'
          innerContainer.style.height = '100%'
          container.appendChild(innerContainer)

          const player = await api.create(innerContainer, createOptions)

          const isStale = !isMounted || requestId !== requestIdRef.current

          if (isStale) {
            player?.destroy?.()
            return
          }

          if (!player) {
            throw new Error('Kinescope player instance was not created')
          }

          playerInstanceRef.current = player

          if (player?.Events) {
            const handler = () => {
              onEndedRef.current?.()
            }
            endedHandlerRef.current = handler
            player.on?.(player.Events.Ended, handler)
          }

          if (isMounted && requestId === requestIdRef.current) {
            setIsLoading(false)
          }
        } catch (error) {
          if (isMounted && requestId === requestIdRef.current) {
            kinescopeApiPromise = null
            setIsLoading(false)
            const normalizedError =
              error instanceof Error
                ? error
                : new Error('Failed to initialize Kinescope player')
            setLoadError(normalizedError)
            console.error('Failed to initialize Kinescope player', error)
            onErrorRef.current?.(error)
          }
        }
      }

      setupPlayer()

      return () => {
        isMounted = false

        const player = playerInstanceRef.current
        if (player) {
          if (player.Events && endedHandlerRef.current) {
            player.off?.(player.Events.Ended, endedHandlerRef.current)
          }
          player.destroy?.()
        }
        playerInstanceRef.current = null
        endedHandlerRef.current = null
      }
    }, [createOptions, containerId, attempt])

    const handleRetry = () => {
      setLoadError(null)
      setAttempt(prev => prev + 1)
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
        <div
          ref={containerRef}
          className={cn('h-full w-full', {
            'pointer-events-none opacity-0': isLoading || Boolean(loadError),
          })}
        />
        {isLoading && (
          <Skeleton className="absolute inset-0 z-10 h-full w-full pointer-events-none" />
        )}
        {loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-md border border-destructive/30 bg-background/90 p-4 text-center text-sm text-muted-foreground backdrop-blur-sm">
            <p>Не удалось загрузить видео.</p>
            {/* {loadError.message && (
              <p className="text-xs opacity-70">{loadError.message}</p>
            )} */}
            <Button size="sm" variant="outline" onClick={handleRetry}>
              Повторить попытку
            </Button>
          </div>
        )}
      </div>
    )
  }
)

KinescopePlayer.displayName = 'KinescopePlayer'
