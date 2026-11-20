# Monitoring

## What happens when something crashes

| Where the error happens                  | Caught by                                                                                  | Result                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Rendering inside any route               | `errorElement: <RouteErrorFallback />` on the root route                                   | Fallback screen + `logError(error, 'route')`                  |
| Rendering outside the router (providers) | `<ErrorBoundary>` in `main.tsx`                                                            | Fallback screen + `logError(error, 'ErrorBoundary (render)')` |
| Event handlers, timers, async code       | `window` `error` / `unhandledrejection` listeners (`installGlobalErrorHandlers`)           | Logged; the page keeps working                                |
| API failures                             | Not crashes: turned into `ApiClientError` and shown as UI states (see `docs/decisions.md`) | Friendly message, retry where it helps                        |

The fallback (`ErrorFallback`) offers **Reload** and **Go to the shop**, and uses no router or store, because either may be what crashed.

**Try it:** open the **Mock** panel and press **Throw a test error**. It throws during render, the fallback appears, and the console shows the logged entry. `recentLogs()` in `src/lib/logger.ts` keeps the last 50 entries.

**What gets logged:** message, error name, stack, where it was caught, the page path and the time. For API errors, only `kind`, `status` and `code`, never the response body. The auth token never passes through the logger. In production, `setLogTransport` would point at a service such as Sentry instead of the console.

## Three things I'd track

1. **Checkout failure rate, split by reason.** Of all "Place order" attempts, how many end in 409 (out of stock), 5xx/network, or 401 (session expired mid-checkout)? This is the step where errors cost real money. A rising 409 rate means stock shown while browsing is too stale (consider a shorter `staleTime` or live stock everywhere). A rising 5xx rate means the order service is struggling. **Alert** if it goes above ~2% over 15 minutes.

2. **Product list latency (p75/p95) and time to first product.** The time from opening the shop or changing a filter until the grid shows results, measured in the browser (`performance.mark` around the query, plus Core Web Vitals LCP/INP). Search and filters are the main way people shop. Slow results directly reduce sales, and p95 shows what users on slow networks feel.

3. **Crash rate per release.** Sessions that hit the error boundary or an unhandled error, divided by all sessions, grouped by release version and page. A jump right after a deploy points at that release and is the signal to roll back.
