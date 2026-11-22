# Reflection

How confident I am in each topic after the week (task D5-8). 10 means I could build it again without help and explain every line; 5 means I understand what it does but would need references to build it.

## Ratings

| Topic                                        | Rating | Why                                                                                                                                                       |
| -------------------------------------------- | -----: | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project setup, linting, formatting (D1-1)    |      8 | I can explain every script and config. Path aliases and type-checked ESLint rules took the longest to understand.                                         |
| HTTP and API contracts (D1-2)                |      8 | I can read the contract and say what each status code means. Writing MSW handlers from scratch would still take me a while.                               |
| TypeScript (D1-3)                            |      7 | Discriminated unions and `assertNever` make sense to me. Generics in the query hooks and Zod's inferred types are still the hard part.                    |
| Data layer, one API client (D1-4)            |      8 | I know why every request goes through `client.ts`: one place for the token, error mapping and validation.                                                 |
| Product list and details (D2-1)              |      8 | Straightforward, apart from the keyboard and virtualization details added on Day 4.                                                                       |
| Filters in the URL (D2-2)                    |      8 | I can explain push vs replace and why filters belong in the URL. The search input's "adjust state during render" pattern took a second look.              |
| UI states (D2-3)                             |      8 | One `StatusView` for loading, empty, error and success is a pattern I'll reuse.                                                                           |
| useEffect and cleanup (D2-4)                 |      7 | I understand aborting requests and removing listeners. Spotting a missing cleanup by reading code is still something I need to practise.                  |
| Custom hooks (D2-5)                          |      8 | I could write `useDebouncedValue` again without help.                                                                                                     |
| Race conditions (D2-6)                       |      7 | I can explain why the latest query wins (query keys, debounce, cancellation). I would not have found the bug myself without the "random latency" control. |
| Redux Toolkit (D3-1)                         |      8 | Slices, actions and memoized selectors are clear. The listener middleware for saving the cart was new to me.                                              |
| Cart and idempotent checkout (D3-2)          |      7 | I understand the idempotency key well. The bug where a stock update reset it showed me how easy it is to break.                                           |
| Auth and protected routes (D3-3)             |      7 | Redirect-and-return is clear. The token storage trade-off (memory vs cookie) is one I'd want to discuss with a senior.                                    |
| Backend errors (D3-4)                        |      8 | One error policy mapped from `ApiClientError.kind` is simple to explain.                                                                                  |
| Caching (D3-5)                               |      7 | I can explain `staleTime` and invalidation. Deciding how stale is acceptable still needs product input.                                                   |
| Accessibility (D4-1)                         |      7 | I know how to run Lighthouse and axe and fix contrast and labels. Real screen-reader testing is something I haven't done enough of.                       |
| Performance measurement (D4-2)               |      6 | I can read the numbers in `performance.md`, but using the React Profiler and Chrome performance panel on my own is new.                                   |
| Memoization and virtualization (D4-3)        |      6 | I understand why `React.memo` works here and what virtualization removes. The virtualizer's measuring logic I'd need to look up again.                    |
| Live stock over WebSocket (D4-4)             |      6 | Backoff with jitter and cleanup make sense. I haven't built a WebSocket client from scratch.                                                              |
| Testing (D4-5)                               |      7 | I can write behavior tests with Testing Library. Making the suite reliable under parallel load was hard and mostly AI-assisted.                           |
| Git, CI and deploy (D4-6)                    |      7 | Workflows are readable to me. The GitHub Pages setup (Pages source, base path, private repo limits) taught me a lot by failing first.                     |
| Monitoring and error boundaries (D4-7)       |      7 | Clear on what an error boundary catches and what it doesn't. Choosing real metrics for production is new.                                                 |
| Architecture and design patterns (D5-1, 5-2) |      7 | I can draw the data flow and name where each kind of state lives. Naming patterns in someone else's code is the next step.                                |
| Queues and services (D5-3)                   |      5 | I understand the design on paper, but I've never built a queue or worker.                                                                                 |
| Vocabulary (D5-4)                            |      7 | I can explain each term with a store example.                                                                                                             |
| Using AI well (D5-7)                         |      6 | AI sped up the week a lot, but I accepted some code before I fully understood it and had to go back and learn it.                                         |

## Two gaps, each with a next step

### 1. Building without AI

Several parts work and I can explain them, but I didn't write them myself: the virtualized grid, the live stock reconnect logic, and the test setup that made the suite reliable. If the AI weren't there, I would be slower than my ratings suggest.

**Next step:** rebuild the search box with debounce and latest-query-wins from scratch, in a fresh project without AI, then compare it with `ProductFilters.tsx` and `searchRace.test.tsx`. Then do the same for the WebSocket reconnect with backoff.

### 2. Backend and queues in practice

The order queue, workers and dead-letter queue in `docs/orders.md` are a design I've only reasoned about. The mock API fakes the order status with a timer.

**Next step:** build a small Node service with one real queue (for example BullMQ on Redis) that takes an order, processes a fake payment in a worker, retries a failing "email" job and moves it to a dead-letter queue after 3 attempts. Then point the app's `VITE_API_BASE_URL` at it instead of the mock.
