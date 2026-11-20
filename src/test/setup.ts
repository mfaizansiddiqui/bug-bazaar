import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { resetMockControls } from '@/mocks/controls'
import { resetDb } from '@/mocks/db'
import { server } from '@/mocks/server'

// jsdom doesn't implement matchMedia, and antd's responsive Grid needs it.
// The stub only covers the members antd calls, so it is typed as a Partial.
const matchMediaStub = (query: string): Partial<MediaQueryList> => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})
Object.defineProperty(window, 'matchMedia', { writable: true, value: matchMediaStub })

// jsdom doesn't implement ResizeObserver either. antd uses it to measure text ellipsis.
class ResizeObserverStub {
  observe(): void {
    // no layout in jsdom, so nothing to observe
  }
  unobserve(): void {
    // no-op
  }
  disconnect(): void {
    // no-op
  }
}
Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ResizeObserverStub })

// jsdom has no layout, so scrolling is a no-op. Tests assert on scroll listeners instead.
Object.defineProperty(window, 'scrollTo', { writable: true, value: () => undefined })

// Fail loudly if a test hits an endpoint that has no handler.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetDb()
  resetMockControls()
})
afterAll(() => {
  server.close()
})
