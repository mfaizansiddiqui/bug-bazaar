# Day 2: Browse (21 pts)

Outcome: browsing from the product grid to fast, reliable search.

| Task                       | Done when                                                                                                                                                |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D2-1 Product list          | A grid plus a details page. Each card shows image, name, price and stock. Prices display correctly from cents. The grid works with a keyboard.           |
| D2-2 Filters               | Search, category, in-stock only, sort, a result count and Clear. Filters survive a refresh, a copied link reproduces the view, and Back works.           |
| D2-3 UI states             | Loading, empty, error (with retry) and success look consistent on the list and details pages, and each can be triggered on purpose.                      |
| D2-4 useEffect and cleanup | Switching products quickly never shows the wrong one. In-flight requests, listeners and timers stop when the page closes. Includes a Back to Top button. |
| D2-5 Custom hooks          | At least two typed, reusable hooks that remove duplicated logic (e.g. debounce, storage sync).                                                           |
| D2-6 Race conditions       | Slow, out-of-order responses are simulated. Typing fast never shows results for an old query.                                                            |

## Guidance

- Filters live in the URL (`URLSearchParams`). Use replace for typing and push for discrete changes, so Back is useful.
- Server data comes from query hooks that call `src/api/client.ts`. Pass the `AbortSignal` through.
- One shared component renders the four request states. Follow `UI.md` (`Skeleton`, `Empty`, `Result` with a retry button).
- Format prices with `Intl.NumberFormat` from integer cents in one helper.
- Latest query wins: the cache key includes the query, the signal aborts stale requests, and the input is debounced. Write a test for it.

## Be ready to explain

What a stale closure is. Why an effect cleanup runs before the next effect. Debounce versus abort versus ignore-stale-response, and why using only one isn't enough.
