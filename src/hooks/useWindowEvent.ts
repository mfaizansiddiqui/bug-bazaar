import { useEffect, useEffectEvent } from 'react'

/**
 * Subscribes to a window event for as long as the component is mounted.
 *
 * - The listener is removed in the effect cleanup, so nothing keeps running after the page
 *   closes (D2-4).
 * - `useEffectEvent` always calls the latest handler without re-subscribing, so passing a
 *   new inline function on every render doesn't add and remove the listener each time.
 */
export function useWindowEvent<K extends keyof WindowEventMap>(
  type: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: AddEventListenerOptions,
): void {
  const onEvent = useEffectEvent(handler)
  const passive = options?.passive
  const capture = options?.capture

  useEffect(() => {
    const listener = (event: WindowEventMap[K]) => {
      onEvent(event)
    }
    window.addEventListener(type, listener, { passive, capture })
    return () => {
      window.removeEventListener(type, listener, { capture })
    }
  }, [type, passive, capture])
}
