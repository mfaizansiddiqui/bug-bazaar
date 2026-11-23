# Testing

**86 tests in 20 files**, all passing in CI (`npm test`). Run one area with e.g. `npx vitest run src/features/cart`.

## Approach: test behavior, not implementation

- **Through the real app where possible.** `renderApp(url)` (`src/test/renderApp.tsx`) renders the real route table, Redux store and query cache at a URL. Tests then act like a user: they find elements by role and accessible name (`getByRole('button', { name: 'Place order' })`), click and type with `userEvent`, and check what is on screen or in the URL. They don't call component internals, inspect state shapes, or use snapshots.
- **Against the real API contract.** Requests go through the real `client.ts` to the same MSW handlers the browser uses, so status codes, error bodies and the idempotency check are exercised for real. `onUnhandledFrame: 'error'` fails any test that hits an unmocked endpoint.
- **Isolation.** After every test: the DOM is cleaned up, the mock database, mock controls, `localStorage` and the in-memory token are reset (`src/test/setup.ts`). Each test starts as a fresh, signed-out visitor.
- **Time without waiting.** Debounce, backoff and reconnect tests use fake timers. The live socket is a fake, so those tests are deterministic.
- A test that fails for the right reason was checked by breaking the code it guards (e.g. removing `React.memo` makes the render-count test fail: 50 renders instead of 1).

## The behaviors the brief asks for (D4-5)

| Behavior              | Tests (file › test)                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cart logic**        | `cartSlice.test.ts` › derives count and total in cents · never exceeds stock when adding or editing · ignores out-of-stock and removes lines · shrinks/drops a line when stock drops · keeps one checkout key across retries, resets it when the cart changes · keeps the key when a stock update leaves quantities alone                                                                                           |
| **Custom hooks**      | `hooks.test.ts` › useDebouncedValue passes only the last value after the delay · cancels its timer on unmount · useWindowEvent calls the latest handler and removes the listener on unmount. `liveStock.test.ts` › backoff, reconnect, stop                                                                                                                                                                         |
| **Login**             | `auth.test.tsx` › redirects to login and back to the wanted page · header swaps Sign in for the account link and Sign out, and back · announces wrong credentials · can't be double-submitted · 400 field errors under the right field · a 401 clears the session. `a11y.test.tsx` › form errors announced and focused                                                                                              |
| **Filtering**         | `ProductFilters.test.tsx` › a shared link rebuilds the view · filters go to the URL and Back undoes them · out-of-stock filter shows only sold-out items · page size from a shared link, and written to the URL · result count and Clear · debounced search uses replace · invalid URL values are ignored. `searchRace.test.tsx` › latest query wins against out-of-order replies · one request per burst of typing |
| **Checkout: success** | `checkout.test.tsx` › places an order, shows confirmation, empties the cart, reduces stock                                                                                                                                                                                                                                                                                                                          |
| **Checkout: 409**     | `checkout.test.tsx` › names the item that ran out and shrinks the cart to the real stock. `handlers.test.ts` › the API answers 409 with the product name                                                                                                                                                                                                                                                            |
| **Checkout: retry**   | `checkout.test.tsx` › a retry after a lost response creates no second order                                                                                                                                                                                                                                                                                                                                         |

## Other covered areas

| Area                                                                                                         | File                          |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| API client: contract validation, status → error kind, 401 hook, token, network errors                        | `client.test.ts`              |
| Mock API: search, sort, paging, in-stock, forced errors, orders                                              | `handlers.test.ts`            |
| One error policy (copy for every kind, 401 notice, 500 retry, no raw messages)                               | `errorHandling.test.tsx`      |
| UI states: loading, empty, error + retry, not found                                                          | `StatusView.test.tsx`         |
| Effects: switching products aborts the old request and never shows the wrong one; listeners removed on close | `ProductDetailsPage.test.tsx` |
| Caching: no refetch on revisit or grid → details; stock refreshes after an order                             | `caching.test.tsx`            |
| Live stock reaches the UI and caps the cart                                                                  | `liveStockUi.test.tsx`        |
| Grid renders only what's on screen; keyboard opens a product                                                 | `App.test.tsx`                |
| Only the changed card re-renders on a stock update                                                           | `ProductGrid.perf.test.tsx`   |
| Crash → fallback + log                                                                                       | `ErrorBoundary.test.tsx`      |
| axe-core: no violations on home, cart, login; skip link                                                      | `a11y.test.tsx`               |
| Request status can't represent impossible states (compile-time)                                              | `requestState.test.ts`        |
| Price formatting from cents                                                                                  | `money.test.ts`               |

## Making the suite reliable

Early versions were flaky only under the full parallel run, which is worth knowing when debugging CI:

- React Router applies navigations inside React transitions. Updates triggered outside `act()` (debounced search, async handlers) could stay uncommitted in jsdom under load, so `renderApp` uses `useTransitions={false}`. The browser app keeps transitions.
- Pages of 50 antd cards take seconds to render in jsdom under load, so `findBy*` waits up to 5 s and Vitest uses half the CPU cores (`maxWorkers: '50%'`).
- jsdom has no `matchMedia`, `ResizeObserver` or layout, so these are stubbed in `setup.ts`, and the virtual grid falls back to its row-height estimate when a row measures 0 px.
