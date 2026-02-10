import React, { useState } from 'react'
import { act, render, screen } from '@testing-library/react'

import {
  ComposeChildren,
  createStrictContext,
  useAppearanceDelay,
  useEventCallback,
  useStrictContext,
} from './react'

describe('react helpers', () => {
  test('useStrictContext throws when provider is missing', () => {
    const Ctx = createStrictContext<string>()
    const Consumer = () => {
      useStrictContext(Ctx)
      return null
    }

    expect(() => render(<Consumer />)).toThrow('Strict context not passed')
  })

  test('useAppearanceDelay respects delays', () => {
    jest.useFakeTimers()
    const Example = ({ show }: { show: boolean }) => {
      const visible = useAppearanceDelay(show, {
        appearenceDelay: 200,
        minDisplay: 300,
      })
      return <div data-testid="value">{String(visible)}</div>
    }

    const { rerender } = render(<Example show={false} />)
    expect(screen.getByTestId('value').textContent).toBe('false')

    rerender(<Example show />)
    act(() => {
      jest.advanceTimersByTime(199)
    })
    expect(screen.getByTestId('value').textContent).toBe('false')
    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(screen.getByTestId('value').textContent).toBe('true')

    rerender(<Example show={false} />)
    act(() => {
      jest.advanceTimersByTime(299)
    })
    expect(screen.getByTestId('value').textContent).toBe('true')
    act(() => {
      jest.advanceTimersByTime(1)
    })
    expect(screen.getByTestId('value').textContent).toBe('false')

    jest.useRealTimers()
  })

  test('ComposeChildren nests wrappers around the last child', () => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <div data-testid="wrapper">{children}</div>
    )
    const Outer = ({ children }: { children: React.ReactNode }) => (
      <section data-testid="outer">{children}</section>
    )

    render(
      <ComposeChildren>
        <Outer />
        <Wrapper />
        <span data-testid="content">Hello</span>
      </ComposeChildren>
    )

    const content = screen.getByTestId('content')
    expect(content.closest('[data-testid="wrapper"]')).not.toBeNull()
    expect(content.closest('[data-testid="outer"]')).not.toBeNull()
  })

  test('useEventCallback always calls the latest handler', () => {
    const calls: string[] = []
    const Example = () => {
      const [value, setValue] = useState('a')
      const handler = useEventCallback(() => {
        calls.push(value)
      })
      return (
        <button
          type="button"
          onClick={() => {
            handler()
            setValue('b')
          }}
        >
          click
        </button>
      )
    }

    const { getByRole } = render(<Example />)
    act(() => {
      getByRole('button').click()
    })
    act(() => {
      getByRole('button').click()
    })

    expect(calls).toEqual(['a', 'b'])
  })
})
