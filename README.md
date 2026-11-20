# The Bug Bazaar

A small store for developer gear (rubber ducks, mechanical keyboards, coffee and stickers), built in one week with React, TypeScript and a mocked API.

## Quick start (under 5 minutes)

Prerequisites: **Node.js 22+** and **npm 10+**.

```bash
git clone https://github.com/mfaizansiddiqui/bug-bazaar.git
cd bug-bazaar
cp .env.example .env      # optional: the defaults work without it
npm install
npm run dev               # http://localhost:5173
```

No real backend is needed. The API is mocked with [MSW](https://mswjs.io).

- **Demo login:** `dev@bugbazaar.test` / `password123`
- **Mock controls:** the **Mock** button (bottom-left) forces any API error or slow, out-of-order responses. See [docs/api-contract.md](docs/api-contract.md).
- Signing in is kept in memory only, so a page reload signs you out. Your cart is kept. See [docs/auth.md](docs/auth.md).

## Scripts

| Script                 | What it does                                                           |
| ---------------------- | ---------------------------------------------------------------------- |
| `npm run dev`          | Start the Vite dev server with hot reload                              |
| `npm run build`        | Typecheck, then build for production into `dist/`                      |
| `npm run preview`      | Serve the production build locally                                     |
| `npm run lint`         | ESLint with type-checked rules                                         |
| `npm run typecheck`    | TypeScript in strict mode (`tsc -b`)                                   |
| `npm run format`       | Format every file with Prettier                                        |
| `npm run format:check` | Check formatting without writing (used by CI)                          |
| `npm test`             | Run the Vitest suite once                                              |
| `npm run test:watch`   | Run Vitest in watch mode                                               |
| `npm run check`        | Lint, typecheck, format check and tests. Run this before every commit. |

## Environment variables

Copy `.env.example` to `.env`. Every variable starting with `VITE_` is bundled into the browser, so **never put secrets in them**.

| Variable            | Default | Purpose                                              |
| ------------------- | ------- | ---------------------------------------------------- |
| `VITE_API_BASE_URL` | `/api`  | Base URL for API requests. `/api` uses the mock API. |

## Folder structure

```
src/
  api/        contract.ts (Zod schemas and types), client.ts (the only place that calls fetch),
              requestState.ts, errorCopy.ts (friendly error text)
  app/        App shell, route table, query client
  components/ shared UI: StatusView (loading/empty/error/success), BackToTop, NotFoundPage
  dev/        Mock API controls panel (only when the mock is on)
  features/   one folder per feature, e.g. products/ (pages, grid, filters, queries)
  hooks/      reusable typed hooks: useDebouncedValue, useWindowEvent
  lib/        small helpers: formatCents, toRequestState
  mocks/      MSW handlers, seeded 5,000-product database, mock controls
  styles/     _variables.scss (mirrors theme tokens), main.scss (global rules)
  theme/      themeToken.ts and themeConfig.ts for the antd ConfigProvider
  test/       Vitest setup and helpers (renderApp)
docs/         api contract, decisions, AI notes and the other written tasks
docs/ai/      per-day guides for AI assistants
CLAUDE.md     always-on rules for Claude Code
.claude/skills/ react-review skill for Claude Code
UI.md         mandatory UI standard (Ant Design, SCSS with BEM, grid, theme)
```

## Tech stack

React 19, TypeScript (strict), Vite, React Router, TanStack Query, Ant Design with SCSS, Zod, MSW, Vitest and Testing Library. Each choice and its alternatives are recorded in [docs/decisions.md](docs/decisions.md).

## Troubleshooting

- **Windows: "Vitest failed to find the runner".** The terminal path has a lowercase drive letter (`e:\...`), so Vitest loads two copies of itself. Run the tests from a path with an uppercase drive letter, for example `cd E:\path\to\bug-bazaar`.
