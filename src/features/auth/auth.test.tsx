import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { DEMO_PASSWORD, DEMO_USER, issueToken } from '@/mocks/db'
import { setMockControls } from '@/mocks/controls'
import { server } from '@/mocks/server'
import { renderApp } from '@/test/renderApp'

async function fillLogin(email: string, password: string) {
  const user = userEvent.setup()
  await user.type(await screen.findByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Password'), password)
  return user
}

describe('login and protected routes', () => {
  it('sends a signed-out user to login, then back to the page they wanted', async () => {
    const { router } = renderApp('/account')
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })

    const user = await fillLogin(DEMO_USER.email, DEMO_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/account')
    })
    expect(await screen.findByText(DEMO_USER.email)).toBeVisible()
  })

  it('announces wrong credentials without leaving the page', async () => {
    const { router } = renderApp('/login')
    const user = await fillLogin(DEMO_USER.email, 'wrong-password')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password.')
    expect(router.state.location.pathname).toBe('/login')
  })

  it("can't be double-submitted", async () => {
    let requests = 0
    server.use(
      http.post('*/api/login', async () => {
        requests += 1
        await delay(300)
        return HttpResponse.json({ token: issueToken(), user: DEMO_USER })
      }),
    )
    renderApp('/login')
    const user = await fillLogin(DEMO_USER.email, DEMO_PASSWORD)
    const button = screen.getByRole('button', { name: 'Sign in' })

    await user.click(button)
    await user.click(button)
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument()
    })
    expect(requests).toBe(1)
  })

  it('shows server field errors from a 400 under the right field', async () => {
    setMockControls({ failRoute: 'login', failStatus: 400 })
    renderApp('/login')
    const user = await fillLogin(DEMO_USER.email, DEMO_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    // antd fades field errors in, so check presence rather than visibility.
    expect(await screen.findByText('Forced: email is invalid')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
  })

  it('clears the session when the API answers 401', async () => {
    const { router, store } = renderApp('/login')
    const user = await fillLogin(DEMO_USER.email, DEMO_PASSWORD)
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => {
      expect(store.getState().session.user).not.toBeNull()
    })

    setMockControls({ failRoute: 'me', failStatus: 401 })
    await router.navigate('/account')

    await waitFor(() => {
      expect(store.getState().session.user).toBeNull()
    })
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
  })
})
