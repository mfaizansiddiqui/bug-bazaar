import { useEffect, useRef, useState } from 'react'
import { FloatButton } from 'antd'
import { useWindowEvent } from '@/hooks/useWindowEvent'

const SHOW_AFTER_PX = 400

/**
 * Back to Top button (D2-4). It listens to scroll only while its page is mounted:
 * - the scroll listener is passive and removed on unmount (useWindowEvent's cleanup)
 * - scroll events are throttled to one check per animation frame, and a pending frame is
 *   cancelled on unmount, so nothing runs after the page closes
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false)
  const frame = useRef<number | null>(null)

  useWindowEvent(
    'scroll',
    () => {
      if (frame.current !== null) return
      frame.current = window.requestAnimationFrame(() => {
        frame.current = null
        setVisible(window.scrollY > SHOW_AFTER_PX)
      })
    },
    { passive: true },
  )

  useEffect(
    () => () => {
      if (frame.current !== null) window.cancelAnimationFrame(frame.current)
    },
    [],
  )

  if (!visible) return null
  return (
    <FloatButton
      type="primary"
      tooltip="Back to top"
      aria-label="Back to top"
      content="Top"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }}
    />
  )
}
