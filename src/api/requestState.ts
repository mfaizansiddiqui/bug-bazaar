import type { ApiClientError } from './client'

/**
 * Request status as a discriminated union (D1-3).
 *
 * Compared with separate flags such as `{ isLoading, error, data }`, this makes impossible
 * states unrepresentable: you can't have data and an error at once, or be loading with stale
 * data you forgot to clear. `data` exists only when status is 'success', and `error` only
 * when status is 'error', so TypeScript makes you check the status before you touch either.
 */
export type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; error: ApiClientError }
  | { status: 'success'; data: T }

export type RequestStatus = RequestState<unknown>['status']

/**
 * Compile-time exhaustiveness check. If a new status is added to the union, every
 * `switch` that ends with `assertNever(state)` stops compiling until it handles it.
 */
export function assertNever(value: never): never {
  throw new Error(`Unhandled value: ${JSON.stringify(value)}`)
}
