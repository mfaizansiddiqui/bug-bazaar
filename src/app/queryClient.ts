import { QueryClient } from '@tanstack/react-query'
import { isApiClientError } from '@/api/client'

const MAX_RETRIES = 2

/**
 * The server-state cache. TanStack Query stores product data by query key, shares one
 * request between components that ask for the same key, and cancels requests whose key
 * is no longer on screen (the queryFn passes its AbortSignal to the API client).
 */
export function createQueryClient({ retry = true }: { retry?: boolean } = {}): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Product data may be up to a minute old before a background refetch (see D3-5).
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        // Retry only failures that can fix themselves. A 404 or 401 won't change on retry.
        retry: (failureCount, error) =>
          retry &&
          failureCount < MAX_RETRIES &&
          isApiClientError(error) &&
          (error.kind === 'server' || error.kind === 'network'),
      },
    },
  })
}
