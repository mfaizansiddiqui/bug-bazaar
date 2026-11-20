import { ApiClientError } from '@/api/client'

/** Awaits a request that should fail and returns its typed ApiClientError. */
export async function captureError(promise: Promise<unknown>): Promise<ApiClientError> {
  try {
    await promise
  } catch (error) {
    if (error instanceof ApiClientError) return error
    throw error
  }
  throw new Error('Expected the request to fail')
}
