import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logError } from '@/lib/logger'
import { ErrorFallback } from './ErrorFallback'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  reference: string | null
}

/**
 * Last line of defence around the whole app (D4-7). Error boundaries must be class
 * components: React only offers getDerivedStateFromError and componentDidCatch to classes.
 * Errors inside routes are caught first by the route's errorElement (RouteErrorFallback).
 * This catches anything above the router.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { reference: null }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { reference: 'pending' }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    const entry = logError(error, `ErrorBoundary${info.componentStack ? ' (render)' : ''}`)
    this.setState({ reference: entry.time })
  }

  override render() {
    if (this.state.reference !== null) {
      return <ErrorFallback reference={this.state.reference} />
    }
    return this.props.children
  }
}
