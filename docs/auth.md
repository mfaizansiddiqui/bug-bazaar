# Auth

## Flow

1. The user submits `/login` → `POST /api/login` returns `{ token, user }`.
2. The token goes to `setAuthToken(token)` in `src/api/client.ts`. The user goes to Redux (`session.user`).
3. Every request from the client adds `Authorization: Bearer <token>`.
4. `/account`, `/checkout` and `/orders/:id` sit behind `RequireAuth`. A signed-out visitor is redirected to `/login`, and the page they wanted travels in router state. After login, they are sent back there (`returnTo.ts`). Only same-app paths starting with `/` are accepted, so the redirect can't be pointed at another site.
5. Sign out clears the token, the session and per-user cached data (`me`, `orders`).

## Where the token is stored: in memory only

The token lives in a module variable inside `src/api/client.ts`. It is **not** in `localStorage`, `sessionStorage`, Redux or a cookie.

| Option              | XSS can read the token?                                           | Survives a reload? | Notes                                                                                                                         |
| ------------------- | ----------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Memory (chosen)** | Only while the page is open, by calling the app's own code        | No                 | Simplest safe option without a backend we control                                                                             |
| `localStorage`      | Yes, any injected script can read it at any time and send it away | Yes                | Most common, most exposed                                                                                                     |
| `sessionStorage`    | Yes, same as above, per tab                                       | Per tab            | Same XSS problem                                                                                                              |
| httpOnly cookie     | No, JavaScript can't read it at all                               | Yes                | Best choice, but needs the server to set the cookie and CSRF protection (`SameSite`, CSRF token). The mock API can't do that. |

**The trade-off:** a reload or a new tab signs the user out. The cart survives (it isn't a credential, so it is persisted), and `RequireAuth` sends the user back to checkout after signing in again, so nothing is lost but one login. With a real backend I would move to an httpOnly `SameSite=Lax` session cookie plus a short-lived access token in memory, refreshed silently from that cookie.

Keeping the token out of Redux also keeps it out of Redux DevTools, error logs and any persisted state.

## What a 401 does

Any 401 from any request reaches one listener (`onUnauthorized`, registered in `src/app/store.ts`). It clears the token and dispatches `signedOut()`. `RequireAuth` then redirects to `/login`, remembering the current page. This also covers an expired session: the next request that fails signs the user out cleanly.

## Double submit

The login button shows `loading` and the whole form is `disabled` while the request is pending. `onFinish` also returns early if a request is already in flight, which covers a repeated Enter key. The test `auth.test.tsx` clicks twice and presses Enter, and expects exactly one request.
