# The Bug Bazaar: rules for AI assistants

Claude Code loads this file in every conversation. Keep it short. Feature detail lives in `docs/ai/`, and UI rules live in `UI.md`.

## This is a scored training project

- The engineer must be able to explain every change: what it does, why it is built that way, and what breaks if it changes. AI output the engineer can't explain gets half points at most. Keep changes small, explain the reasoning, and don't add code nobody asked for.
- Make one commit per task, starting with the task ID: `D2-2: persist filters in the URL`.
- Record each library or approach choice in `docs/decisions.md`: what was used, what else was considered, and why.
- Log notable AI use in `docs/ai-notes.md`: the prompt, what was kept, and what was changed and why.

## API contract

- Build only against the shared contract in `docs/api-contract.md` and `src/api/contract.ts`. Don't invent endpoints or fields.
- Prices are integer cents everywhere. Convert to currency only in the display layer.
- Validate every API payload at the boundary with the Zod schemas in `src/api/contract.ts`.

## TypeScript

- Strict mode. No `any`, no `@ts-ignore`, no `@ts-nocheck`. Use `@ts-expect-error` only with a written reason.
- Never disable lint rules, skip tests or loosen tsconfig just to get a green build. Fix the cause.
- Model request status as a discriminated union so impossible states can't be represented.

## Data layer

- `src/api/client.ts` is the only file that calls `fetch`. Never use `axios`.
- Components call hooks, or a client function from an event handler such as a submit. They never import `fetch`.
- Server state (products, stock, orders) goes in the query cache. Client state (cart, session) goes in Redux Toolkit. Filters go in the URL.

## Security

- No secrets in source, and nothing secret in `VITE_` variables. Those are bundled into the browser.
- Keep the auth token in memory only (`setAuthToken` in the client). Never put it in `localStorage` or `sessionStorage`. Persisting the cart is fine because it isn't a credential.
- Render product and user text as text. `dangerouslySetInnerHTML` is not allowed.
- Checkout sends an `Idempotency-Key` that is reused on retries, so a retry can't create a second order.
- Never log tokens or raw API error bodies. Never show raw server messages on screen. Map `ApiClientError.kind` to friendly copy.

## UI

- Before creating or editing any UI (`.tsx` or `.scss`), read `UI.md` and follow it. Its rules are mandatory.
- For a review, use the `react-review` skill.

## Feature guides

Read the guide for the day you are working on:

- @docs/ai/foundation.md: Day 1, setup, contract, types, data layer
- @docs/ai/browse.md: Day 2, grid, filters, UI states, effects, hooks, race conditions
- @docs/ai/buy.md: Day 3, Redux Toolkit, cart, auth, backend errors, caching
- @docs/ai/harden.md: Day 4, accessibility, performance, live stock, tests, CI, monitoring
- @docs/ai/explain.md: Day 5, docs deliverables and the walkthrough

## Before you finish

Run `npm run check` (lint, typecheck, format check, tests). It must pass.
