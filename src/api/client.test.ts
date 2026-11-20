import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { server } from '@/mocks/server'
import { DEMO_PASSWORD, DEMO_USER } from '@/mocks/db'
import { captureError } from '@/test/captureError'
import { getMe, getProduct, getProducts, login, onUnauthorized, setAuthToken } from './client'

afterEach(() => {
  setAuthToken(null)
  onUnauthorized(null)
})

describe('api client', () => {
  it('returns a typed product list', async () => {
    const list = await getProducts({ category: 'ducks' })
    expect(list.items.length).toBeGreaterThan(0)
    expect(list.items.every((product) => product.category === 'ducks')).toBe(true)
  })

  it('maps a 404 to a notFound error without exposing the server message', async () => {
    const error = await captureError(getProduct('missing'))
    expect(error.kind).toBe('notFound')
    expect(error.status).toBe(404)
    expect(error.message).not.toContain('Product not found')
  })

  it('rejects a response that breaks the contract', async () => {
    server.use(
      http.get('*/api/products/:id', () => HttpResponse.json({ id: 'p-0001', price: '12' })),
    )
    const error = await captureError(getProduct('p-0001'))
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
    const session = await login({ email: DEMO_USER.email, password: DEMO_PASSWORD })
    setAuthToken(session.token)
    await expect(getMe()).resolves.toEqual(DEMO_USER)
  })

  it('maps a dropped connection to a network error', async () => {
    server.use(http.get('*/api/products', () => HttpResponse.error()))
    const error = await captureError(getProducts())
    expect(error.kind).toBe('network')
  })
})
