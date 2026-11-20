import { Navigate, Outlet, useLocation } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { returnToState } from './returnTo'
import { selectIsSignedIn } from './sessionSlice'

/**
 * Route guard for the account page and checkout (D3-3). Signed-out users go to /login,
 * carrying where they were so login can send them back. `replace` keeps the protected URL
 * out of history, so Back after login doesn't bounce them to the login page again.
 */
export function RequireAuth() {
  const isSignedIn = useAppSelector(selectIsSignedIn)
  const location = useLocation()

  if (!isSignedIn) return <Navigate to="/login" replace state={returnToState(location)} />
  return <Outlet />
}
