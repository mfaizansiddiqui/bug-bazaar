import axe from 'axe-core'
import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { addToCart } from '@/features/cart/cartSlice'
import { db } from '@/mocks/db'
import { renderApp } from '@/test/renderApp'

/**
 * Automated accessibility checks (D4-1) with axe-core, the engine Lighthouse uses.
 * jsdom has no layout or colors, so color contrast and target size are checked with
 * Lighthouse in a real browser instead (see docs/accessibility.md). Everything else axe
 * knows about (labels, roles, names, landmarks, ARIA) is checked here on every CI run.
 */
async function violations(container: HTMLElement): Promise<string[]> {
  const result = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false } },
  })
  return result.violations.map(
    (violation) => `${violation.id}: ${violation.nodes[0]?.html.slice(0, 120) ?? ''}`,
  )
}

describe('accessibility (D4-1)', () => {
  it('home page has no axe violations', async () => {
    const { container } = renderApp('/')
    await screen.findByRole('link', { name: /Last-One Debugging Duck/ })
    expect(await violations(container)).toEqual([])
  })

  it('cart page has no axe violations', async () => {
    const { container, store } = renderApp('/cart')
    const product = db.products.find((item) => item.id === 'p-0002')
    if (!product) throw new Error('Seed changed: p-0002 is missing')
    act(() => {
      store.dispatch(addToCart({ product, quantity: 1 }))
    })
    await screen.findByRole('heading', { level: 1, name: 'Your cart' })
    expect(await violations(container)).toEqual([])
  })

  it('login page has no axe violations, and form errors are announced', async () => {
    const user = userEvent.setup()
    const { container } = renderApp('/login')
    await screen.findByRole('heading', { level: 1, name: 'Sign in' })
    expect(await violations(container)).toEqual([])

    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    // Announced immediately: a role="alert" summary of every problem.
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please fix these: Enter your email. Enter your password.',
    )
    // And tied to each field: invalid state + message via aria-describedby, focus on the first.
    const email = screen.getByLabelText('Email')
    expect(email).toHaveAttribute('aria-invalid', 'true')
    expect(email.getAttribute('aria-describedby')).toBeTruthy()
    expect(email).toHaveFocus()
  })

  it('offers a skip link as the first Tab stop that moves focus to the main content', async () => {
    const user = userEvent.setup()
    renderApp('/login')
    await screen.findByRole('heading', { level: 1, name: 'Sign in' })

    await user.tab()
    const skip = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skip).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
    expect(within(screen.getByRole('main')).getByRole('heading', { level: 1 })).toBeVisible()
  })
})
