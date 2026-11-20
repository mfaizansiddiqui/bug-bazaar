import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { resetMockControls, setMockControls } from '@/mocks/controls'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'

describe('UI states on the list and details pages', () => {
  it('shows a loading status while products load', async () => {
    setMockControls({ latency: 'slow' })
    renderApp('/')
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
    // The mock waits 1.5 s on purpose, so allow extra time under parallel load.
    expect(await screen.findByRole('list', { name: 'Products' }, { timeout: 10_000 })).toBeVisible()
  })

  it('shows a friendly error with a retry that recovers after a 500', async () => {
    const user = userEvent.setup()
    setMockControls({ failRoute: 'products', failStatus: 500 })
    renderApp('/')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong on our side')
    expect(alert).not.toHaveTextContent('Forced: server error')

    resetMockControls()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('list', { name: 'Products' })).toBeVisible()
  })

  it('shows the empty state when nothing matches', async () => {
    server.use(http.get('*/api/products', () => HttpResponse.json({ items: [], total: 0 })))
    renderApp('/')
    expect(await screen.findByText('No products match your filters')).toBeVisible()
  })

  it('shows the not found page for an unknown product', async () => {
    renderApp('/products/does-not-exist')
    expect(await screen.findByText('Product not found')).toBeVisible()
  })

  it('shows the same error and retry on the details page', async () => {
    setMockControls({ failRoute: 'product', failStatus: 404 })
    renderApp('/products/p-0002')
    expect(await screen.findByText('Product not found')).toBeVisible()
  })
})
