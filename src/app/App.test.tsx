import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'

describe('browsing products', () => {
  it('shows products with prices formatted from cents, rendering only what is on screen', async () => {
    renderApp('/')
    const firstCard = await screen.findByRole('link', { name: /Last-One Debugging Duck/ })
    expect(firstCard).toHaveTextContent('$12.99')
    expect(firstCard).toHaveTextContent('Only 1 left')
    expect(screen.getByText('Showing 50 of 5,000 products')).toBeVisible()

    // Virtualized: 50 products are loaded, but only the rows near the viewport are in the DOM.
    // Each item still tells assistive tech its position in the full list.
    const items = within(screen.getByRole('list', { name: 'Products' })).getAllByRole('listitem')
    expect(items.length).toBeLessThan(50)
    expect(items[0]).toHaveAttribute('aria-posinset', '1')
    expect(items[0]).toHaveAttribute('aria-setsize', '5000')
  })

  it('opens a product from the grid with the keyboard', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    const firstCard = await screen.findByRole('link', { name: /Last-One Debugging Duck/ })

    firstCard.focus()
    await user.keyboard('{Enter}')

    // The details page is a lazy route, so navigation completes once its code has loaded.
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/products/p-0001')
    })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Last-One Debugging Duck' }),
    ).toBeInTheDocument()
  })

  it('shows the not found page for an unknown route', async () => {
    renderApp('/nowhere')
    expect(await screen.findByText('Page not found')).toBeInTheDocument()
  })
})
