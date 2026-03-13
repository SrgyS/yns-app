import { act, render, screen } from '@testing-library/react'
import React from 'react'

import { useKinescopeIframePlayer } from './use-kinescope-iframe-player'
import type { KinescopePlayerOptions } from './kinescope-player.utils'

const loadMock = jest.fn()

jest.mock('@kinescope/player-iframe-api-loader', () => ({
  load: () => loadMock(),
}))

type HarnessProps = {
  completionState?: boolean
  onWatched?: () => void
}

const options: KinescopePlayerOptions = {
  behavior: { preload: 'metadata' },
}

function Harness({ completionState = false, onWatched }: Readonly<HarnessProps>) {
  const { hostRef, isLoading } = useKinescopeIframePlayer({
    videoId: 'video-1',
    options,
    completionState,
    onWatched,
  })

  return (
    <div>
      <div ref={hostRef} />
      <div data-testid="loading">{String(isLoading)}</div>
    </div>
  )
}

describe('useKinescopeIframePlayer', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    loadMock.mockReset()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('does not reinitialize player or show loader when completionState changes', async () => {
    type MockEventName =
      | 'Loaded'
      | 'Play'
      | 'Pause'
      | 'Ended'
      | 'TimeUpdate'
      | 'Error'
    type MockEvent = { data?: { percent?: number; error?: unknown } }
    type Handler = (event: MockEvent) => void

    interface MockPlayer {
      Events: Record<MockEventName, MockEventName>
      on: (event: MockEventName, handler: Handler) => MockPlayer
      destroy: () => Promise<void>
    }

    const handlers = new Map<MockEventName, Handler[]>()

    const player: MockPlayer = {
      Events: {
        Loaded: 'Loaded',
        Play: 'Play',
        Pause: 'Pause',
        Ended: 'Ended',
        TimeUpdate: 'TimeUpdate',
        Error: 'Error',
      },
      on: jest.fn((event: MockEventName, handler: Handler) => {
        const next = handlers.get(event) ?? []
        handlers.set(event, [...next, handler])
        return player
      }),
      destroy: jest.fn(async () => undefined),
    }

    const createMock = jest.fn(async () => player)

    loadMock.mockResolvedValue({
      create: createMock,
    })

    const { rerender } = render(<Harness completionState={false} />)

    expect(screen.getByTestId('loading').textContent).toBe('true')

    await act(async () => {
      await Promise.resolve()
    })

    const loadedHandlers = handlers.get('Loaded') ?? []

    await act(async () => {
      loadedHandlers.forEach(handler => handler({}))
    })

    await act(async () => {
      jest.advanceTimersByTime(250)
    })

    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(createMock).toHaveBeenCalledTimes(1)

    rerender(<Harness completionState />)

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByTestId('loading').textContent).toBe('false')
    expect(createMock).toHaveBeenCalledTimes(1)
  })

  test('fires onWatched once when time update reaches threshold after playback start', async () => {
    type MockEventName =
      | 'Loaded'
      | 'Play'
      | 'Pause'
      | 'Ended'
      | 'TimeUpdate'
      | 'Error'
    type MockEvent = { data?: { percent?: number; error?: unknown } }
    type Handler = (event: MockEvent) => void

    interface MockPlayer {
      Events: Record<MockEventName, MockEventName>
      on: (event: MockEventName, handler: Handler) => MockPlayer
      destroy: () => Promise<void>
    }

    const onWatched = jest.fn()
    const handlers = new Map<MockEventName, Handler[]>()

    const player: MockPlayer = {
      Events: {
        Loaded: 'Loaded',
        Play: 'Play',
        Pause: 'Pause',
        Ended: 'Ended',
        TimeUpdate: 'TimeUpdate',
        Error: 'Error',
      },
      on: jest.fn((event: MockEventName, handler: Handler) => {
        const next = handlers.get(event) ?? []
        handlers.set(event, [...next, handler])
        return player
      }),
      destroy: jest.fn(async () => undefined),
    }

    loadMock.mockResolvedValue({
      create: jest.fn(async () => player),
    })

    render(
      <Harness
        completionState={false}
        onWatched={onWatched}
      />
    )

    await act(async () => {
      await Promise.resolve()
    })

    const loadedHandlers = handlers.get('Loaded') ?? []

    await act(async () => {
      loadedHandlers.forEach(handler => handler({}))
      jest.advanceTimersByTime(250)
    })

    const playHandlers = handlers.get('Play') ?? []
    const timeUpdateHandlers = handlers.get('TimeUpdate') ?? []

    await act(async () => {
      timeUpdateHandlers.forEach(handler => handler({ data: { percent: 99 } }))
    })
    expect(onWatched).toHaveBeenCalledTimes(0)

    await act(async () => {
      playHandlers.forEach(handler => handler({}))
      timeUpdateHandlers.forEach(handler => handler({ data: { percent: 94 } }))
    })
    expect(onWatched).toHaveBeenCalledTimes(0)

    await act(async () => {
      timeUpdateHandlers.forEach(handler => handler({ data: { percent: 95 } }))
      timeUpdateHandlers.forEach(handler => handler({ data: { percent: 100 } }))
    })
    expect(onWatched).toHaveBeenCalledTimes(1)
  })
})
