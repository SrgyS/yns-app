'use client'

import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/shared/ui/skeleton/skeleton'
import { Button } from '@/shared/ui/button'
import { RefreshCw, AlertCircle } from 'lucide-react'

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
  const retryCountRef = useRef(0)
  const [isPlayerReady, setPlayerReady] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    onCompletedRef.current = onCompleted
  }, [onCompleted])

  const completeOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    try { onCompletedRef.current?.() } catch (e) { console.error(e) }
  }

  const resetState = () => {
    setHasError(false)
    setIsRetrying(false)
    setPlayerReady(false)
    retryCountRef.current = 0
  }

  const handleRetry = () => {
    if (isRetrying) return
    setIsRetrying(true)
    setHasError(false)
    retryCountRef.current = 0
    
    // Очищаем предыдущий плеер
    if (playerRef.current) {
      try { playerRef.current.destroy?.() } catch {}
      playerRef.current = null
    }
    
    // Принудительно перезапускаем useEffect через изменение ключа
    attemptRef.current = 0
  }

  useEffect(() => {
    let mounted = true
    const offFns: Array<() => void> = []
    let resizeObserver: ResizeObserver | null = null

    completedRef.current = false
    resetState()

    const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()))

    const initPlayer = async () => {
      const myAttempt = ++attemptRef.current
      inflightRef.current = myAttempt

      const el = containerRef.current
      if (!mounted || !el || !el.isConnected) return
      if (el.clientWidth === 0 || el.clientHeight === 0) return
      if (playerRef.current) return

      try {
        setIsRetrying(false)
        
        // Попробуем загрузить с fallback механизмом
        let loader
        try {
          loader = await import('@kinescope/player-iframe-api-loader')
        } catch (importError) {
          console.warn('Failed to import Kinescope loader:', importError)
          throw importError
        }
        
        let factory
         try {
           factory = await loader.load()
         } catch (loadError) {
           console.warn('Failed to load Kinescope factory with default URL, trying fallback...', loadError)
           
           // Fallback: попробуем загрузить с конкретной версией v2
           try {
             factory = await loader.load('v2.1.0' as any)
           } catch (fallbackError) {
             console.warn('Fallback version also failed:', fallbackError)
             
             // Последний fallback: попробуем с прямым URL
             try {
               const fallbackUrl = new URL('https://player.kinescope.io/v2.1.0/iframe.player.js')
               factory = await loader.load(fallbackUrl)
             } catch (urlError) {
               console.warn('URL fallback also failed:', urlError)
               throw loadError // Бросаем оригинальную ошибку
             }
           }
         }
        
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
        setHasError(false)

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
        
        retryCountRef.current++
        console.warn(`Kinescope init attempt ${retryCountRef.current} failed:`, msg)
        
        // Специальная обработка ошибок загрузки скрипта
        if (/Unable to load script by url.*iframe\.player\.js/i.test(msg)) {
          console.warn('Kinescope script loading failed:', msg)
          
          if (retryCountRef.current >= 3) {
            setHasError(true)
            setIsRetrying(false)
            return
          }
          
          // Retry с увеличивающейся задержкой для script loading errors
          const delay = Math.min(2000 * Math.pow(1.5, retryCountRef.current), 8000)
          setTimeout(() => { 
            if (mounted && !playerRef.current) {
              setIsRetrying(true)
              void initPlayer()
            }
          }, delay)
          return
        }
        
        if (/IFrame already removed|Timeout .* Unable to connect to iframe/i.test(msg)) {
          console.warn('Kinescope iframe connection issue:', msg)
          // При таймауте показываем ошибку если это не первая попытка
          if (retryCountRef.current > 1) {
            setHasError(true)
            setIsRetrying(false)
          } else {
            // Автоматический retry для первого таймаута
            setTimeout(() => { 
              if (mounted && !playerRef.current) {
                setIsRetrying(true)
                void initPlayer()
              }
            }, 2000)
          }
          return
        }
        
        console.error('Kinescope init error', e)
        
        // Показываем ошибку после нескольких попыток
        if (retryCountRef.current >= 3) {
          setHasError(true)
          setIsRetrying(false)
        } else if (/attached to the DOM|not attached|Failed to fetch|ERR_TIMED_OUT/i.test(msg) && !playerRef.current) {
          // Автоматический retry с увеличивающейся задержкой
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000)
          setTimeout(() => { 
            if (mounted && !playerRef.current) {
              setIsRetrying(true)
              void initPlayer()
            }
          }, delay)
        } else {
          setHasError(true)
          setIsRetrying(false)
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
      setHasError(false)
      setIsRetrying(false)
      if (initTimerRef.current) { clearTimeout(initTimerRef.current); initTimerRef.current = null }
      try { offFns.forEach(fn => fn()) } catch {}
      resizeObserver?.disconnect()
      inflightRef.current = null
      const p = playerRef.current
      playerRef.current = null
      try { p?.destroy?.() } catch {}
    }
  }, [videoId, hasError]) // Добавляем hasError в зависимости для перезапуска при retry

  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      <div className="aspect-video relative [&>iframe]:w-full [&>iframe]:h-full">
        {!isPlayerReady && !hasError && (
          <Skeleton className="absolute inset-0 w-full h-full" />
        )}
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-center p-4">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ошибка загрузки видео</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Не удалось загрузить видеоплеер. Проверьте подключение к интернету.
            </p>
            <Button 
              onClick={handleRetry} 
              disabled={isRetrying}
              variant="outline"
              size="sm"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Повторная попытка...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Попробовать снова
                </>
              )}
            </Button>
          </div>
        )}
        {isRetrying && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 text-center p-4">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Загрузка видеоплеера...
            </p>
          </div>
        )}
        <div ref={containerRef} className="absolute inset-0" />
      </div>
    </div>
  )
}

