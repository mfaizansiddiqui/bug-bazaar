# Day 1: Foundation (15 pts)

Outcome: a typed project with a mock API that every later task builds on.

| Task                        | Done when                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1-1 Setup                  | A teammate can clone and run the app in under 5 minutes using only the README. Formatting and linting are consistent. The folder structure is clear.                                              |
| D1-2 HTTP and API contracts | `docs/api-contract.md` documents every endpoint. The mock seeds 5,000 products. Every endpoint returns the documented shapes and status codes, and each listed error can be triggered on purpose. |
| D1-3 TypeScript             | Strict mode. The contract and props are typed. Request status is modelled so impossible states can't be represented. Type checking passes with no `any` and no `@ts-ignore`.                      |
| D1-4 Data                   | One place handles all requests (`src/api/client.ts`). Components never make network calls directly.                                                                                               |

## Already in place

- Strict tsconfig, type-checked ESLint, Prettier, `.env.example`.
- `src/api/contract.ts`: Zod schemas plus the inferred types.
- `src/api/client.ts`: the single `fetch` wrapper, `ApiClientError` with a `kind`, the in-memory token, the 401 hook, and the idempotency header.
- `src/mocks/`: minimal MSW handlers and the Node server for tests.

## Still to do

- D1-2: deterministic 5,000-product seed (fixed-seed PRNG), search/category/sort/page in the handler, the browser worker (`npx msw init public`), and on-purpose error triggers (for example a dev control panel or a query flag) for 400/401/404/409/500 plus slow and out-of-order responses.
- D1-3: a `RequestState<T>` discriminated union (`idle | loading | error | success`) used by the UI states in D2-3.

## Be ready to explain

Why validate at runtime when TypeScript already checks types (the server isn't compiled with your code). Why one client (it's the one place for auth, errors and base URL). What each status code means.
