import { StockUpdateSchema, type StockUpdate } from './contract'

/**
 * Live stock feed over a WebSocket (D4-4).
 *
 * - **Recovers after a disconnect:** when the socket closes unexpectedly it reconnects with
 *   exponential backoff (0.5 s, 1 s, 2 s … up to 30 s) plus random jitter, so thousands of
 *   clients don't all reconnect at the same instant after a server restart.
 * - **Stops when asked:** the returned `stop()` closes the socket and cancels any pending
 *   reconnect timer. Nothing keeps running after the page closes.
 * - **Validates messages:** every message goes through the Zod schema. Bad ones are ignored.
 */

export type LiveStockStatus = 'connecting' | 'live' | 'reconnecting' | 'stopped'

/** The subset of the browser WebSocket this module uses, so tests can pass a fake. */
export interface SocketLike {
  onopen: ((event: Event) => void) | null
  onmessage: ((event: MessageEvent) => void) | null
  onclose: ((event: CloseEvent) => void) | null
  onerror: ((event: Event) => void) | null
  close: (code?: number, reason?: string) => void
}

export interface LiveStockOptions {
  url: string
  onUpdate: (update: StockUpdate) => void
  onStatus?: (status: LiveStockStatus) => void
  createSocket?: (url: string) => SocketLike
  random?: () => number
}

const BASE_DELAY_MS = 500
const MAX_DELAY_MS = 30_000
const MAX_JITTER_MS = 250

export function reconnectDelay(attempt: number, random: () => number = Math.random): number {
  const exponential = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * 2 ** attempt)
  return exponential + Math.floor(random() * MAX_JITTER_MS)
}

/** ws:// or wss:// URL for the stock feed, next to the REST API. */
export function liveStockUrl(apiBase = import.meta.env.VITE_API_BASE_URL ?? '/api'): string {
  const url = new URL(`${apiBase.replace(/\/$/, '')}/stock`, window.location.href)
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
  return url.toString()
}

export function connectLiveStock({
  url,
  onUpdate,
  onStatus,
  createSocket = (target) => new WebSocket(target),
  random = Math.random,
}: LiveStockOptions): { stop: () => void } {
  let socket: SocketLike | null = null
  let retryTimer: ReturnType<typeof setTimeout> | null = null
  let attempt = 0
  let stopped = false

  function open(): void {
    onStatus?.(attempt === 0 ? 'connecting' : 'reconnecting')
    const current = createSocket(url)
    socket = current

    current.onopen = () => {
      attempt = 0
      onStatus?.('live')
    }
    current.onmessage = (event) => {
      try {
        const parsed = StockUpdateSchema.safeParse(JSON.parse(String(event.data)))
        if (parsed.success) onUpdate(parsed.data)
      } catch {
        // Not JSON: ignore it rather than crash the feed.
      }
    }
    current.onerror = () => {
      // A close event always follows an error. Reconnecting is handled there.
    }
    current.onclose = () => {
      if (stopped || socket !== current) return
      socket = null
      onStatus?.('reconnecting')
      retryTimer = setTimeout(open, reconnectDelay(attempt, random))
      attempt += 1
    }
  }

  open()

  return {
    stop() {
      stopped = true
      if (retryTimer !== null) clearTimeout(retryTimer)
      retryTimer = null
      socket?.close(1000, 'page closed')
      socket = null
      onStatus?.('stopped')
    },
  }
}
