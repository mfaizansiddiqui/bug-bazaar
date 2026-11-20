import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { db } from '@/mocks/db'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'
import { signInDemoUser } from '@/test/session'

/** Counts product API calls without changing their responses. */
function countProductRequests() {
  const calls = { list: 0, detail: 0 }
  server.events.on('request:start', ({ request }) => {
    const path = new URL(request.url).pathname
    if (path === '/api/products') calls.list += 1
    else if (path.startsWith('/api/products/')) calls.detail += 1
  })
  return calls
}

/** Matches the StockTag text for a given stock: "12 in stock" or "Only 3 left". */
function stockText(stock: number): RegExp {
  return new RegExp(`^(${String(stock)} in stock|Only ${String(stock)} left)$`)
}

afterEach(() => {
  server.events.removeAllListeners()
})

describe('caching (D3-5)', () => {
  it('reuses cached data when revisiting a page and when opening a product from the grid', async () => {
    const calls = countProductRequests()
    const user = userEvent.setup()
    const { router } = renderApp('/')
    const card = await screen.findByRole('link', { name: /Last-One Debugging Duck/ })
    expect(calls.list).toBe(1)

    // Grid → details: the product is already in the list cache, so no request and no skeleton.
    await user.click(card)
    expect(screen.getByRole('heading', { level: 1, name: 'Last-One Debugging Duck' })).toBeVisible()
    expect(calls.detail).toBe(0)

    // Back to the grid: the list is still fresh, so it is not fetched again.
    await act(() => router.navigate(-1))
    await screen.findByRole('link', { name: /Last-One Debugging Duck/ })
    expect(calls.list).toBe(1)
  })

  it('refreshes stock after an order is placed', async () => {
    const product = db.products.find((item) => item.id === 'p-0002')
    if (!product) throw new Error('Seed changed: p-0002 is missing')
    const stockBefore = product.stock
    const user = userEvent.setup()
    const { router, store } = renderApp('/products/p-0002')
    await signInDemoUser(store)
    expect(await screen.findByText(stockText(stockBefore))).toBeVisible()

    await user.click(screen.getByRole('button', { name: /Add to cart/ }))
    await act(() => router.navigate('/checkout'))
    await user.click(await screen.findByRole('button', { name: 'Place order' }))
    await screen.findByRole('heading', { level: 1, name: 'Thank you, your order is placed' })

    // The order invalidated every cached product query, so the page refetches the new stock.
    await act(() => router.navigate('/products/p-0002'))
    await waitFor(() => {
      expect(screen.getByText(stockText(stockBefore - 1))).toBeVisible()
    })
  })
})
