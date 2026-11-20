import type { Location } from 'react-router'

/** Router state that RequireAuth leaves for the login page: where the user was heading. */
export interface ReturnToState {
  from: { pathname: string; search: string }
}

export function returnToState(location: Location): ReturnToState {
  return { from: { pathname: location.pathname, search: location.search } }
}

/** Reads the return path from router state. Router state is untyped, so it is checked. */
export function returnPathFrom(state: unknown): string {
  if (typeof state === 'object' && state !== null && 'from' in state) {
    const { from } = state
    if (typeof from === 'object' && from !== null && 'pathname' in from) {
      const { pathname, search } = from as { pathname: unknown; search?: unknown }
      // Only same-app paths, never a full URL: avoids an open redirect.
      if (typeof pathname === 'string' && pathname.startsWith('/') && !pathname.startsWith('//')) {
        return pathname + (typeof search === 'string' ? search : '')
      }
    }
  }
  return '/'
}
