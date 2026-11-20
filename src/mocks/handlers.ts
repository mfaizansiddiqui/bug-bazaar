import { http, HttpResponse } from 'msw'
import type { ApiError, CreateOrderRequest, LoginRequest, Order } from '@/api/contract'
import { FIXTURE_PASSWORD, FIXTURE_TOKEN, fixtureProducts, fixtureUser } from './fixtures'

/**
 * Minimal handlers that follow docs/api-contract.md. They form the seam that tests and
 * (from D1-2) the browser mock both use. Search, sort, paging and on-demand error
 * triggers are built in D1-2.
 */

function apiError(status: number, code: string, message: string, details?: Record<string, string>) {
  const body: ApiError = { error: { code, message, ...(details ? { details } : {}) } }
  return HttpResponse.json(body, { status })
}

function isAuthorized(request: Request): boolean {
  return request.headers.get('Authorization') === `Bearer ${FIXTURE_TOKEN}`
}

const ordersById = new Map<string, Order>()
const ordersByIdempotencyKey = new Map<string, Order>()

export function resetMockState(): void {
  ordersById.clear()
  ordersByIdempotencyKey.clear()
}

export const handlers = [
  http.get('*/api/products', ({ request }) => {
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const items = category
      ? fixtureProducts.filter((product) => product.category === category)
      : fixtureProducts
    return HttpResponse.json({ items, total: items.length })
  }),

  http.get('*/api/products/:id', ({ params }) => {
    const product = fixtureProducts.find((item) => item.id === params.id)
    return product
      ? HttpResponse.json(product)
      : apiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
  }),

  http.post('*/api/login', async ({ request }) => {
    const body = (await request.json()) as Partial<LoginRequest>
    if (!body.email || !body.password) {
      return apiError(400, 'VALIDATION_ERROR', 'Missing fields', {
        ...(body.email ? {} : { email: 'Email is required' }),
        ...(body.password ? {} : { password: 'Password is required' }),
      })
    }
    if (body.email !== fixtureUser.email || body.password !== FIXTURE_PASSWORD) {
      return apiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
    }
    return HttpResponse.json({ token: FIXTURE_TOKEN, user: fixtureUser })
  }),

  http.get('*/api/me', ({ request }) =>
    isAuthorized(request)
      ? HttpResponse.json(fixtureUser)
      : apiError(401, 'UNAUTHORIZED', 'Not signed in'),
  ),

  http.post('*/api/orders', async ({ request }) => {
    if (!isAuthorized(request)) return apiError(401, 'UNAUTHORIZED', 'Not signed in')

    const key = request.headers.get('Idempotency-Key')
    if (!key) return apiError(400, 'MISSING_IDEMPOTENCY_KEY', 'Idempotency-Key header is required')

    const existing = ordersByIdempotencyKey.get(key)
    if (existing) return HttpResponse.json(existing, { status: 201 })

    const body = (await request.json()) as Partial<CreateOrderRequest>
    if (!body.items?.length) {
      return apiError(400, 'VALIDATION_ERROR', 'Order has no items', { items: 'Add an item' })
    }
    for (const item of body.items) {
      const product = fixtureProducts.find((candidate) => candidate.id === item.productId)
      if (!product) return apiError(400, 'VALIDATION_ERROR', 'Unknown product')
      if (item.quantity > product.stock) {
        return apiError(409, 'OUT_OF_STOCK', 'Out of stock', {
          productId: product.id,
          name: product.name,
        })
      }
    }

    const order: Order = { id: `o-${String(ordersById.size + 1)}`, status: 'queued' }
    ordersById.set(order.id, order)
    ordersByIdempotencyKey.set(key, order)
    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('*/api/orders/:id', ({ request, params }) => {
    if (!isAuthorized(request)) return apiError(401, 'UNAUTHORIZED', 'Not signed in')
    const order = typeof params.id === 'string' ? ordersById.get(params.id) : undefined
    return order ? HttpResponse.json(order) : apiError(404, 'ORDER_NOT_FOUND', 'Order not found')
  }),
]
