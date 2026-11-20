# Decisions

Each entry gives what was chosen, what else was considered, and why.

## Build tool: Vite

- **Considered:** Create React App (deprecated), Next.js.
- **Why:** this is a client-only store with a mocked API, so server rendering isn't needed. Vite starts fast and its TypeScript template is minimal.

## HTTP: a typed wrapper around `fetch`

- **Considered:** Axios.
- **Why:** there are six endpoints, and the week scores HTTP understanding: status codes, aborting stale requests, mapping 400/401/404/409/500. A short wrapper keeps all of that visible in `src/api/client.ts`. MSW mocks `fetch` with no adapter, and Axios would add a dependency the contract doesn't need.

## Runtime validation: Zod

- **Considered:** hand-written type guards, TypeScript types only.
- **Why:** TypeScript types disappear at runtime, and the server isn't compiled with the app. Zod checks each payload at the boundary, and the types are inferred from the same schema, so they can't drift apart.

## Mock API: MSW

- **Considered:** json-server, Mirage.
- **Why:** MSW intercepts real `fetch` calls, so the app code stays the same as it would be with a real backend. The same handlers run in the browser and in Vitest, and MSW also supports WebSocket mocking for live stock (D4-4).

## UI: Ant Design with SCSS

- **Considered:** MUI, plain CSS, Tailwind.
- **Why:** antd provides accessible form, grid and feedback components (`Form`, `Row`/`Col`, `Result`, `Skeleton`), and theming works through design tokens. SCSS with BEM covers the few cases tokens can't. Rules are in `UI.md`.

## Auth token: in memory only

- **Considered:** `localStorage`, `sessionStorage`, httpOnly cookie.
- **Why:** a token in web storage can be read by any script that runs through XSS. Memory is safer, but the user is logged out on refresh. An httpOnly cookie would be the best choice with a real backend. Full trade-off in `docs/auth.md` (D3-3).

## Tests: Vitest and Testing Library

- **Considered:** Jest.
- **Why:** Vitest reuses the Vite config and aliases, so no separate Babel or ts-jest setup is needed. Testing Library pushes tests toward user-visible behavior.

## Contract extension: `inStock` filter and a fixed page size of 50

- **Considered:** filtering stock on the client, or fetching all 5,000 products at once.
- **Why:** the list is paged on the server, so filtering only the current page on the client would give wrong totals and short pages. A server-side `inStock=true` param keeps `total` correct. It's optional, so it doesn't break the shared contract for anyone who doesn't send it. A fixed page size of 50 keeps responses small, and Day 4 can load more pages as the user scrolls.

## Mock error triggers: a dev panel plus natural cases

- **Considered:** magic query params (`?fail=500`), separate test-only handlers.
- **Why:** the panel can force every documented status on every route without changing app code or URLs, so URL filters stay clean. Latency modes make loading states and out-of-order responses (D2-6) easy to show. Natural cases (wrong password, ordering 2 of `p-0001`) still work for the walkthrough.

## Routing: React Router 7 (data router)

- **Considered:** TanStack Router, hand-rolled `history` handling.
- **Why:** filters must live in the URL (D2-2). `useSearchParams` reads and writes the query string with push or replace, so Back and shared links work for free. `createMemoryRouter` with the same route table lets tests render the real app at any URL.

## Server state: TanStack Query

- **Considered:** `useEffect` + `useState` per page, RTK Query, SWR.
- **Why:** a hand-written effect has to solve caching, request sharing, cancellation and stale responses itself. TanStack Query does all four: the query key is the cache key, the `queryFn` gets an `AbortSignal` that is passed to the API client, and requests whose key leaves the screen are cancelled. Redux Toolkit is still planned for the cart and session (D3-1), because those are client state, not server data. RTK Query would also work, but keeping server data out of Redux makes the server/client split explicit.

## Filter state: the URL, not component state

- **Considered:** `useState` in the page, Redux, `localStorage`.
- **Why:** the brief requires that filters survive a refresh, that a copied link reproduces the view, and that Back works. Only the URL does all three. Discrete changes (category, sort, stock, page) push a history entry. Search uses `replace` after the debounce, so Back doesn't step through half-typed words. Invalid hand-edited values fall back to defaults instead of crashing.

## UI states: one `StatusView` fed by a `RequestState` adapter

- **Considered:** `isLoading`/`isError` checks in each page.
- **Why:** one component makes loading, empty, error-with-retry and success look the same on every page (D2-3). `toRequestState` adapts a TanStack Query result to the D1-3 union, so pages don't depend on the fetching library, and the `switch` ends in `assertNever`, so a new state can't be forgotten. Error text comes from one map (`errorCopy`), so raw server messages never reach the screen.

## Back to Top: our own component, not antd `FloatButton.BackTop`

- **Considered:** antd's built-in `FloatButton.BackTop`.
- **Why:** D2-4 is about owning a listener and its cleanup. Our `BackToTop` uses `useWindowEvent` (a passive scroll listener removed on unmount) and throttles to one check per animation frame, cancelling any pending frame on unmount. The built-in one would hide exactly what this task is meant to show.

## Search race conditions: three layers

- **Considered:** a manual "latest request id" check in a `useEffect`.
- **Why:** every search must show results for the latest query, even when replies arrive out of order (D2-6).
  1. **Debounce (300 ms):** a burst of typing sends one request instead of one per letter. This is an optimisation, not a fix on its own.
  2. **Abort:** when the query key changes, TanStack Query aborts the old request through its `AbortSignal`.
  3. **Key isolation (the real guarantee):** each response is stored under the query that asked for it, and the page only reads the current key. Even if the server ignores the abort and an old reply arrives last, it goes into its own cache entry and is never shown.
- The test `searchRace.test.tsx` makes `duck` slow and `mug` fast, types both, and checks that `mug` results stay on screen after the `duck` reply lands.

## Client state: Redux Toolkit for cart and session

- **Considered:** React Context + `useReducer`, Zustand, RTK Query for everything.
- **Why:** the cart and session are client state shared across the header, cart, checkout and login. Redux Toolkit gives one store, actions as the only way to change state, and dev checks that catch accidental mutation. Derived values (cart count, total) are memoized selectors, never stored, so they can't drift from the lines. Server data stays in TanStack Query. Mixing the two would mean two caches for the same products.
- **Persistence:** a listener middleware saves the cart to `localStorage` only when `state.cart` changes, and the store reloads it through a Zod schema, so a corrupt or outdated value becomes an empty cart instead of a crash. The token is never persisted (see `docs/auth.md`).

## Checkout idempotency: one key per cart, reused on retry

- **Considered:** disabling the button only, generating a new key per click.
- **Why:** disabling the button stops double clicks but not a retry after a lost response, which is when duplicate orders actually happen. A new key per click would defeat the server's check. The key is created once (`checkoutStarted` keeps an existing one), persisted with the cart so it survives a reload mid-checkout, sent as `Idempotency-Key`, and cleared whenever the cart changes, because a different cart is a different order. The test `checkout.test.tsx` drops the first response after the server has created the order, retries, and expects exactly one order.

## Backend errors: one policy, applied in one place each

| Status        | Where it is handled                                          | What the user sees                                                                  |
| ------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| 400           | `fieldErrorsFrom` → `form.setFields`                         | The message under the field it belongs to                                           |
| 401           | `onUnauthorized` listener in `store.ts` → `sessionExpired()` | Redirect to login with "Your session has ended", then back to the page they were on |
| 404           | `StatusView` → `NotFoundPage`                                | A Not Found page with a way back                                                    |
| 409           | Checkout `onError`                                           | "Not enough stock for <item>", and the cart is shrunk to the real stock             |
| 500 / network | `StatusView` / checkout alert                                | Friendly copy and a "Try again" button                                              |

- **Considered:** handling errors ad hoc in each component, or showing `error.message`.
- **Why:** the client turns every failure into an `ApiClientError` with a `kind`, so components switch on a small closed set instead of status codes. All user-facing text comes from `errorCopy`, and the client's own `message` is generic by design, so a raw server message has no path to the screen. Retry is offered only where it can help (5xx, network, unexpected response), never for 400/401/404/409.
