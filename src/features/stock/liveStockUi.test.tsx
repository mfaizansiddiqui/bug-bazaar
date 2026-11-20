import { act, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { addToCart } from '@/features/cart/cartSlice'
import { db } from '@/mocks/db'
import { renderApp } from '@/test/renderApp'
import { applyStockUpdate } from './applyStockUpdate'

describe('live stock updates in the UI (D4-4)', () => {
  it('updates the visible stock and caps the cart without a refetch', async () => {
    const product = db.products.find((item) => item.id === 'p-0002')
    if (!product) throw new Error('Seed changed: p-0002 is missing')
    const { store, queryClient } = renderApp('/products/p-0002')
    await screen.findByRole('heading', { level: 1, name: product.name })
    act(() => {
      store.dispatch(addToCart({ product: { ...product, stock: 10 }, quantity: 5 }))
    })

    act(() => {
      applyStockUpdate(queryClient, store.dispatch, {
        type: 'stock',
        productId: 'p-0002',
        stock: 3,
      })
    })

    expect(await screen.findByText('Only 3 left')).toBeVisible()
    expect(store.getState().cart.lines[0]?.quantity).toBe(3)
  })
})
