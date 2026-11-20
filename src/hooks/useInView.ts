import { useEffect, useState, type RefObject } from 'react'

/**
 * True while the element is within `rootMargin` of the viewport (IntersectionObserver).
 * Used to load the next page before the user reaches the end of the list. The observer is
 * disconnected in the effect cleanup, so nothing keeps watching after unmount.
 */
export function useInView(
  ref: RefObject<Element | null>,
  { rootMargin = '0px', enabled = true }: { rootMargin?: string; enabled?: boolean } = {},
): boolean {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!enabled || !element || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry?.isIntersecting ?? false)
      },
      { rootMargin },
    )
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [ref, rootMargin, enabled])

  return inView
}
