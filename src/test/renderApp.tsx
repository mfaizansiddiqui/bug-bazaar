import { render } from '@testing-library/react'
import { App as AntApp } from 'antd'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { AppProviders } from '@/app/AppProviders'
import { createQueryClient } from '@/app/queryClient'
import { createRoutes } from '@/app/routes'
import { createAppStore } from '@/app/store'

/**
 * Renders the real app at a URL against the MSW mock, with a fresh store (cart loaded from
 * localStorage, like a reload), a fresh query cache and no retries.
 */
export function renderApp(url = '/') {
  const store = createAppStore()
  const queryClient = createQueryClient({ retry: false })
  const router = createMemoryRouter(createRoutes(), { initialEntries: [url] })
  const view = render(
    <AntApp>
      <AppProviders store={store} queryClient={queryClient}>
        {/*
          No startTransition in tests. Router updates triggered outside act() (debounced
          search, async handlers) could otherwise stay uncommitted in jsdom under parallel
          load. The browser app keeps transitions. The logic under test is the same.
        */}
        <RouterProvider router={router} useTransitions={false} />
      </AppProviders>
    </AntApp>,
  )
  return { ...view, router, queryClient, store }
}
