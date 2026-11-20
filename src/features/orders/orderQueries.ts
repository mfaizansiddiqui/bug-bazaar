import { useQuery } from '@tanstack/react-query'
import { getOrder } from '@/api/client'

const POLL_MS = 1000

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => [...orderKeys.all, id] as const,
}

/**
 * Polls the order until it reaches a final status. The interval belongs to the query
 * observer, so it stops by itself when the confirmation page unmounts.
 */
export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: ({ signal }) => getOrder(id, signal),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'confirmed' || status === 'failed' ? false : POLL_MS
    },
  })
}
