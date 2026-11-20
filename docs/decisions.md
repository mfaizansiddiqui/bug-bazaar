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

## Planned (recorded when the feature starts)

- React Router for URL-synced filters (D2-2).
- TanStack Query for the server-state cache (D3-5). Its `queryFn` calls the typed client.
- Redux Toolkit for cart and session (D3-1).
