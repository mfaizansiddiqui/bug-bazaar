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
  api/        contract.ts (Zod schemas and types), client.ts (the only place that calls fetch)
  app/        App shell (routes and store arrive in Day 2 and 3)
  mocks/      MSW handlers, fixtures and the test server
  styles/     _variables.scss (mirrors theme tokens), main.scss (global rules)
  theme/      themeToken.ts and themeConfig.ts for the antd ConfigProvider
  test/       Vitest setup
docs/         api contract, decisions, AI notes and the other written tasks
docs/ai/      per-day guides for AI assistants
CLAUDE.md     always-on rules for Claude Code
.claude/skills/ react-review skill for Claude Code
UI.md         mandatory UI standard (Ant Design, SCSS with BEM, grid, theme)
```

## Tech stack

React 19, TypeScript (strict), Vite, Ant Design with SCSS, Zod, MSW, Vitest and Testing Library. Each choice and its alternatives are recorded in [docs/decisions.md](docs/decisions.md).

## Troubleshooting

- **Windows: "Vitest failed to find the runner".** The terminal path has a lowercase drive letter (`e:\...`), so Vitest loads two copies of itself. Run the tests from a path with an uppercase drive letter, for example `cd E:\path\to\bug-bazaar`.
