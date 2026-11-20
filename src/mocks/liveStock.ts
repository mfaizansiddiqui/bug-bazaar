import { ws } from 'msw'
import type { StockUpdate } from '@/api/contract'
import { db } from './db'

/**
 * Mock live stock server (D4-4). While a client is connected, every 2 s it changes the
 * stock of a random product among the first 60 (the ones on screen by default), writes it
 * to the mock database so REST and the feed agree, and pushes the new value.
 */

const TICK_MS = 2000
const VISIBLE_PRODUCTS = 60

export const liveStock = ws.link('*/api/stock')

export const liveStockHandler = liveStock.addEventListener('connection', ({ client }) => {
  const timer = setInterval(() => {
    const product = db.products[Math.floor(Math.random() * VISIBLE_PRODUCTS)]
    if (!product) return
    const change = Math.random() < 0.6 ? -1 : 2
    product.stock = Math.max(0, product.stock + change)
    const update: StockUpdate = { type: 'stock', productId: product.id, stock: product.stock }
    client.send(JSON.stringify(update))
  }, TICK_MS)

  client.addEventListener('close', () => {
    clearInterval(timer)
  })
})

/** Dev control: drop every live connection so the client's reconnect logic can be seen. */
export function dropLiveStockConnections(): void {
  liveStock.clients.forEach((client) => {
    client.close(1012, 'mock server restart')
  })
}
