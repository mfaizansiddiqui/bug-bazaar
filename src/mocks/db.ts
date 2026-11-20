import type { Order, OrderStatus, Product, User } from '@/api/contract'
import { seedProducts } from './seed'

/**
 * In-memory "database" for the mock API. It resets on page reload (and between tests),
 * which is acceptable for a mock: the contract, not persistence, is what we are testing.
 */

export const DEMO_USER: User = { id: 'u-1', email: 'dev@bugbazaar.test', name: 'Dev User' }
export const DEMO_PASSWORD = 'password123'

interface StoredOrder {
  order: Order
  createdAt: number
}

interface MockDb {
  products: Product[]
  tokens: Set<string>
  orders: Map<string, StoredOrder>
  ordersByIdempotencyKey: Map<string, Order>
  nextOrderNumber: number
}

function createDb(): MockDb {
  return {
    products: seedProducts(),
    tokens: new Set(),
    orders: new Map(),
    ordersByIdempotencyKey: new Map(),
    nextOrderNumber: 1,
  }
}

export let db = createDb()

export function resetDb(): void {
  db = createDb()
}

export function issueToken(): string {
  const token = `mock-token-${crypto.randomUUID()}`
  db.tokens.add(token)
  return token
}

/** Simulates a queue: queued → processing after 2 s → confirmed after 5 s. */
export function currentOrderStatus(stored: StoredOrder, now = Date.now()): OrderStatus {
  const age = now - stored.createdAt
  if (age >= 5000) return 'confirmed'
  if (age >= 2000) return 'processing'
  return stored.order.status
}
