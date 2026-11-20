import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { db } from '@/mocks/db'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'

function productById(id: string) {
  const product = db.products.find((item) => item.id === id)
  if (!product) throw new Error(`No seeded product ${id}`)
  return product
}

describe('product details: effects and cleanup', () => {
  it('never shows the wrong product when switching quickly, and aborts the old request', async () => {
    const slow = productById('p-0002')
    const fast = productById('p-0003')
    server.use(
      http.get('*/api/products/p-0002', async () => {
        await delay(800)
        return HttpResponse.json(slow)
      }),
    )
    // Capture the AbortSignal the API client hands to fetch for the slow product.
    const signals = new Map<string, AbortSignal>()
    const realFetch = globalThis.fetch
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const url = input instanceof Request ? input.url : String(input)
      if (init?.signal) signals.set(url, init.signal)
      return realFetch(input, init)
    })

    const { router } = renderApp('/products/p-0002')
    await act(() => router.navigate('/products/p-0003'))

    expect(await screen.findByRole('heading', { level: 1, name: fast.name })).toBeVisible()
    // Give the slow response time to arrive. It must not replace the current product.
    await act(() => delay(1000))
    expect(screen.getByRole('heading', { level: 1, name: fast.name })).toBeVisible()
    expect(screen.queryByRole('heading', { level: 1, name: slow.name })).not.toBeInTheDocument()
    const slowSignal = [...signals].find(([url]) => url.endsWith('/products/p-0002'))?.[1]
    expect(slowSignal?.aborted).toBe(true)
  })

  it('moves between products with the arrow keys', async () => {
    const { router } = renderApp('/products/p-0002')
    await screen.findByRole('heading', { level: 1, name: productById('p-0002').name })

    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(router.state.location.pathname).toBe('/products/p-0003')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(router.state.location.pathname).toBe('/products/p-0002')
  })

  it('shows Back to Top after scrolling and removes its listeners when the page closes', async () => {
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const { router } = renderApp('/products/p-0002')
    await screen.findByRole('heading', { level: 1, name: productById('p-0002').name })

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 900 })
    fireEvent.scroll(window)
    expect(await screen.findByRole('button', { name: 'Back to top' })).toBeVisible()

    await act(() => router.navigate('/'))
    await waitFor(() => {
      const removed = removeListener.mock.calls.map(([type]) => type)
      expect(removed).toEqual(expect.arrayContaining(['scroll', 'keydown']))
    })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
  })
})
