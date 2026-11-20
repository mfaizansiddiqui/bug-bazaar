# Day 3: Buy (21 pts)

Outcome: the shopping flow, from adding to the cart to a placed order.

| Task                | Done when                                                                                                                                                                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D3-1 Redux Toolkit  | Cart and session live in global state. The header badge uses a derived value (selector). State only changes through defined actions.                                                                                                            |
| D3-2 Cart           | Add, remove and change quantity. Quantities can't exceed stock. The cart survives a reload. A 409 names the item that ran out. A retried checkout doesn't create a duplicate order.                                                             |
| D3-3 Auth           | Login and logout. Account and checkout are protected. The user returns to where they were after login. A 401 clears the session. The login form can't be double-submitted. `docs/auth.md` explains where the token is stored and the trade-off. |
| D3-4 Backend errors | 400 → form field errors, 401 → sign out, 404 → Not Found page, 409 → out-of-stock message, 500 → retry. Handled in one consistent way. Raw messages never reach the screen.                                                                     |
| D3-5 Caching        | Revisiting a page reuses existing data, stock refreshes after an order, and the engineer can explain when stale data is acceptable.                                                                                                             |

## Guidance

- Redux Toolkit holds the cart (items, quantities) and the session (user, signed-in flag). Products and stock stay in the query cache.
- Persist the cart (not the token) to `localStorage` through a typed storage hook or a store listener.
- Generate the checkout `Idempotency-Key` once per attempt and keep it until success, so a retry reuses it.
- The token is in memory only (`setAuthToken`). Register `onUnauthorized` once to clear the session.
- Map `ApiClientError.kind` to UI in one helper. For a 400, use `details` to set form field errors.
- After a successful order, invalidate the affected product queries so stock refreshes.

## Be ready to explain

Server state versus client state. What idempotency means. Why a memory-only token logs the user out on refresh, and what httpOnly cookies would change. `staleTime` versus `gcTime`.
