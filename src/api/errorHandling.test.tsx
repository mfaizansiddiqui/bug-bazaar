import { act, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { setMockControls } from '@/mocks/controls'
import { renderApp } from '@/test/renderApp'
import { signInDemoUser } from '@/test/session'
import { ApiClientError, type ApiErrorKind } from './client'
import { errorCopy } from './errorCopy'

const ALL_KINDS: ApiErrorKind[] = [
  'validation',
  'unauthorized',
  'notFound',
  'conflict',
  'server',
  'network',
  'invalidResponse',
]

describe('backend error policy (D3-4)', () => {
  it('has friendly copy for every error kind, and only 5xx/network errors offer a retry', () => {
    for (const kind of ALL_KINDS) {
      const copy = errorCopy(new ApiClientError({ kind, status: null, code: 'X' }))
      expect(copy.title.length).toBeGreaterThan(0)
      expect(copy.retryable).toBe(
        kind === 'server' || kind === 'network' || kind === 'invalidResponse',
      )
    }
  })

  it('treats an unexpected non-API error as a server error, never showing its message', () => {
    const copy = errorCopy(new Error('TypeError: cannot read x of undefined'))
    expect(copy.title).toBe('Something went wrong on our side')
  })

  it('on a 401 signs the user out and explains why on the login page', async () => {
    const { router, store } = renderApp('/')
    await signInDemoUser(store)
    setMockControls({ failRoute: 'me', failStatus: 401 })

    await act(() => router.navigate('/account'))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })
    expect(await screen.findByText('Your session has ended. Please sign in again.')).toBeVisible()
  })

  it('on a 500 shows friendly copy and a retry, never the raw server message', async () => {
    const { router, store } = renderApp('/')
    await signInDemoUser(store)
    setMockControls({ failRoute: 'me', failStatus: 500 })

    await act(() => router.navigate('/account'))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Something went wrong on our side')
    expect(alert).not.toHaveTextContent('Forced')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible()
    // A 500 is not a 401: the user stays signed in.
    expect(store.getState().session.user).not.toBeNull()
  })
})
