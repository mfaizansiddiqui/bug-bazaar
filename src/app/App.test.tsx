import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'

describe('browsing products', () => {
  it('shows the first page of products with prices formatted from cents', async () => {
    renderApp('/')
    const firstCard = await screen.findByRole('link', { name: /Last-One Debugging Duck/ })
    expect(firstCard).toHaveTextContent('$12.99')
    expect(firstCard).toHaveTextContent('Only 1 left')
    const grid = screen.getByRole('list', { name: 'Products' })
    expect(within(grid).getAllByRole('listitem')).toHaveLength(50)
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
