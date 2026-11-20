import type { FetchStatus } from '@tanstack/react-query'
import { ApiClientError, isApiClientError } from '@/api/client'
import type { RequestState } from '@/api/requestState'

/** The parts of a TanStack Query result (plain or infinite) the adapter needs. */
interface QueryResultLike<T> {
  status: 'pending' | 'error' | 'success'
  data: T | undefined
  error: unknown
  fetchStatus: FetchStatus
}

/**
 * Adapter from a TanStack Query result to our own RequestState union (D1-3).
 * Pages and StatusView depend only on RequestState, so they don't care which
 * library fetched the data.
 */
export function toRequestState<T>(query: QueryResultLike<T>): RequestState<T> {
  if (query.status === 'success' && query.data !== undefined) {
    return { status: 'success', data: query.data }
  }
  if (query.status === 'error') {
    const error = isApiClientError(query.error)
      ? query.error
      : new ApiClientError({ kind: 'server', status: null, code: 'UNEXPECTED_ERROR' })
    return { status: 'error', error }
  }
  // Pending and not fetching means the query is disabled: nothing has been asked for yet.
  return query.fetchStatus === 'idle' ? { status: 'idle' } : { status: 'loading' }
}
