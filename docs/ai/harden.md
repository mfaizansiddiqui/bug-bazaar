# Day 4: Harden (22 pts)

Outcome: the store is accessible, fast, live and tested.

| Task                              | Done when                                                                                                                        |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| D4-1 Accessibility                | Lighthouse accessibility ≥ 90 on home, cart and login. Form errors are announced.                                                |
| D4-2 Performance                  | `docs/performance.md` shows before and after measurements for the two slowest spots.                                             |
| D4-3 Memoization / virtualization | The 5,000-item list scrolls smoothly. Each optimization is justified, including one removed or skipped because it wasn't needed. |
| D4-4 Live stock                   | Stock updates live without a refresh, the feed recovers after a disconnect, and it stops when the page closes.                   |
| D4-5 Testing                      | At least 15 meaningful behavior tests: cart logic, custom hooks, login, filtering, checkout success and checkout 409.            |
| D4-6 Git / CI / CD                | Every PR runs lint, typecheck, tests and build. A failing test blocks the merge (branch protection). Bonus: auto-deploy `main`.  |
| D4-7 Monitoring                   | A thrown error shows a fallback screen and gets logged instead of crashing. `docs/monitoring.md` lists three things to track.    |

## Guidance

- Measure first (React Profiler, Lighthouse), then fix. Record numbers before and after.
- Live stock: MSW `ws` (or SSE or polling, with the choice recorded). Reconnect with backoff, and close the socket on unmount.
- Tests use Testing Library queries by role and label, plus MSW. No snapshot-only tests, and no testing internals.
- CI: GitHub Actions on `pull_request`, with `npm ci` then `npm run check` then `npm run build`.

## Be ready to explain

How WebSockets differ from SSE and polling. When `memo` helps and when it hurts. Why behavior tests survive refactors.
