import { useEffect, useState } from 'react'

/**
 * Returns `value` only after it has stopped changing for `delayMs`.
 * Used for search: typing "keyboard" sends one request, not eight.
 *
 * Each change schedules a timer, and the cleanup cancels the previous one, so only the last
 * value in a burst gets through. The cleanup also runs on unmount, so no timer outlives
 * the component.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebounced(value)
    }, delayMs)
    return () => {
      window.clearTimeout(timer)
    }
  }, [value, delayMs])

  return debounced
}
