import { useEffect } from 'react'
import { useRouteError } from 'react-router'
import { logError } from '@/lib/logger'
import { ErrorFallback } from './ErrorFallback'

/**
 * errorElement for the route tree. React Router catches render errors in routes before a
 * normal error boundary would, so this is where they are logged and turned into the fallback.
 */
export function RouteErrorFallback() {
  const error = useRouteError()

  // Logging is a side effect, so it runs after render, once per error.
  useEffect(() => {
    logError(error, 'route')
  }, [error])

  return <ErrorFallback />
}
