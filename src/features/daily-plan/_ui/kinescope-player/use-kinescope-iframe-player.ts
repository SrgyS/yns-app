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
}: UseKinescopeIframePlayerParams): UseKinescopeIframePlayerResult => {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<IframePlayer | null>(null)
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

    const clearReadyTimeout = () => {
      if (readyTimeoutId !== null) {
        window.clearTimeout(readyTimeoutId)
        readyTimeoutId = null
      }
    }

    const clearHideLoadingTimeout = () => {
      if (hideLoadingTimeoutId !== null) {
        window.clearTimeout(hideLoadingTimeoutId)
        hideLoadingTimeoutId = null
      }
    }

    const destroyCurrentPlayer = async () => {
      clearReadyTimeout()
      clearHideLoadingTimeout()

      const currentPlayer = playerRef.current
      playerRef.current = null
      readyRef.current = false

      if (!currentPlayer) {
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

    const startReadyTimeout = () => {
      readyTimeoutId = window.setTimeout(() => {
        if (cancelled || generation !== generationRef.current) {
          return
        }

        if (readyRef.current) {
          return
        }

        if (retryCountRef.current >= MAX_INIT_RETRIES) {
          setIsLoading(false)
          return
        }

        retryCountRef.current += 1
        setRetryNonce(current => current + 1)
      }, PLAYER_READY_TIMEOUT_MS)
    }

    const markLoaded = () => {
      if (cancelled || generation !== generationRef.current) {
        return
      }

      readyRef.current = true
      clearReadyTimeout()
      clearHideLoadingTimeout()

      hideLoadingTimeoutId = window.setTimeout(() => {
        if (cancelled || generation !== generationRef.current) {
          return
        }

        setIsLoading(false)
      }, HIDE_LOADING_DELAY_MS)

      onReadyRef.current?.()
    }

    const initPlayer = async () => {
      try {
        const pendingDestroy = destroyPromiseRef.current
        if (pendingDestroy !== null) {
          await pendingDestroy
        }

        await destroyCurrentPlayer()

        if (
          cancelled ||
          generation !== generationRef.current ||
          !hostRef.current
        ) {
          return
        }

        const iframe = createPlayerIframe(hostRef.current)
        const factory = await load()

        if (cancelled || generation !== generationRef.current) {
          return
        }

        const player = await factory.create(
          iframe,
          buildCreateOptions(sourceUrl, stableOptions)
        )

        if (cancelled || generation !== generationRef.current) {
          await player.destroy().catch(() => undefined)
          return
        }

        playerRef.current = player
        const events = player.Events

        player.on(events.Loaded, () => {
          markLoaded()
        })

        player.on(events.Play, () => {
          if (cancelled || generation !== generationRef.current) {
            return
          }

          playbackStartedRef.current = true
          onPlayRef.current?.()
        })

        player.on(events.Pause, () => {
          if (cancelled || generation !== generationRef.current) {
            return
          }

          onPauseRef.current?.()
        })

        player.on(events.Ended, () => {
          if (cancelled || generation !== generationRef.current) {
            return
          }

          onEndedRef.current?.()
          reportWatched()
        })

        player.on(events.TimeUpdate, event => {
          if (cancelled || generation !== generationRef.current) {
            return
          }

          if (!playbackStartedRef.current || watchedReportedRef.current) {
            return
          }

          if (event.data.percent >= WATCHED_PERCENT_THRESHOLD) {
            reportWatched()
          }
        })

        player.on(events.Error, event => {
          if (cancelled || generation !== generationRef.current) {
            return
          }

          clearReadyTimeout()
          clearHideLoadingTimeout()
          setIsLoading(false)
          onErrorRef.current?.(normalizePlayerError(event.data.error))
        })

        startReadyTimeout()
      } catch (error) {
        if (cancelled || generation !== generationRef.current) {
          return
        }

        clearReadyTimeout()
        clearHideLoadingTimeout()
        setIsLoading(false)
        onErrorRef.current?.(normalizePlayerError(error))
      }
    }

    void initPlayer()

    return () => {
      cancelled = true
      void destroyCurrentPlayer()
    }
  }, [sourceUrl, stableOptions, retryNonce])

  return {
    hostRef,
    isLoading,
    sourceUrl,
  }
}
