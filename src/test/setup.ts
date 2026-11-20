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
