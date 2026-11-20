import type { UseQueryResult } from '@tanstack/react-query'
import { ApiClientError, isApiClientError } from '@/api/client'
import type { RequestState } from '@/api/requestState'

/**
 * Adapter from a TanStack Query result to our own RequestState union (D1-3).
 * Pages and StatusView depend only on RequestState, so they don't care which
 * library fetched the data.
 */
export function toRequestState<T>(query: UseQueryResult<T>): RequestState<T> {
  if (query.isSuccess) return { status: 'success', data: query.data }
  if (query.isError) {
    const error = isApiClientError(query.error)
      ? query.error
      : new ApiClientError({ kind: 'server', status: null, code: 'UNEXPECTED_ERROR' })
    return { status: 'error', error }
  }
  // Pending and not fetching means the query is disabled: nothing has been asked for yet.
  return query.fetchStatus === 'idle' ? { status: 'idle' } : { status: 'loading' }
}
