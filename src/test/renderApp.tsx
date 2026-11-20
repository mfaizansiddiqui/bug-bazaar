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
        <RouterProvider router={router} />
      </AppProviders>
    </AntApp>,
  )
  return { ...view, router, queryClient, store }
}
