import { isApiClientError } from '@/api/client'

export interface FieldError<F extends string> {
  name: F
  errors: string[]
}

/**
 * Turns a 400's `details` ({ email: "Email is required" }) into antd form field errors, so
 * each message appears under its own field (D3-4). Returns [] for any other error.
 * Only fields the form actually has are kept, so an unexpected key can't break the form.
 */
export function fieldErrorsFrom<F extends string>(
  error: unknown,
  knownFields: readonly F[],
): FieldError<F>[] {
  if (!isApiClientError(error) || error.kind !== 'validation') return []
  const isKnown = (name: string): name is F => knownFields.some((field) => field === name)
  return Object.entries(error.details).flatMap(([name, message]) =>
    isKnown(name) ? [{ name, errors: [message] }] : [],
  )
}
