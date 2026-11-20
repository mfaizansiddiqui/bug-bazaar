import type { ReactNode } from 'react'
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { Provider } from 'react-redux'
import type { AppStore } from './store'

interface AppProvidersProps {
  store: AppStore
  queryClient: QueryClient
  children: ReactNode
}

/** Client state (Redux) and server state (TanStack Query), shared by main.tsx and tests. */
export function AppProviders({ store, queryClient, children }: AppProvidersProps) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  )
}
