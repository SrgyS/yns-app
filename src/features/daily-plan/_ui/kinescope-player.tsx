'use client'

import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'

type Props = { videoId: string; onCompleted?: () => void }

export const Player = ({ videoId, onCompleted }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  const completedRef = useRef(false)
  const onCompletedRef = useRef(onCompleted)
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptRef = useRef(0)
  const inflightRef = useRef<number | null>(null)
  const lastTU = useRef(0)
  const [isPlayerReady, setPlayerReady] = useState(false)

  useEffect(() => {
    onCompletedRef.current = onCompleted
  }, [onCompleted])

  const completeOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    try { onCompletedRef.current?.() } catch (e) { console.error(e) }
  }

  useEffect(() => {
    let mounted = true
    const offFns: Array<() => void> = []
    let resizeObserver: ResizeObserver | null = null

    completedRef.current = false

    const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()))

    const initPlayer = async () => {
      const myAttempt = ++attemptRef.current
      inflightRef.current = myAttempt

      const el = containerRef.current
      if (!mounted || !el || !el.isConnected) return
      if (el.clientWidth === 0 || el.clientHeight === 0) return
      if (playerRef.current) return

      try {
        const loader = await import('@kinescope/player-iframe-api-loader')
        const factory = await loader.load()
        if (!mounted || inflightRef.current !== myAttempt) return

        await nextFrame(); await nextFrame() // стабилизация layout

        if (!mounted || inflightRef.current !== myAttempt) return
        if (!el.isConnected || el.clientWidth === 0 || el.clientHeight === 0 || playerRef.current) return

        const player = await factory.create(el, {
          url: `https://kinescope.io/embed/${videoId}`,
        } as any)

        if (!mounted || inflightRef.current !== myAttempt) { try { player?.destroy?.() } catch {} ; return }

        playerRef.current = player
        setPlayerReady(true)

        const onEnded = () => completeOnce()
        const onTimeUpdate = (evt: any) => {
          const now = Date.now()
          if (now - lastTU.current < 500) return // троттлинг
          lastTU.current = now

          if (completedRef.current) return
          const dur = evt?.data?.duration ?? player.getDuration?.()
          const cur = evt?.data?.currentTime ?? player.getCurrentTime?.()
          if (typeof dur === 'number' && dur > 0 && typeof cur === 'number') {
            if (cur / dur >= 0.97) completeOnce()
          }
        }
        const onProgress = (evt: any) => {
          if (completedRef.current) return
          const dur = evt?.data?.duration ?? player.getDuration?.()
          const buf = evt?.data?.bufferedTime
          if (typeof dur === 'number' && dur > 0 && typeof buf === 'number' && buf / dur >= 0.95) {
            completeOnce()
          }
        }

        const on = player.on?.bind(player)
        const off = player.off?.bind(player)
        const E = player.Events

        on?.(E.Ended, onEnded)
        offFns.push(() => off?.(E.Ended, onEnded))

        on?.(E.TimeUpdate, onTimeUpdate)
        offFns.push(() => off?.(E.TimeUpdate, onTimeUpdate))

        on?.(E.Progress, onProgress)
        offFns.push(() => off?.(E.Progress, onProgress))
      } catch (e: any) {
        const msg = e?.message ?? String(e)
        if (!mounted || inflightRef.current !== myAttempt) return
        if (/IFrame already removed|Timeout .* Unable to connect to iframe/i.test(msg)) {
          console.warn('Kinescope init warn:', msg)
          return
        }
        console.error('Kinescope init error', e)
        if (/attached to the DOM|not attached/i.test(msg) && !playerRef.current) {
          setTimeout(() => { if (mounted && !playerRef.current) void initPlayer() }, 120)
        }
      }
    }

    const scheduleInit = () => {
      if (initTimerRef.current) clearTimeout(initTimerRef.current)
      initTimerRef.current = setTimeout(() => { if (mounted) void initPlayer() }, 160)
    }

    scheduleInit()

    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        const el = containerRef.current
        if (!mounted || !el) return
        if (!playerRef.current && el.isConnected && el.clientWidth > 0 && el.clientHeight > 0) {
          scheduleInit()
        }
      })
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      mounted = false
      setPlayerReady(false)
      if (initTimerRef.current) { clearTimeout(initTimerRef.current); initTimerRef.current = null }
      try { offFns.forEach(fn => fn()) } catch {}
      resizeObserver?.disconnect()
      inflightRef.current = null
      const p = playerRef.current
      playerRef.current = null
      try { p?.destroy?.() } catch {}
    }
  }, [videoId])

  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      <div className="aspect-video relative [&>iframe]:w-full [&>iframe]:h-full">
        {!isPlayerReady && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        <div ref={containerRef} className="absolute inset-0" />
      </div>
    </div>
  )
}

