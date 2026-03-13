'use client'

import { load } from '@kinescope/player-iframe-api-loader'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  buildCreateOptions,
  createPlayerIframe,
  getSourceUrl,
  normalizePlayerError,
  type KinescopePlayerOptions,
} from './kinescope-player.utils'

type IframePlayer = Kinescope.IframePlayer.Player

const WATCHED_PERCENT_THRESHOLD = 95
const PLAYER_READY_TIMEOUT_MS = 4_000
const HIDE_LOADING_DELAY_MS = 150
const MAX_INIT_RETRIES = 1

type UseKinescopeIframePlayerParams = {
  videoId?: string
  options?: KinescopePlayerOptions
  completionState?: boolean
  /**
   * Native player end event only.
   */
  onEnded?: () => void
  /**
   * Domain completion event: 95% watched or native end.
   */
  onWatched?: () => void
  onError?: (error: Error) => void
  onReady?: () => void
  onPlay?: () => void
  onPause?: () => void
}

type UseKinescopeIframePlayerResult = {
  hostRef: React.RefObject<HTMLDivElement | null>
  isLoading: boolean
  sourceUrl?: string
}

const waitForPromise = async (promise: Promise<unknown> | null) => {
  if (promise === null) {
    return
  }

  await promise.catch(() => undefined)
}

const clearTimer = (timerId: number | null): number | null => {
  if (timerId !== null) {
    window.clearTimeout(timerId)
  }

  return null
}

const reasonToText = (reason: unknown): string => {
  if (typeof reason === 'string') {
    return reason
  }

  if (reason instanceof Error) {
    return reason.message
  }

  return ''
}

const isKinescopeConnectTimeout = (reason: unknown): boolean => {
  const reasonText = reasonToText(reason)

  return (
    reasonText.includes('Timeout of 7000ms exceeded') ||
    reasonText.includes('create timeout (7000)')
  )
}

type PlayerSubscriptionParams = {
  player: IframePlayer
  isStale: () => boolean
  markLoaded: () => void
  reportWatched: () => void
  handlePlayerError: (error: unknown) => void
  onEnded?: () => void
  onPlay?: () => void
  onPause?: () => void
}

const subscribeToPlayerEvents = ({
  player,
  isStale,
  markLoaded,
  reportWatched,
  handlePlayerError,
  onEnded,
  onPlay,
  onPause,
}: Readonly<PlayerSubscriptionParams>) => {
  const events = player.Events

  player.on(events.Loaded, () => {
    if (isStale()) {
      return
    }

    markLoaded()
  })

  player.on(events.Play, () => {
    if (isStale()) {
      return
    }

    onPlay?.()
  })

  player.on(events.Pause, () => {
    if (isStale()) {
      return
    }

    onPause?.()
  })

  player.on(events.Ended, () => {
    if (isStale()) {
      return
    }

    onEnded?.()
    reportWatched()
  })

  player.on(events.TimeUpdate, event => {
    if (isStale()) {
      return
    }

    if (event.data.percent < WATCHED_PERCENT_THRESHOLD) {
      return
    }

    reportWatched()
  })

  player.on(events.Error, event => {
    if (isStale()) {
      return
    }

    handlePlayerError(event.data.error)
  })
}

export const useKinescopeIframePlayer = ({
  videoId,
  options,
  completionState,
  onEnded,
  onWatched,
  onError,
  onReady,
  onPlay,
  onPause,
}: Readonly<UseKinescopeIframePlayerParams>): UseKinescopeIframePlayerResult => {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<IframePlayer | null>(null)
  const createPromiseRef = useRef<Promise<IframePlayer> | null>(null)
  const destroyPromiseRef = useRef<Promise<void> | null>(null)
  const generationRef = useRef(0)

  const onEndedRef = useRef(onEnded)
  const onWatchedRef = useRef(onWatched)
  const onErrorRef = useRef(onError)
  const onReadyRef = useRef(onReady)
  const onPlayRef = useRef(onPlay)
  const onPauseRef = useRef(onPause)
  const completionStateRef = useRef(Boolean(completionState))

  const watchedReportedRef = useRef(Boolean(completionState))
  const playbackStartedRef = useRef(false)
  const readyRef = useRef(false)
  const retryCountRef = useRef(0)
  const retryNonceRef = useRef(0)

  const [retryNonce, setRetryNonce] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const sourceUrl = useMemo(() => {
    return getSourceUrl(videoId, options)
  }, [videoId, options])

  const optionsKey = useMemo(() => {
    return options ? JSON.stringify(options) : ''
  }, [options])

  const stableOptions = useMemo<KinescopePlayerOptions | undefined>(() => {
    if (!optionsKey) {
      return undefined
    }

    return JSON.parse(optionsKey) as KinescopePlayerOptions
  }, [optionsKey])

  useEffect(() => {
    onEndedRef.current = onEnded
    onWatchedRef.current = onWatched
    onErrorRef.current = onError
    onReadyRef.current = onReady
    onPlayRef.current = onPlay
    onPauseRef.current = onPause
  }, [onEnded, onWatched, onError, onReady, onPlay, onPause])

  useEffect(() => {
    completionStateRef.current = Boolean(completionState)
    watchedReportedRef.current = Boolean(completionState)
  }, [completionState])

  useEffect(() => {
    watchedReportedRef.current = completionStateRef.current
    playbackStartedRef.current = false
    readyRef.current = false
    retryCountRef.current = 0
    retryNonceRef.current = 0
    setRetryNonce(0)
    setIsLoading(Boolean(sourceUrl))
  }, [sourceUrl, optionsKey])

  useEffect(() => {
    if (!sourceUrl || !hostRef.current) {
      return
    }

    const generation = ++generationRef.current
    let cancelled = false
    let readyTimeoutId: number | null = null
    let hideLoadingTimeoutId: number | null = null

    const isStale = () => {
      return cancelled || generation !== generationRef.current
    }

    const clearTimers = () => {
      readyTimeoutId = clearTimer(readyTimeoutId)
      hideLoadingTimeoutId = clearTimer(hideLoadingTimeoutId)
    }

    const stopLoading = () => {
      if (isStale()) {
        return
      }

      setIsLoading(false)
    }

    const reportWatched = () => {
      if (!playbackStartedRef.current) {
        return
      }

      if (watchedReportedRef.current) {
        return
      }

      watchedReportedRef.current = true
      onWatchedRef.current?.()
    }

    const markLoaded = () => {
      if (isStale()) {
        return
      }

      readyRef.current = true
      readyTimeoutId = clearTimer(readyTimeoutId)
      hideLoadingTimeoutId = clearTimer(hideLoadingTimeoutId)

      hideLoadingTimeoutId = window.setTimeout(() => {
        stopLoading()
      }, HIDE_LOADING_DELAY_MS)

      onReadyRef.current?.()
    }

    const handlePlayerError = (error: unknown) => {
      if (isStale()) {
        return
      }

      clearTimers()
      stopLoading()
      onErrorRef.current?.(normalizePlayerError(error))
    }

    const startReadyTimeout = () => {
      readyTimeoutId = window.setTimeout(() => {
        if (isStale()) {
          return
        }

        if (readyRef.current) {
          return
        }

        if (retryCountRef.current >= MAX_INIT_RETRIES) {
          stopLoading()
          return
        }

        retryCountRef.current += 1
        retryNonceRef.current += 1
        setRetryNonce(retryNonceRef.current)
      }, PLAYER_READY_TIMEOUT_MS)
    }

    const destroyCurrentPlayer = async () => {
      clearTimers()
      await waitForPromise(createPromiseRef.current)

      const currentPlayer = playerRef.current
      playerRef.current = null
      readyRef.current = false

      if (currentPlayer === null) {
        hostRef.current?.replaceChildren()
        return
      }

      const destroyPromise = currentPlayer.destroy().catch(() => undefined)
      destroyPromiseRef.current = destroyPromise
      await destroyPromise

      if (destroyPromiseRef.current === destroyPromise) {
        destroyPromiseRef.current = null
      }

      hostRef.current?.replaceChildren()
    }

    const initPlayer = async () => {
      try {
        await waitForPromise(destroyPromiseRef.current)
        await destroyCurrentPlayer()

        if (isStale() || !hostRef.current) {
          return
        }

        const iframe = createPlayerIframe(hostRef.current)
        const factory = await load()

        if (isStale()) {
          return
        }

        const createPromise = factory.create(
          iframe,
          buildCreateOptions(sourceUrl, stableOptions)
        )
        createPromiseRef.current = createPromise
        const player = await createPromise

        if (createPromiseRef.current === createPromise) {
          createPromiseRef.current = null
        }

        if (isStale()) {
          await player.destroy().catch(() => undefined)
          return
        }

        playerRef.current = player

        subscribeToPlayerEvents({
          player,
          isStale,
          markLoaded,
          reportWatched,
          handlePlayerError,
          onEnded: onEndedRef.current,
          onPlay: () => {
            playbackStartedRef.current = true
            onPlayRef.current?.()
          },
          onPause: onPauseRef.current,
        })

        startReadyTimeout()
      } catch (error) {
        createPromiseRef.current = null
        handlePlayerError(error)
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isKinescopeConnectTimeout(event.reason)) {
        event.preventDefault()
      }
    }

    void initPlayer()
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      cancelled = true
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      )
      void destroyCurrentPlayer()
    }
  }, [sourceUrl, stableOptions, retryNonce])

  return {
    hostRef,
    isLoading,
    sourceUrl,
  }
}
