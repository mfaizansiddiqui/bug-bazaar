import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { db } from '@/mocks/db'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'

// A small page keeps this test fast under parallel load. The race doesn't depend on page size.
const RACE_PAGE_SIZE = 12

/** Search handler where one term is slow and every other term is fast: out-of-order replies. */
function useOutOfOrderSearch(slowTerm: string) {
  server.use(
    http.get('*/api/products', async ({ request }) => {
      const search = new URL(request.url).searchParams.get('search')?.toLowerCase() ?? ''
      await delay(search === slowTerm ? 1500 : 50)
      const items = db.products.filter((product) => product.name.toLowerCase().includes(search))
      return HttpResponse.json({ items: items.slice(0, RACE_PAGE_SIZE), total: items.length })
    }),
  )
}

async function visibleNames(): Promise<string[]> {
  const grid = await screen.findByRole('list', { name: 'Products' })
  return within(grid)
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent.toLowerCase())
}

describe('search race conditions (D2-6)', () => {
  it('shows results for the latest query even when an older reply arrives last', async () => {
    useOutOfOrderSearch('duck')
    const { router } = renderApp('/')
    await visibleNames()

    // "duck" is asked first and answers last (1.5 s). "mug" is asked second and answers in 50 ms.
    // The search box writes these same URLs after its debounce. Navigating directly inside
    // act() keeps the test deterministic.
    await act(() => router.navigate('/?search=duck', { replace: true }))
    await act(() => router.navigate('/?search=mug', { replace: true }))

    await waitFor(async () => {
      expect((await visibleNames()).every((name) => name.includes('mug'))).toBe(true)
    })

    // Let the slow "duck" reply arrive. The screen must still show "mug" results.
    await act(() => delay(1700))
    const names = await visibleNames()
    expect(names.length).toBeGreaterThan(0)
    expect(names.every((name) => name.includes('mug'))).toBe(true)
    expect(screen.getByLabelText('Search')).toHaveValue('mug')
  })

  it('sends one request for a fast burst of typing', async () => {
    const searches: string[] = []
    server.use(
      http.get('*/api/products', ({ request }) => {
        searches.push(new URL(request.url).searchParams.get('search') ?? '')
        return HttpResponse.json({ items: [], total: 0 })
      }),
    )
    const user = userEvent.setup()
    renderApp('/')
    await screen.findByText('No products match your filters')

    await user.type(screen.getByLabelText('Search'), 'keyboard')
    await waitFor(() => {
      expect(searches).toContain('keyboard')
    })
    // The initial page load plus one search, not one request per letter.
    expect(searches).toEqual(['', 'keyboard'])
  })
})
