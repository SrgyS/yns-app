'use client'

import { useEffect, useRef } from 'react'

type Props = {
  videoId: string
  onCompleted?: () => void
}

export const Player = ({ videoId, onCompleted }: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<any>(null)
  const completedRef = useRef(false)
  const onCompletedRef = useRef(onCompleted)
  const initTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const attemptRef = useRef(0)
  const inflightRef = useRef<number | null>(null)

  // Держим актуальный обработчик завершения в ref, чтобы не пересоздавать плеер из-за смены пропса
  useEffect(() => {
    onCompletedRef.current = onCompleted
  }, [onCompleted])

  const completeOnce = () => {
    if (completedRef.current) return
    completedRef.current = true
    try {
      onCompletedRef.current?.()
    } catch (e) {
      console.error('onCompleted handler error', e)
    }
  }

  useEffect(() => {
    let mounted = true
    const offFns: Array<() => void> = []
    let resizeObserver: ResizeObserver | null = null

    // Сброс флага завершения при смене видео
    completedRef.current = false

    const nextFrame = () =>
      new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

    const initPlayer = async () => {
      const myAttempt = ++attemptRef.current
      inflightRef.current = myAttempt

      if (!mounted) return
      const el = containerRef.current
      if (!el || !el.isConnected) return
      // Инициализируем только если есть размеры и ещё не инициализировано
      if (el.clientWidth === 0 || el.clientHeight === 0) return
      if (playerRef.current) return

      try {
        // Очистим контейнер перед созданием нового инстанса
        el.innerHTML = ''

        const loader = await import('@kinescope/player-iframe-api-loader')
        const factory = await loader.load()
        if (!mounted) return

        // Дождаться стабилизации layout (двойной кадр) и перепроверить соединение/размеры
        await nextFrame()
        await nextFrame()

        // Если за время ожидания попытка изменилась — отменяем
        if (!mounted || inflightRef.current !== myAttempt) return

        const current = containerRef.current
        if (
          !current ||
          current !== el ||
          !current.isConnected ||
          current.clientWidth === 0 ||
          current.clientHeight === 0 ||
          playerRef.current
        ) {
          return
        }

        const player = await factory.create(current, {
          url: `https://kinescope.io/embed/${videoId}`,
        } as any)

        // Если к моменту создания попытка уже неактуальна — сразу уничтожаем и выходим
        if (!mounted || inflightRef.current !== myAttempt) {
          try {
            ;(player as any)?.destroy?.()
          } catch {}
          return
        }

        playerRef.current = player

        const handleEnded = () => {
          // Не разрушаем плеер — только сообщаем наверх
          completeOnce()
        }

        const handleTimeUpdate = (data: any) => {
          if (completedRef.current) return
          const duration = (data && data.duration) ?? player.getDuration?.()
          const currentTime = (data && data.currentTime) ?? player.getCurrentTime?.()
          if (typeof duration === 'number' && duration > 0 && typeof currentTime === 'number') {
            const progress = currentTime / duration
            if (progress >= 0.97) {
              completeOnce()
            }
          }
        }

        const handleProgress = (data: any) => {
          if (completedRef.current) return
          const duration = (data && data.duration) ?? player.getDuration?.()
          const bufferedTime = data && data.bufferedTime
          if (typeof duration === 'number' && duration > 0 && typeof bufferedTime === 'number') {
            const progress = bufferedTime / duration
            if (progress >= 0.97) {
              completeOnce()
            }
          }
        }

        const on = (player as any).on?.bind(player)
        const off = (player as any).off?.bind(player)
        if (on) {
          on('ended', handleEnded as any)
          offFns.push(() => off?.('ended', handleEnded as any))

          on('timeupdate', handleTimeUpdate as any)
          offFns.push(() => off?.('timeupdate', handleTimeUpdate as any))

          on('progress', handleProgress as any)
          offFns.push(() => off?.('progress', handleProgress as any))
        }
      } catch (e: any) {
        const msg = e?.message ?? String(e)
        // Если компонент уже размонтирован или попытка устарела — не логируем и не ретраим
        if (!mounted || inflightRef.current !== myAttempt) {
          return
        }
        // Ожидаемые ошибки при быстром переключении: iframe удалён, таймаут соединения
        if (/IFrame already removed|Timeout .* Unable to connect to iframe/i.test(msg)) {
          // eslint-disable-next-line no-console
          console.warn('Kinescope Iframe API init (expected) warn:', msg)
          return
        }
        // eslint-disable-next-line no-console
        console.error('Kinescope Iframe API init error', e)
        // Мягкий ретрай, если элемент оказался отсоединён в момент create
        if (
          mounted &&
          !playerRef.current &&
          /attached to the DOM|not attached/i.test(msg)
        ) {
          setTimeout(() => {
            if (mounted && !playerRef.current) void initPlayer()
          }, 120)
        }
      }
    }

    const scheduleInit = () => {
      if (initTimerRef.current) clearTimeout(initTimerRef.current)
      initTimerRef.current = setTimeout(() => {
        if (!mounted) return
        void initPlayer()
      }, 180)
    }

    // Пытаемся инициализировать сразу, если размеры уже есть (с небольшой задержкой для стабильности)
    scheduleInit()

    // Наблюдаем за размерами контейнера — как только появятся, инициализируем
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (!mounted) return
        const el = containerRef.current
        if (!el) return
        // Если плеер не создан, контейнер подключён и размеры > 0 — инициируем с дебаунсом
        if (!playerRef.current && el.isConnected && el.clientWidth > 0 && el.clientHeight > 0) {
          scheduleInit()
        }
      })
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      mounted = false
      if (initTimerRef.current) {
        clearTimeout(initTimerRef.current)
        initTimerRef.current = null
      }
      try {
        offFns.forEach((fn) => fn())
      } catch {}
      resizeObserver?.disconnect()
      const p = playerRef.current
      playerRef.current = null
      inflightRef.current = null
      try {
        p?.destroy?.()
      } catch {}
    }
  }, [videoId])

  return (
    <div className="relative w-full overflow-hidden rounded-lg">
      <div className="aspect-video relative [&>iframe]:w-full [&>iframe]:h-full">
        <div ref={containerRef} className=" absolute inset-0" />
      </div>
   </div>
  )
}
