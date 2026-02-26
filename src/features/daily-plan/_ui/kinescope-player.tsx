'use client'

import {
  forwardRef,
  useCallback,
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

type RefCell<T> = {
  current: T
}

type PlayerHandlerRefs = {
  endedHandlerRef: RefCell<((...args: unknown[]) => void) | null>
  playHandlerRef: RefCell<((...args: unknown[]) => void) | null>
  pauseHandlerRef: RefCell<((...args: unknown[]) => void) | null>
}

type PlayerCallbackRefs = {
  onEndedRef: RefCell<(() => void) | undefined>
  onPlayRef: RefCell<(() => void) | undefined>
  onPauseRef: RefCell<(() => void) | undefined>
}

type PlayerState = {
  isLoading: boolean
  loadError: Error | null
}

export type KinescopePlayerProps = {
  videoId?: string
  options?: KinescopePlayerOptions
  className?: string
  style?: CSSProperties
  onEnded?: () => void
  onError?: (error: unknown) => void
  onPlay?: () => void
  onPause?: () => void
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

function bindPlayerHandlers(
  player: KinescopePlayerInstance,
  handlerRefs: PlayerHandlerRefs,
  callbackRefs: PlayerCallbackRefs
) {
  if (!player.Events || !player.on) {
    return
  }

  const endedHandler = () => {
    const onEndedCurrent = callbackRefs.onEndedRef.current
    if (onEndedCurrent) {
      onEndedCurrent()
    }
  }
  const playHandler = () => {
    const onPlayCurrent = callbackRefs.onPlayRef.current
    if (onPlayCurrent) {
      onPlayCurrent()
    }
  }
  const pauseHandler = () => {
    const onPauseCurrent = callbackRefs.onPauseRef.current
    if (onPauseCurrent) {
      onPauseCurrent()
    }
  }

  handlerRefs.endedHandlerRef.current = endedHandler
  handlerRefs.playHandlerRef.current = playHandler
  handlerRefs.pauseHandlerRef.current = pauseHandler
  player.on(player.Events.Ended, endedHandler)
  player.on(player.Events.Play, playHandler)
  player.on(player.Events.Playing, playHandler)
  player.on(player.Events.Pause, pauseHandler)
}

function resetPlayerHandlers(
  handlerRefs: Pick<
    PlayerHandlerRefs,
    'endedHandlerRef' | 'playHandlerRef' | 'pauseHandlerRef'
  >
) {
  handlerRefs.endedHandlerRef.current = null
  handlerRefs.playHandlerRef.current = null
  handlerRefs.pauseHandlerRef.current = null
}

function ensureKinescopeApi(): Promise<KinescopeApi> {
  const resolvedApiPromise =
    kinescopeApiPromise ?? loadKinescopeApi(KINESCOPE_API_VERSION)
  kinescopeApiPromise = resolvedApiPromise

  return resolvedApiPromise
}

function preparePlayerContainer(
  container: HTMLDivElement | null,
  containerId: string
): HTMLDivElement | null {
  if (!container) {
    return null
  }

  container.innerHTML = ''

  const innerContainer = document.createElement('div')
  innerContainer.id = containerId
  innerContainer.style.width = '100%'
  innerContainer.style.height = '100%'
  container.appendChild(innerContainer)

  return innerContainer
}

function createPlayerNotCreatedError() {
  return new Error('Kinescope player instance was not created')
}

function normalizePlayerInitializationError(error: unknown): Error {
  if (error instanceof Error) {
    return error
  }
  return new Error('Failed to initialize Kinescope player')
}

export const KinescopePlayer = forwardRef<PlayerHandle, KinescopePlayerProps>(
  (
    { videoId, options, className, style, onEnded, onError, onPlay, onPause },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const playerInstanceRef = useRef<KinescopePlayerInstance | null>(null)
    const endedHandlerRef = useRef<((...args: unknown[]) => void) | null>(null)
    const playHandlerRef = useRef<((...args: unknown[]) => void) | null>(null)
    const pauseHandlerRef = useRef<((...args: unknown[]) => void) | null>(null)
    const apiRef = useRef<KinescopeApi | null>(null)
    const onEndedRef = useRef(onEnded)
    const onErrorRef = useRef(onError)
    const onPlayRef = useRef(onPlay)
    const onPauseRef = useRef(onPause)
    const requestIdRef = useRef(0)
    const [{ isLoading, loadError }, setPlayerState] = useState({
      isLoading: false,
      loadError: null as Error | null,
    })
    const [attempt, setAttempt] = useState(0)

    const [containerId] = useState(
      () => `kinescope-player-${Math.random().toString(36).slice(2)}`
    )

    const normalized = useMemo(() => {
      const baseOptions: KinescopePlayerOptions = { ...options }
      const size = { ...baseOptions.size }

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

    useEffect(() => {
      onPlayRef.current = onPlay
    }, [onPlay])

    useEffect(() => {
      onPauseRef.current = onPause
    }, [onPause])

    const detachPlayerHandlers = useCallback(
      (player: KinescopePlayerInstance | null) => {
        if (!player?.Events) {
          return
        }

        if (endedHandlerRef.current) {
          player.off?.(player.Events.Ended, endedHandlerRef.current)
          endedHandlerRef.current = null
        }

        if (playHandlerRef.current) {
          player.off?.(player.Events.Play, playHandlerRef.current)
          player.off?.(player.Events.Playing, playHandlerRef.current)
          playHandlerRef.current = null
        }

        if (pauseHandlerRef.current) {
          player.off?.(player.Events.Pause, pauseHandlerRef.current)
          pauseHandlerRef.current = null
        }
      },
      []
    )

    const destroyPlayerInstance = useCallback(
      async (
        player: KinescopePlayerInstance | null,
        reason: 'cleanup' | 'imperative' | 'stale'
      ) => {
        if (!player?.destroy) {
          return
        }

        try {
          await player.destroy()
        } catch (destroyError) {
          console.warn(
            `Kinescope player destroy failed (${reason})`,
            destroyError
          )
        }
      },
      []
    )

    useImperativeHandle(
      ref,
      () => ({
        destroy() {
          const player = playerInstanceRef.current
          if (player) {
            detachPlayerHandlers(player)
            void destroyPlayerInstance(player, 'imperative')
          }
          playerInstanceRef.current = null
          resetPlayerHandlers({
            endedHandlerRef,
            playHandlerRef,
            pauseHandlerRef,
          })
        },
        getInstance() {
          return playerInstanceRef.current
        },
      })
    )

    const { createOptions, widthStyle, heightStyle } = normalized

    useEffect(() => {
      const requestId = ++requestIdRef.current
      let isMounted = true
      const isCurrentRequest = () =>
        isMounted && requestId === requestIdRef.current
      const setStateIfCurrent = (nextState: PlayerState) => {
        if (isCurrentRequest()) {
          setPlayerState(nextState)
        }
      }

      const handlePlayerInitializationError = (error: unknown) => {
        if (!isCurrentRequest()) {
          return
        }

        const normalizedError = normalizePlayerInitializationError(error)
        kinescopeApiPromise = null
        setPlayerState({
          isLoading: false,
          loadError: normalizedError,
        })
        console.error('Failed to initialize Kinescope player', error)
        const onErrorCurrent = onErrorRef.current
        if (onErrorCurrent) {
          onErrorCurrent(error)
        }
      }

      const setupPlayer = async () => {
        if (typeof window === 'undefined') {
          return
        }

        if (!createOptions) {
          setStateIfCurrent({
            isLoading: false,
            loadError: null,
          })
          return
        }

        setStateIfCurrent({
          isLoading: true,
          loadError: null,
        })

        const api = await ensureKinescopeApi()

        if (!isCurrentRequest()) {
          return
        }

        apiRef.current = api

        const innerContainer = preparePlayerContainer(
          containerRef.current,
          containerId
        )
        if (!innerContainer) {
          return
        }

        const player = await api.create(innerContainer, createOptions)

        if (!isCurrentRequest()) {
          detachPlayerHandlers(player)
          await destroyPlayerInstance(player, 'stale')
          return
        }

        if (!player) {
          const createError = createPlayerNotCreatedError()
          setStateIfCurrent({
            isLoading: false,
            loadError: createError,
          })
          console.error('Failed to initialize Kinescope player', createError)
          const onErrorCurrent = onErrorRef.current
          if (onErrorCurrent) {
            onErrorCurrent(createError)
          }
          return
        }

        playerInstanceRef.current = player

        bindPlayerHandlers(
          player,
          {
            endedHandlerRef,
            playHandlerRef,
            pauseHandlerRef,
          },
          {
            onEndedRef,
            onPlayRef,
            onPauseRef,
          }
        )

        setStateIfCurrent({
          isLoading: false,
          loadError: null,
        })
      }

      void setupPlayer().catch(handlePlayerInitializationError)

      return () => {
        isMounted = false

        const player = playerInstanceRef.current
        if (player) {
          detachPlayerHandlers(player)
          void destroyPlayerInstance(player, 'cleanup')
        }
        playerInstanceRef.current = null
        resetPlayerHandlers({
          endedHandlerRef,
          playHandlerRef,
          pauseHandlerRef,
        })
      }
    }, [
      attempt,
      containerId,
      createOptions,
      destroyPlayerInstance,
      detachPlayerHandlers,
    ])

    const handleRetry = () => {
      setPlayerState(previousState => ({
        ...previousState,
        loadError: null,
      }))
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
          className={cn(
            'h-full w-full [&>div]:h-full [&>div]:w-full [&>div>iframe]:h-full! [&>div>iframe]:w-full!',
            {
              'pointer-events-none opacity-0': isLoading || Boolean(loadError),
            }
          )}
        />
        {isLoading && (
          <Skeleton className="absolute inset-0 z-10 h-full w-full pointer-events-none" />
        )}
        {loadError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl border border-destructive/30 bg-background/90 p-4 text-center text-sm text-muted-foreground backdrop-blur-sm">
            <p>Не удалось загрузить видео.</p>
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
