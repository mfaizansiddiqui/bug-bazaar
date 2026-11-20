import { Profiler, useState } from 'react'
import { act, render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { Product } from '@/api/contract'
import { formatCents } from '@/lib/money'
import { seedProducts } from '@/mocks/seed'
import { ProductGrid } from './ProductGrid'

// Every ProductCard render formats its price exactly once, so counting formatCents calls
// counts card renders without changing the component.
vi.mock('@/lib/money', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/money')>()
  return { formatCents: vi.fn(original.formatCents) }
})

const PAGE_SIZE = 50
const UPDATES = 20

/**
 * D4-2 measurement: the cost of one live stock update to a page of 50 cards.
 * The update is built the way applyStockUpdate builds it: a new list in which only the
 * changed product is a new object. React's <Profiler> gives each commit's render time.
 */
describe('ProductGrid render cost (D4-2)', () => {
  it('re-renders only the card whose stock changed', () => {
    const page = seedProducts().slice(0, PAGE_SIZE)
    const changed = page.map((item, index) => (index === 7 ? { ...item, stock: 0 } : item))
    const durations: number[] = []
    let show: (next: Product[]) => void = () => undefined

    function Harness() {
      const [products, setProducts] = useState(page)
      show = setProducts
      return (
        <Profiler
          id="grid"
          onRender={(_id, phase, actualDuration) => {
            if (phase === 'update') durations.push(actualDuration)
          }}
        >
          <ProductGrid products={products} />
        </Profiler>
      )
    }

    render(
      <RouterProvider
        router={createMemoryRouter([{ path: '/', element: <Harness /> }])}
        useTransitions={false}
      />,
    )
    const cardRenders = vi.mocked(formatCents)
    cardRenders.mockClear()

    for (let update = 0; update < UPDATES; update += 1) {
      act(() => {
        // Alternate, so every update really changes product 7.
        show(update % 2 === 0 ? changed : page)
      })
    }

    const perUpdate = cardRenders.mock.calls.length / UPDATES
    const average = durations.reduce((sum, value) => sum + value, 0) / durations.length
    console.info(
      `[perf] one stock update: ${perUpdate.toFixed(0)} card renders, ${average.toFixed(2)} ms render time (avg of ${String(durations.length)})`,
    )
    expect(perUpdate).toBe(1)
  })
})
