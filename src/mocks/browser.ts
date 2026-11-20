import { setupWorker } from 'msw/browser'
import { loadMockControls } from './controls'
import { handlers } from './handlers'
import { liveStockHandler } from './liveStock'

/** Starts the MSW service worker so the app runs without a real backend. */
export async function startMockApi(): Promise<void> {
  loadMockControls()
  // The live stock socket is browser-only: tests drive the feed with a fake socket instead.
  const worker = setupWorker(...handlers, liveStockHandler)
  await worker.start({
    // Let Vite's own assets and images through. Only /api is mocked.
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}
