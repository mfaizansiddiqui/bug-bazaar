import { setupWorker } from 'msw/browser'
import { loadMockControls } from './controls'
import { handlers } from './handlers'

/** Starts the MSW service worker so the app runs without a real backend. */
export async function startMockApi(): Promise<void> {
  loadMockControls()
  const worker = setupWorker(...handlers)
  await worker.start({
    // Let Vite's own assets and images through. Only /api is mocked.
    onUnhandledFrame: 'bypass',
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}
