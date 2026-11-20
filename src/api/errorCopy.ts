import type { ApiErrorKind } from './client'
import { isApiClientError } from './client'

export interface ErrorCopy {
  title: string
  description: string
  /** Whether trying the same request again could succeed. */
  retryable: boolean
}

/**
 * The single place that turns an error into words for users. Raw server messages never
 * reach the screen. Every kind of error maps to copy written here.
 */
const COPY: Record<ApiErrorKind, ErrorCopy> = {
  validation: {
    title: 'Something in the request was not valid',
    description: 'Check the highlighted fields and try again.',
    retryable: false,
  },
  unauthorized: {
    title: 'Please sign in',
    description: 'Your session has ended. Sign in again to continue.',
    retryable: false,
  },
  notFound: {
    title: 'Not found',
    description: 'It may have been removed, or the link is wrong.',
    retryable: false,
  },
  conflict: {
    title: 'Not enough stock',
    description: 'One of the items no longer has enough stock.',
    retryable: false,
  },
  server: {
    title: 'Something went wrong on our side',
    description: 'This is usually temporary. Please try again.',
    retryable: true,
  },
  network: {
    title: 'You seem to be offline',
    description: 'Check your connection and try again.',
    retryable: true,
  },
  invalidResponse: {
    title: 'We received an unexpected response',
    description: 'Please try again in a moment.',
    retryable: true,
  },
}

export function errorKindOf(error: unknown): ApiErrorKind {
  // Anything that isn't an ApiClientError (e.g. a bug in our own code) counts as a server error.
  return isApiClientError(error) ? error.kind : 'server'
}

export function errorCopy(error: unknown): ErrorCopy {
  return COPY[errorKindOf(error)]
}
