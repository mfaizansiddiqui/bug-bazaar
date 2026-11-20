import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/mocks/server'
import { FIXTURE_PASSWORD, FIXTURE_TOKEN, fixtureUser } from '@/mocks/fixtures'
import {
  ApiClientError,
  createOrder,
  getMe,
  getProduct,
  getProducts,
  login,
  onUnauthorized,
  setAuthToken,
} from './client'

async function captureError(promise: Promise<unknown>): Promise<ApiClientError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ApiClientError) return error
    throw error
  }
  throw new Error('Expected the request to fail')
}

afterEach(() => {
  setAuthToken(null)
  onUnauthorized(null)
})

describe('api client', () => {
  it('returns a typed product list', async () => {
    const list = await getProducts({ category: 'ducks' })
    expect(list.total).toBe(1)
    expect(list.items[0]?.name).toBe('Debugging Duck')
  })

  it('maps a 404 to a notFound error without exposing the server message', async () => {
    const error = await captureError(getProduct('missing'))
    expect(error.kind).toBe('notFound')
    expect(error.status).toBe(404)
    expect(error.message).not.toContain('Product not found')
  })

  it('rejects a response that breaks the contract', async () => {
    server.use(http.get('*/api/products/:id', () => HttpResponse.json({ id: 'p-1', price: '12' })))
    const error = await captureError(getProduct('p-1'))
    expect(error.kind).toBe('invalidResponse')
  })

  it('returns field details for a 400 login', async () => {
    const error = await captureError(login({ email: '', password: '' }))
    expect(error.kind).toBe('validation')
    expect(error.details).toHaveProperty('email')
  })

  it('notifies the session layer on a 401', async () => {
    const listener = vi.fn()
    onUnauthorized(listener)
    const error = await captureError(getMe())
    expect(error.kind).toBe('unauthorized')
    expect(listener).toHaveBeenCalledOnce()
  })

  it('sends the in-memory token after login', async () => {
    const session = await login({ email: fixtureUser.email, password: FIXTURE_PASSWORD })
    expect(session.token).toBe(FIXTURE_TOKEN)
    setAuthToken(session.token)
    await expect(getMe()).resolves.toEqual(fixtureUser)
  })

  it('returns the same order when a checkout is retried with the same key', async () => {
    setAuthToken(FIXTURE_TOKEN)
    const items = [{ productId: 'p-1', quantity: 1 }]
    const first = await createOrder({ items }, 'key-1')
    const retry = await createOrder({ items }, 'key-1')
    expect(retry.id).toBe(first.id)
  })

  it('names the product that ran out of stock on a 409', async () => {
    setAuthToken(FIXTURE_TOKEN)
    const error = await captureError(
      createOrder({ items: [{ productId: 'p-2', quantity: 5 }] }, 'key-2'),
    )
    expect(error.kind).toBe('conflict')
    expect(error.details.name).toBe('Clicky Mechanical Keyboard')
  })

  it('maps a dropped connection to a network error', async () => {
    server.use(http.get('*/api/products', () => HttpResponse.error()))
    const error = await captureError(getProducts())
    expect(error.kind).toBe('network')
  })
})
