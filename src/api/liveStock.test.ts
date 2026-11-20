import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  connectLiveStock,
  reconnectDelay,
  type LiveStockStatus,
  type SocketLike,
} from './liveStock'

/** A controllable stand-in for the browser WebSocket. */
class FakeSocket implements SocketLike {
  onopen: ((event: Event) => void) | null = null
  onmessage: ((event: MessageEvent) => void) | null = null
  onclose: ((event: CloseEvent) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  closed = false

  close(): void {
    this.closed = true
  }
  serverOpens(): void {
    this.onopen?.(new Event('open'))
  }
  serverSends(data: unknown): void {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
  }
  serverDrops(): void {
    this.onclose?.(new CloseEvent('close', { code: 1006 }))
  }
}

function setup() {
  const sockets: FakeSocket[] = []
  const updates: unknown[] = []
  const statuses: LiveStockStatus[] = []
  const feed = connectLiveStock({
    url: 'ws://test/api/stock',
    onUpdate: (update) => updates.push(update),
    onStatus: (status) => statuses.push(status),
    createSocket: () => {
      const socket = new FakeSocket()
      sockets.push(socket)
      return socket
    },
    random: () => 0,
  })
  return { feed, sockets, updates, statuses }
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('live stock feed', () => {
  it('passes valid stock messages on and ignores malformed ones', () => {
    const { sockets, updates } = setup()
    sockets[0]?.serverOpens()
    sockets[0]?.serverSends({ type: 'stock', productId: 'p-1', stock: 4 })
    sockets[0]?.serverSends({ type: 'stock', productId: 'p-1', stock: -2 })
    sockets[0]?.serverSends('not a stock message')
    expect(updates).toEqual([{ type: 'stock', productId: 'p-1', stock: 4 }])
  })

  it('reconnects with growing backoff after the connection drops', () => {
    const { sockets, statuses } = setup()
    sockets[0]?.serverOpens()
    expect(statuses).toEqual(['connecting', 'live'])

    sockets[0]?.serverDrops()
    expect(statuses.at(-1)).toBe('reconnecting')
    vi.advanceTimersByTime(499)
    expect(sockets).toHaveLength(1)
    vi.advanceTimersByTime(1)
    expect(sockets).toHaveLength(2)

    // The second attempt fails too: the wait doubles.
    sockets[1]?.serverDrops()
    vi.advanceTimersByTime(999)
    expect(sockets).toHaveLength(2)
    vi.advanceTimersByTime(1)
    expect(sockets).toHaveLength(3)

    // Once connected again, the backoff resets.
    sockets[2]?.serverOpens()
    expect(statuses.at(-1)).toBe('live')
  })

  it('stops completely: closes the socket and cancels a pending reconnect', () => {
    const { feed, sockets } = setup()
    sockets[0]?.serverOpens()
    sockets[0]?.serverDrops()

    feed.stop()
    vi.advanceTimersByTime(60_000)
    expect(sockets).toHaveLength(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('caps the backoff at 30 seconds', () => {
    expect(reconnectDelay(0, () => 0)).toBe(500)
    expect(reconnectDelay(3, () => 0)).toBe(4000)
    expect(reconnectDelay(20, () => 0)).toBe(30_000)
  })
})
