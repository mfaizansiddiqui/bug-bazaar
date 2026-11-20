import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { App as AntApp } from 'antd'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AppProviders } from '@/app/AppProviders'
import { createQueryClient } from '@/app/queryClient'
import { createRoutes } from '@/app/routes'
import { createAppStore } from '@/app/store'
import { setLogTransport, type LogEntry } from '@/lib/logger'
import { ErrorBoundary } from './ErrorBoundary'

function Boom(): never {
  throw new Error('Kaboom')
}

afterEach(() => {
  setLogTransport(null)
})

describe('error monitoring (D4-7)', () => {
  it('shows the fallback and logs the error instead of crashing', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const logged: LogEntry[] = []
    setLogTransport((entry) => logged.push(entry))

    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Something broke on this page')
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeVisible()
    expect(logged).toHaveLength(1)
    expect(logged[0]).toMatchObject({ message: 'Kaboom', source: 'ErrorBoundary (render)' })
  })

  it('catches a crash inside the app routes and logs it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const logged: LogEntry[] = []
    setLogTransport((entry) => logged.push(entry))
    const router = createMemoryRouter(createRoutes({ showMockControls: true }), {
      initialEntries: ['/cart'],
    })
    render(
      <AntApp>
        <AppProviders store={createAppStore()} queryClient={createQueryClient({ retry: false })}>
          <RouterProvider router={router} useTransitions={false} />
        </AppProviders>
      </AntApp>,
    )
    const user = userEvent.setup()

    // /cart is a lazy route, so wait for it to load.
    await user.click(await screen.findByRole('button', { name: 'Open mock API controls' }))
    await user.click(await screen.findByRole('button', { name: 'Throw a test error' }))

    expect(await screen.findByText('Something broke on this page')).toBeVisible()
    expect(
      logged.some((entry) => entry.message === 'Test crash from the mock controls panel'),
    ).toBe(true)
  })
})
