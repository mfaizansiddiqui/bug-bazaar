import { beforeEach, describe, expect, it } from 'vitest'
import { captureError } from '@/test/captureError'
import { createOrder, getOrder, getProduct, getProducts, login, setAuthToken } from '@/api/client'
import { PRODUCTS_PAGE_SIZE } from '@/api/contract'
import { setMockControls } from './controls'
import { db, DEMO_PASSWORD, DEMO_USER } from './db'
import { PRODUCT_COUNT } from './seed'

async function signIn(): Promise<void> {
  const session = await login({ email: DEMO_USER.email, password: DEMO_PASSWORD })
  setAuthToken(session.token)
}

beforeEach(() => {
  setAuthToken(null)
})

describe('mock API: products', () => {
  it('seeds 5,000 products and returns them a page at a time', async () => {
    const list = await getProducts()
    expect(list.total).toBe(PRODUCT_COUNT)
    expect(list.items).toHaveLength(PRODUCTS_PAGE_SIZE)
  })

  it('searches by name, case-insensitively', async () => {
    const list = await getProducts({ search: 'DUCK' })
    expect(list.total).toBeGreaterThan(0)
    expect(list.items.every((product) => product.name.toLowerCase().includes('duck'))).toBe(true)
  })

  it('hides out-of-stock products when inStock is set', async () => {
    const all = await getProducts()
    const inStock = await getProducts({ inStock: true })
    expect(inStock.total).toBeLessThan(all.total)
    expect(inStock.items.every((product) => product.stock > 0)).toBe(true)
  })

  it('sorts by price, cheapest first', async () => {
    const { items } = await getProducts({ sort: 'price-asc' })
    const prices = items.map((product) => product.price)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('returns a different slice for page 2', async () => {
    const first = await getProducts({ page: 1 })
    const second = await getProducts({ page: 2 })
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id)
  })
})

describe('mock API: forced errors', () => {
  it('forces a 500 on the product list', async () => {
    setMockControls({ failRoute: 'products', failStatus: 500 })
    const error = await captureError(getProducts())
    expect(error.kind).toBe('server')
  })

  it('forces a 404 on product details', async () => {
    setMockControls({ failRoute: 'product', failStatus: 404 })
    const error = await captureError(getProduct('p-0002'))
    expect(error.kind).toBe('notFound')
  })
})

describe('mock API: orders', () => {
  it('returns 401 when ordering without signing in', async () => {
    const error = await captureError(
      createOrder({ items: [{ productId: 'p-0002', quantity: 1 }] }, 'key-anon'),
    )
    expect(error.kind).toBe('unauthorized')
  })

  it('creates a queued order and reduces stock', async () => {
    await signIn()
    const before = db.products.find((product) => product.id === 'p-0002')?.stock ?? 0
    const order = await createOrder({ items: [{ productId: 'p-0002', quantity: 1 }] }, 'key-a')
    expect(order.status).toBe('queued')
    expect(db.products.find((product) => product.id === 'p-0002')?.stock).toBe(before - 1)
    await expect(getOrder(order.id)).resolves.toMatchObject({ id: order.id })
  })

  it('returns the same order when a checkout is retried with the same key', async () => {
    await signIn()
    const items = [{ productId: 'p-0002', quantity: 1 }]
    const first = await createOrder({ items }, 'key-retry')
    const retry = await createOrder({ items }, 'key-retry')
    expect(retry.id).toBe(first.id)
    expect(db.orders.size).toBe(1)
  })

  it('names the product that ran out of stock on a 409', async () => {
    await signIn()
    const error = await captureError(
      createOrder({ items: [{ productId: 'p-0001', quantity: 2 }] }, 'key-409'),
    )
    expect(error.kind).toBe('conflict')
    expect(error.details.name).toBe('Last-One Debugging Duck')
  })

  it('returns 400 for an empty order', async () => {
    await signIn()
    const error = await captureError(createOrder({ items: [] }, 'key-empty'))
    expect(error.kind).toBe('validation')
  })

  it('returns 404 for an unknown order', async () => {
    await signIn()
    const error = await captureError(getOrder('o-999'))
    expect(error.kind).toBe('notFound')
  })
})
