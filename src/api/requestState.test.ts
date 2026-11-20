import { describe, expect, expectTypeOf, it } from 'vitest'
import { ApiClientError } from './client'
import { assertNever, type RequestState } from './requestState'

function describeState(state: RequestState<string[]>): string {
  switch (state.status) {
    case 'idle':
      return 'idle'
    case 'loading':
      return 'loading'
    case 'error':
      return `error:${state.error.kind}`
    case 'success':
      return `success:${String(state.data.length)}`
    default:
      return assertNever(state)
  }
}

describe('RequestState', () => {
  it('narrows to the data only in the success state', () => {
    const state: RequestState<string[]> = { status: 'success', data: ['a', 'b'] }
    expect(describeState(state)).toBe('success:2')
  })

  it('narrows to the error only in the error state', () => {
    const error = new ApiClientError({ kind: 'server', status: 500, code: 'INTERNAL_ERROR' })
    expect(describeState({ status: 'error', error })).toBe('error:server')
  })

  it('rejects impossible states at compile time', () => {
    // @ts-expect-error A success state must carry data.
    const missingData: RequestState<string[]> = { status: 'success' }
    // @ts-expect-error Loading can't also carry data.
    const loadingWithData: RequestState<string[]> = { status: 'loading', data: [] }
    expect([missingData, loadingWithData]).toHaveLength(2)

    expectTypeOf<
      Extract<RequestState<number>, { status: 'success' }>['data']
    >().toEqualTypeOf<number>()
  })
})
