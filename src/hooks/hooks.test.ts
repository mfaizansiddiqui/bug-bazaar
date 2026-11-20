import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from './useDebouncedValue'
import { useWindowEvent } from './useWindowEvent'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('only passes the last value of a burst through, after the delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'k' },
    })

    rerender({ value: 'ke' })
    rerender({ value: 'key' })
    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('k')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('key')
  })

  it('cancels the pending timer on unmount', () => {
    const { rerender, unmount } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'a' },
    })
    rerender({ value: 'b' })
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('useWindowEvent', () => {
  it('calls the latest handler and removes the listener on unmount', () => {
    const first = vi.fn()
    const second = vi.fn()
    const { rerender, unmount } = renderHook(
      ({ handler }) => {
        useWindowEvent('resize', handler)
      },
      { initialProps: { handler: first } },
    )

    rerender({ handler: second })
    window.dispatchEvent(new Event('resize'))
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledOnce()

    unmount()
    window.dispatchEvent(new Event('resize'))
    expect(second).toHaveBeenCalledOnce()
  })
})
