import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getResponse, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { handlers } from '@/mocks/handlers'
import { db } from '@/mocks/db'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'
import { signInDemoUser } from '@/test/session'
import { addToCart } from './cartSlice'

function seeded(id: string) {
  const product = db.products.find((item) => item.id === id)
  if (!product) throw new Error(`No seeded product ${id}`)
  return product
}

async function startAtCheckout(productId: string, quantity: number) {
  const app = renderApp('/')
  await signInDemoUser(app.store)
  act(() => {
    app.store.dispatch(addToCart({ product: { ...seeded(productId) }, quantity }))
  })
  await act(() => app.router.navigate('/checkout'))
  await screen.findByRole('heading', { level: 1, name: 'Checkout' })
  return app
}

describe('checkout', () => {
  it('places an order, shows the confirmation, empties the cart and reduces stock', async () => {
    const stockBefore = seeded('p-0002').stock
    const { router, store } = await startAtCheckout('p-0002', 2)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Place order' }))

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Thank you, your order is placed' }),
    ).toBeVisible()
    expect(router.state.location.pathname).toBe('/orders/o-1')
    expect(store.getState().cart.lines).toEqual([])
    expect(seeded('p-0002').stock).toBe(stockBefore - 2)
  })

  it('names the item that ran out on a 409 and shrinks the cart to the real stock', async () => {
    const { store } = await startAtCheckout('p-0001', 1)
    // Someone else buys the last one before we press the button.
    seeded('p-0001').stock = 0
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Place order' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Not enough stock for “Last-One Debugging Duck”',
    )
    await waitFor(() => {
      expect(store.getState().cart.lines).toEqual([])
    })
    expect(db.orders.size).toBe(0)
  })

  it('does not create a second order when a checkout is retried', async () => {
    // First attempt: the server creates the order, but the response is lost on the way back.
    server.use(
      http.post(
        '*/api/orders',
        async ({ request }) => {
          await getResponse(handlers, request)
          return HttpResponse.error()
        },
        { once: true },
      ),
    )
    const { router } = await startAtCheckout('p-0002', 1)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Place order' }))
    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('You seem to be offline')
    expect(db.orders.size).toBe(1)

    await user.click(screen.getByRole('button', { name: 'Try again' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/orders/o-1')
    })
    expect(db.orders.size).toBe(1)
  })

  it('keeps the cart after a reload', async () => {
    const first = renderApp('/')
    act(() => {
      first.store.dispatch(addToCart({ product: seeded('p-0003'), quantity: 1 }))
    })
    first.unmount()

    renderApp('/cart')
    expect(await screen.findByRole('link', { name: seeded('p-0003').name })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Cart, 1 item' })).toBeVisible()
  })

  it('adds a product from its details page and updates the header badge', async () => {
    const user = userEvent.setup()
    renderApp('/products/p-0002')
    await screen.findByRole('heading', { level: 1, name: seeded('p-0002').name })

    await user.click(screen.getByRole('button', { name: /Add to cart/ }))
    expect(await screen.findByRole('link', { name: 'Cart, 1 item' })).toBeVisible()
  })
})
