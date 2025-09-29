'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
} from 'react'

import { load as loadKinescopeApi } from '@kinescope/player-iframe-api-loader'

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
  (
    {
      videoId,
      options,
      className,
      style,
      onEnded,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const playerInstanceRef = useRef<KinescopePlayerInstance | null>(null)
    const endedHandlerRef = useRef<((...args: unknown[]) => void) | null>(null)
    const apiRef = useRef<KinescopeApi | null>(null)
    const onEndedRef = useRef(onEnded)
    const requestIdRef = useRef(0)

    const containerId = useMemo(
      () => `kinescope-player-${Math.random().toString(36).slice(2)}`,
      []
    )

    const normalized = useMemo(() => {
      const baseOptions: KinescopePlayerOptions = options
        ? { ...options }
        : {}

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

    useEffect(() => {
      const requestId = ++requestIdRef.current
      let isMounted = true

      const setupPlayer = async () => {
        if (typeof window === 'undefined') {
          return
        }

        if (!normalized.createOptions) {
          return
        }

        if (!kinescopeApiPromise) {
          kinescopeApiPromise = loadKinescopeApi(KINESCOPE_API_VERSION)
        }

        try {
          const api = await kinescopeApiPromise

          if (!isMounted) {
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

          const player = await api.create(
            innerContainer,
            normalized.createOptions
          )

          const isStale = !isMounted || requestId !== requestIdRef.current

          if (isStale) {
            player?.destroy?.()
            return
          }

          if (!player) {
            return
          }

          playerInstanceRef.current = player

          if (player?.Events) {
            const handler = () => {
              onEndedRef.current?.()
            }
            endedHandlerRef.current = handler
            player.on?.(player.Events.Ended, handler)
          }
        } catch (error) {
          if (isMounted && requestId === requestIdRef.current) {
            console.error('Failed to initialize Kinescope player', error)
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
    }, [
      normalized,
      containerId,
    ])

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          width: normalized.widthStyle,
          height: normalized.heightStyle,
          ...style,
        }}
      />
    )
  }
)

KinescopePlayer.displayName = 'KinescopePlayer'
