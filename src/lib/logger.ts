import { isApiClientError } from '@/api/client'

/**
 * Error logging (D4-7). One function every part of the app reports to, so swapping the
 * transport (console now, a service like Sentry in production) is a one-file change.
 *
 * Privacy: only safe fields are logged. API errors are reduced to kind/status/code (never
 * the response body), and nothing here ever sees the auth token.
 */

export interface LogEntry {
  message: string
  name: string
  source: string
  stack?: string
  api?: { kind: string; status: number | null; code: string }
  url: string
  time: string
}

type Transport = (entry: LogEntry) => void

const consoleTransport: Transport = (entry) => {
  console.error(`[bug-bazaar] ${entry.source}: ${entry.name}: ${entry.message}`, entry)
}

let transport: Transport = consoleTransport
const recent: LogEntry[] = []
const MAX_RECENT = 50

/** Replace where logs go (a monitoring service, or a spy in tests). */
export function setLogTransport(next: Transport | null): void {
  transport = next ?? consoleTransport
}

/** The last few entries, newest last. Handy in devtools: useful context for a bug report. */
export function recentLogs(): readonly LogEntry[] {
  return recent
}

export function logError(error: unknown, source: string): LogEntry {
  const base = error instanceof Error ? error : new Error(String(error))
  const entry: LogEntry = {
    message: base.message,
    name: base.name,
    source,
    ...(base.stack ? { stack: base.stack } : {}),
    ...(isApiClientError(error)
      ? { api: { kind: error.kind, status: error.status, code: error.code } }
      : {}),
    url: window.location.pathname,
    time: new Date().toISOString(),
  }
  recent.push(entry)
  if (recent.length > MAX_RECENT) recent.shift()
  transport(entry)
  return entry
}

/** Catches errors that escape React entirely: event handlers, timers, rejected promises. */
export function installGlobalErrorHandlers(): () => void {
  const onError = (event: ErrorEvent) => {
    logError(event.error ?? event.message, 'window.onerror')
  }
  const onRejection = (event: PromiseRejectionEvent) => {
    logError(event.reason, 'unhandledrejection')
  }
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
  return () => {
    window.removeEventListener('error', onError)
    window.removeEventListener('unhandledrejection', onRejection)
  }
}
