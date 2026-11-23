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

## Theme: "Ink & Crimson"

- **What:** an original theme in the mood of Japanese ink prints. Rice-paper backgrounds (`#f6f1e7`), ink text and header (`#1c1a17`), crimson as the primary color (`#9e1b1b`), muted gold for ratings, moss green for stock, 4 px corners, and a serif display font (Shippori Mincho) for headings only. The logo is our own bug mark, styled as a seal stamp. No art, logos or names from any existing game or brand are used.
- **Considered:** keeping the purple theme; a dark (ink background) version, which would make the 5,000-card grid heavier to read; serif for all text, which reads worse at small sizes.
- **Contrast (WCAG AA, D4-1):** white on crimson is about 8:1; body grey `#5a5247` on paper about 6.9:1; placeholder `#6b6357` about 5.2:1; gold star `#8a6a1f` on white about 5:1; light crimson `#e8685a` on the ink header about 5.4:1 (plain crimson there would be about 2:1, so the header uses the lighter shade). Lighthouse accessibility stays at 100.
- **Cost:** one web font request (two weights, `display=swap`, so text shows at once in a fallback serif). Only headings use it, so body text has no font delay.
- **How:** colors and radius changed in `themeToken.ts` and `_variables.scss` together. The header-only colors and gold have no antd token, so they are SCSS-only variables.

## Auth token: in memory only

- **Considered:** `localStorage`, `sessionStorage`, httpOnly cookie.
- **Why:** a token in web storage can be read by any script that runs through XSS. Memory is safer, but the user is logged out on refresh. An httpOnly cookie would be the best choice with a real backend. Full trade-off in `docs/auth.md` (D3-3).

## Tests: Vitest and Testing Library

- **Considered:** Jest.
- **Why:** Vitest reuses the Vite config and aliases, so no separate Babel or ts-jest setup is needed. Testing Library pushes tests toward user-visible behavior.

## Contract extension: `inStock` filter and a fixed page size of 50

- **Considered:** filtering stock on the client, or fetching all 5,000 products at once.
- **Why:** the list is paged on the server, so filtering only the current page on the client would give wrong totals and short pages. A server-side `inStock=true` param keeps `total` correct. It's optional, so it doesn't break the shared contract for anyone who doesn't send it. A fixed page size of 50 keeps responses small, and Day 4 can load more pages as the user scrolls.
- **Later change (out-of-stock filter):** `inStock=false` now means "only sold-out products". The UI's in-stock checkbox became an "Availability" select (All / In stock / Out of stock), which also lines up with the other filters. Considered a second param such as `outOfStock=true`, but two booleans allow a contradictory pair (`inStock=true&outOfStock=true`). One param with three states (true, false, absent) can't. The URL uses the same `inStock` values, so old shared links still work.
- **Later change (page size in the URL):** an optional `pageSize` param, limited to 25, 50 or 100, with 50 as the default. It's in the URL (`?pageSize=25`), so a shared link loads the list the same way; the default is left out to keep links short. Considered a free number: rejected, because `pageSize=5000` would turn one request into the whole catalogue and undo the D4-3 work. Considered keeping it in `localStorage` as a personal preference: rejected, because then a copied link wouldn't reproduce the view. Each size is its own query key, so cached pages of different sizes never mix.
- **Later change (numbered pages):** the list now defaults to classic pagination: 25, 50 or 100 per page, with antd `Pagination`, and `?page=` and `?pageSize=` in the URL, so a link opens on the same page. "All (scroll)" (`?pageSize=all`) keeps the infinite, virtualized list, because D4-3 is graded on the 5,000-item list scrolling smoothly and pagination alone would avoid that problem instead of solving it. Rules:
  - Any filter change goes back to page 1, so page 7 of old results can't point past the end of new ones. A link past the end (`?page=999`) is moved to the last page with `replace`.
  - A numbered page is cached in the same `{ pages, pageParams }` shape as the infinite list, under a key that includes `page`. So live stock updates, the details-page shortcut and the refresh after an order work for both views with no extra code.
  - Considered `placeholderData: keepPreviousData` to keep the old page on screen while the next loads. Skipped, because it would also show old results briefly after a filter change, which D2-6 forbids.

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

## Caching: TanStack Query with a 60-second `staleTime`

- **Considered:** no cache (refetch on every visit), `staleTime: Infinity`, caching in Redux.
- **What happens:**
  - Every product list (per search, filter, sort and page) and every product is cached under its own key.
  - **Revisiting** a page within 60 s uses the cache with no request. After 60 s the cached data is shown at once and refreshed in the background (stale-while-revalidate).
  - **Opening a product from the grid** uses the copy already in the list cache as `initialData`, with the list's real fetch time, so there is no request and no skeleton while it is fresh.
  - Unused cache entries are dropped after 5 minutes (`gcTime` default).
  - **After an order**, `invalidateQueries(['products'])` marks every product query stale, so the next view refetches the new stock. After a 409, the product's real stock is fetched and the cart is shrunk to it.
- **When stale data is acceptable:**
  - **Browsing (yes):** a price or stock figure up to a minute old on the grid or details page is fine. It's informational, and the user isn't committing to anything yet. Showing it instantly matters more.
  - **Checkout (no):** stock is never trusted from the cache when money is involved. The server re-checks stock when the order is placed and answers 409 if it ran out, so stale client data can't oversell.
  - **Order status (no):** the confirmation page polls every second until the order is final, because the user is waiting for exactly that change.
  - **User profile:** cached per session and removed on sign-out, so the next user never sees it.
- Live stock over WebSockets (D4-4) will push updates straight into the same cache, shortening how stale stock can get while browsing.

## Monitoring: our own error boundary and logger

- **Considered:** `react-error-boundary`, Sentry's React SDK.
- **Why:** D4-7 is about understanding how crashes are caught. React Router catches render errors inside routes first, so the root route has an `errorElement`. A small class `ErrorBoundary` covers everything above the router, and `window` listeners catch errors outside React (event handlers, promises). All three report to one `logError` with a swappable transport, so moving to Sentry later only changes `setLogTransport`. Details in `docs/monitoring.md`.

## CI/CD: GitHub Actions, with GitHub Pages for deploy

- **Considered:** GitLab CI, CircleCI; Vercel or Netlify for deploy.
- **Why:** the repo is already on GitHub, so Actions needs no extra account. One `check` job runs lint → type check → formatting → tests → build, in that order so the cheapest checks fail first. Branch protection requiring `check` is what makes a failing test block the merge: the workflow alone only reports. Pages is enough for the bonus deploy because the app is static and the mock API runs in the browser. It needs two small changes: a base path (`VITE_BASE` → Vite `base` and the router `basename`) and copying `index.html` to `404.html` so deep links load the app.

## Live stock: WebSocket with reconnect and backoff

- **Considered:**
  - **Polling** (refetch every N seconds): simplest, works through any proxy, and cheap to build. But it is wasteful (most polls return nothing new), adds up to N seconds of delay, and multiplies server load by the number of open tabs.
  - **Server-Sent Events:** a one-way server → client stream over plain HTTP, with built-in reconnect (`EventSource`). A very good fit for stock, which only flows one way. I'd pick SSE for a real backend if nothing else needed a socket.
  - **WebSocket (chosen):** a full-duplex connection that stays open. The task is named after it, it lets the client send messages later (e.g. subscribe only to products on screen), and MSW can mock it in the browser.
- **How it works:**
  - `connectLiveStock` opens `ws(s)://…/api/stock` and validates each message with Zod.
  - `applyStockUpdate` writes the new stock into every cached list page, the cached product and the cart, which shrinks a quantity above the new stock. There's no refetch.
  - **Recovery:** on an unexpected close it reconnects after 0.5 s, 1 s, 2 s … up to 30 s, plus up to 250 ms of random jitter so all clients don't reconnect at once. The delay resets after a successful connection.
  - **Stopping:** `useLiveStock` runs in the app shell. Its effect cleanup calls `stop()`, which closes the socket with code 1000 and cancels any pending reconnect, so nothing runs after the app unmounts or the page closes. The header tag shows Connecting / Live stock / Reconnecting.
- **A bug avoided:** a stock update used to reset the checkout idempotency key. Now `stockChanged` only resets it when the cart's quantities actually change. Otherwise a stock push arriving between a lost order response and the retry would give the retry a new key, which could create a duplicate order.
- Tests use a fake socket with fake timers, so reconnects and backoff are tested deterministically. The live mock socket is registered only in the browser worker.

## The 5,000-item list: infinite scroll + window virtualization

- **Considered:**
  - **Keep pagination (50 per page):** always fast, but a 5,000-item list never exists, so it dodges D4-3 rather than solving it.
  - **`react-window`:** a fixed-size list or grid, which needs fixed row heights and its own scroll container.
  - **CSS `content-visibility: auto`:** skips painting off-screen cards, but React still renders and keeps 5,000 cards in the DOM.
  - **`@tanstack/react-virtual` (chosen):** headless, so cards stay antd components; window scrolling, so the page scrolls normally and the header stays sticky; measured row heights.
- **Why:** infinite scroll (`useInfiniteQuery` + an IntersectionObserver `useInView` hook + a "Load more" button for keyboard users) turns the paged API into one list that can reach all 5,000 products. Windowing keeps the DOM at about 28 cards whatever the list length. Before/after numbers are in `docs/performance.md`.
- **What changed for URLs:** the page number is no longer in the URL, since the list grows instead of paging. (Later, numbered pages came back as the default view, and this list became "All (scroll)", `?pageSize=all`; see the contract extension entry.) Filters, search and sort still are, so refresh, shared links and Back work as before.
