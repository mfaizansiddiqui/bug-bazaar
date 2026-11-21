import { delay, http, HttpResponse } from 'msw'
import {
  CategorySchema,
  PRODUCTS_PAGE_SIZE,
  type ApiError,
  type CreateOrderRequest,
  type LoginRequest,
  type Order,
  type Product,
  type ProductSort,
} from '@/api/contract'
import { getMockControls, latencyMs, type MockRoute } from './controls'
import { currentOrderStatus, db, DEMO_PASSWORD, DEMO_USER, issueToken } from './db'

/** Implements docs/api-contract.md. Every error status there can be produced here. */

function apiError(status: number, code: string, message: string, details?: Record<string, string>) {
  const body: ApiError = { error: { code, message, ...(details ? { details } : {}) } }
  return HttpResponse.json(body, { status })
}

const FORCED_ERRORS: Record<number, () => Response> = {
  400: () =>
    apiError(400, 'VALIDATION_ERROR', 'Forced validation error', {
      email: 'Forced: email is invalid',
    }),
  401: () => apiError(401, 'UNAUTHORIZED', 'Forced: not signed in'),
  404: () => apiError(404, 'NOT_FOUND', 'Forced: not found'),
  409: () => {
    const product = db.products[0]
    return apiError(409, 'OUT_OF_STOCK', 'Forced: out of stock', {
      productId: product?.id ?? 'unknown',
      name: product?.name ?? 'Unknown product',
    })
  },
  500: () => apiError(500, 'INTERNAL_ERROR', 'Forced: server error'),
}

/** Applies the mock controls: latency first, then a forced error if this route is switched on. */
async function simulate(route: MockRoute): Promise<Response | null> {
  const controls = getMockControls()
  const wait = latencyMs(controls.latency)
  if (wait > 0) await delay(wait)
  if (controls.failRoute === route && controls.failStatus !== null) {
    return FORCED_ERRORS[controls.failStatus]?.() ?? null
  }
  return null
}

function isAuthorized(request: Request): boolean {
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') && db.tokens.has(header.slice('Bearer '.length))
}

const SORTERS: Record<ProductSort, ((a: Product, b: Product) => number) | null> = {
  relevance: null,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating,
  name: (a, b) => a.name.localeCompare(b.name),
}

function isSort(value: string): value is ProductSort {
  return value in SORTERS
}

export const handlers = [
  http.get('*/api/products', async ({ request }) => {
    const forced = await simulate('products')
    if (forced) return forced

    const params = new URL(request.url).searchParams
    const search = params.get('search')?.trim().toLowerCase() ?? ''
    const category = CategorySchema.safeParse(params.get('category'))
    // "true": only in stock. "false": only sold out. Anything else: no stock filter.
    const inStock = params.get('inStock')
    const sort = params.get('sort') ?? 'relevance'
    const page = Math.max(1, Number.parseInt(params.get('page') ?? '1', 10) || 1)

    let items = db.products.filter(
      (product) =>
        (!search || product.name.toLowerCase().includes(search)) &&
        (!category.success || product.category === category.data) &&
        (inStock !== 'true' || product.stock > 0) &&
        (inStock !== 'false' || product.stock === 0),
    )
    const sorter = isSort(sort) ? SORTERS[sort] : null
    if (sorter) items = [...items].sort(sorter)

    const start = (page - 1) * PRODUCTS_PAGE_SIZE
    return HttpResponse.json({
      items: items.slice(start, start + PRODUCTS_PAGE_SIZE),
      total: items.length,
    })
  }),

  http.get('*/api/products/:id', async ({ params }) => {
    const forced = await simulate('product')
    if (forced) return forced

    const product = db.products.find((item) => item.id === params.id)
    return product
      ? HttpResponse.json(product)
      : apiError(404, 'PRODUCT_NOT_FOUND', 'Product not found')
  }),

  http.post('*/api/login', async ({ request }) => {
    const forced = await simulate('login')
    if (forced) return forced

    const body = (await request.json().catch(() => ({}))) as Partial<LoginRequest>
    const details: Record<string, string> = {}
    if (!body.email?.trim()) details.email = 'Email is required'
    if (!body.password) details.password = 'Password is required'
    if (Object.keys(details).length > 0) {
      return apiError(400, 'VALIDATION_ERROR', 'Missing fields', details)
    }
    if (body.email !== DEMO_USER.email || body.password !== DEMO_PASSWORD) {
      return apiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
    }
    return HttpResponse.json({ token: issueToken(), user: DEMO_USER })
  }),

  http.get('*/api/me', async ({ request }) => {
    const forced = await simulate('me')
    if (forced) return forced

    return isAuthorized(request)
      ? HttpResponse.json(DEMO_USER)
      : apiError(401, 'UNAUTHORIZED', 'Not signed in')
  }),

  http.post('*/api/orders', async ({ request }) => {
    const forced = await simulate('createOrder')
    if (forced) return forced

    if (!isAuthorized(request)) return apiError(401, 'UNAUTHORIZED', 'Not signed in')

    const key = request.headers.get('Idempotency-Key')
    if (!key) return apiError(400, 'MISSING_IDEMPOTENCY_KEY', 'Idempotency-Key header is required')

    // Same key as an earlier successful order: return that order, don't create another.
    const existing = db.ordersByIdempotencyKey.get(key)
    if (existing) return HttpResponse.json(existing, { status: 201 })

    const body = (await request.json().catch(() => ({}))) as Partial<CreateOrderRequest>
    if (!body.items?.length) {
      return apiError(400, 'VALIDATION_ERROR', 'Order has no items', { items: 'Add an item' })
    }

    // Check every line before changing any stock, so a failed order changes nothing.
    for (const item of body.items) {
      const product = db.products.find((candidate) => candidate.id === item.productId)
      if (!product || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return apiError(400, 'VALIDATION_ERROR', 'Invalid order line', {
          items: 'Each line needs a known product and a quantity of at least 1',
        })
      }
      if (item.quantity > product.stock) {
        return apiError(409, 'OUT_OF_STOCK', 'Out of stock', {
          productId: product.id,
          name: product.name,
        })
      }
    }
    for (const item of body.items) {
      const product = db.products.find((candidate) => candidate.id === item.productId)
      if (product) product.stock -= item.quantity
    }

    const order: Order = { id: `o-${String(db.nextOrderNumber)}`, status: 'queued' }
    db.nextOrderNumber += 1
    db.orders.set(order.id, { order, createdAt: Date.now() })
    db.ordersByIdempotencyKey.set(key, order)
    return HttpResponse.json(order, { status: 201 })
  }),

  http.get('*/api/orders/:id', async ({ request, params }) => {
    const forced = await simulate('order')
    if (forced) return forced

    if (!isAuthorized(request)) return apiError(401, 'UNAUTHORIZED', 'Not signed in')
    const stored = typeof params.id === 'string' ? db.orders.get(params.id) : undefined
    if (!stored) return apiError(404, 'ORDER_NOT_FOUND', 'Order not found')
    return HttpResponse.json({ id: stored.order.id, status: currentOrderStatus(stored) })
  }),
]
