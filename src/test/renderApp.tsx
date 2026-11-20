import { render } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { createQueryClient } from '@/app/queryClient'
import { createRoutes } from '@/app/routes'

/** Renders the real app at a URL, with a fresh cache and no retries, against the MSW mock. */
export function renderApp(url = '/') {
  const queryClient = createQueryClient({ retry: false })
  const router = createMemoryRouter(createRoutes(), { initialEntries: [url] })
  const view = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...view, router, queryClient }
}
