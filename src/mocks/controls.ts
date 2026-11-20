/**
 * Mock controls: switches that make each documented error and slow or out-of-order
 * responses happen on purpose. The dev panel (src/dev/MockControls.tsx) edits them,
 * and tests can call setMockControls directly.
 */

export const MOCK_ROUTES = {
  products: { label: 'GET /api/products', statuses: [500] },
  product: { label: 'GET /api/products/:id', statuses: [404] },
  login: { label: 'POST /api/login', statuses: [400, 401] },
  me: { label: 'GET /api/me', statuses: [401] },
  createOrder: { label: 'POST /api/orders', statuses: [400, 401, 409] },
  order: { label: 'GET /api/orders/:id', statuses: [401, 404] },
} as const satisfies Record<string, { label: string; statuses: readonly number[] }>

export type MockRoute = keyof typeof MOCK_ROUTES

export type MockLatency = 'none' | 'slow' | 'random'

export interface MockControls {
  /** Force this route to fail with `failStatus`. */
  failRoute: MockRoute | null
  failStatus: number | null
  /** none: instant. slow: 1.5 s. random: 100–1500 ms, so responses can arrive out of order. */
  latency: MockLatency
}

const DEFAULT_CONTROLS: MockControls = { failRoute: null, failStatus: null, latency: 'none' }
const STORAGE_KEY = 'bug-bazaar:mock-controls'

function load(): MockControls {
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_CONTROLS
    const parsed = JSON.parse(raw) as Partial<MockControls>
    return { ...DEFAULT_CONTROLS, ...parsed }
  } catch {
    return DEFAULT_CONTROLS
  }
}

let controls: MockControls = DEFAULT_CONTROLS
const listeners = new Set<() => void>()

/** Read saved controls (browser only). Tests start from the defaults. */
export function loadMockControls(): void {
  controls = load()
}

export function getMockControls(): MockControls {
  return controls
}

export function setMockControls(next: Partial<MockControls>): void {
  controls = { ...controls, ...next }
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(controls))
  } catch {
    // Storage can be unavailable (private mode). The controls still work for this session.
  }
  listeners.forEach((listener) => {
    listener()
  })
}

export function resetMockControls(): void {
  setMockControls(DEFAULT_CONTROLS)
}

export function subscribeMockControls(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function latencyMs(latency: MockLatency): number {
  switch (latency) {
    case 'none':
      return 0
    case 'slow':
      return 1500
    case 'random':
      return 100 + Math.floor(Math.random() * 1400)
  }
}
