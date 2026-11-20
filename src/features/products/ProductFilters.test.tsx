import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '@/test/renderApp'
import { parseFilters } from './useProductFilters'

async function productNames(): Promise<string[]> {
  const grid = await screen.findByRole('list', { name: 'Products' })
  return within(grid)
    .getAllByRole('heading', { level: 2 })
    .map((heading) => heading.textContent)
}

describe('product filters', () => {
  it('rebuilds the same view from a shared link (and so after a refresh)', async () => {
    renderApp('/?category=ducks&inStock=true&sort=price-asc&search=duck')

    expect(screen.getByLabelText('Search')).toHaveValue('duck')
    expect(screen.getByRole('checkbox', { name: 'In stock only' })).toBeChecked()
    const names = await productNames()
    expect(names.length).toBeGreaterThan(0)
    expect(names.every((name) => name.toLowerCase().includes('duck'))).toBe(true)
  })

  it('writes filter changes to the URL and Back undoes them', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    await productNames()

    await user.click(screen.getByRole('checkbox', { name: 'In stock only' }))
    expect(router.state.location.search).toBe('?inStock=true')
    expect(await screen.findByText(/^[\d,]+ products$/)).toBeVisible()

    await router.navigate(-1)
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: 'In stock only' })).not.toBeChecked()
    })
    expect(router.state.location.search).toBe('')
  })

  it('shows the result count and clears every filter', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/?category=coffee&inStock=true')
    const count = await screen.findByText(/^[\d,]+ products?$/)
    expect(count.textContent).not.toBe('5,000 products')

    await user.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(router.state.location.search).toBe('')
    expect(await screen.findByText('5,000 products')).toBeVisible()
  })

  it('puts the search in the URL once typing pauses, without a history entry per pause', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/')
    await productNames()

    await user.type(screen.getByLabelText('Search'), 'espresso')
    await waitFor(() => {
      expect(router.state.location.search).toBe('?search=espresso')
    })
    expect(router.state.historyAction).toBe('REPLACE')
    await waitFor(
      async () => {
        const names = await productNames()
        expect(names.every((name) => name.toLowerCase().includes('espresso'))).toBe(true)
      },
      { timeout: 5000 },
    )
  })

  it('ignores invalid values in a hand-edited link', () => {
    const filters = parseFilters(new URLSearchParams('category=hats&sort=cheapest&page=-3'))
    expect(filters).toMatchObject({ category: null, sort: 'relevance', page: 1 })
  })
})
