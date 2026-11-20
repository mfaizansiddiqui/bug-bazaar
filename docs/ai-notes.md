# AI notes

A log of notable AI use (task D5-7). Tool used throughout: Claude Code in VS Code.

## AI uses

### 2026-11-18: Planning: turn the brief into a week plan

- **Prompt:** "check this document and make a plan" (with the Bug Bazaar PDF attached)
- **What I kept:** the day-by-day breakdown of every task ID, the order of work (Days 1–3 first because they produce the working store), and the habit of one commit per task.
- **What I changed and why:** the AI suggested building on top of my Week 1 Bug Bounty repo. I wanted the store as a separate project and Week 1 left untouched, so it is built in `bug-bazaar` with a fresh history. I also picked Ant Design as the UI library instead of plain CSS, because it gives accessible form and grid components I can theme with tokens.

### 2026-11-18: Setup: shared AI guidelines and secure baseline

- **Prompt:** I gave the AI my own guidelines plan (CLAUDE.md, UI.md, a React review skill, a strict TypeScript and security baseline) and asked it to check the plan against my folders and follow it.
- **What I kept:** one `CLAUDE.md` with the always-on rules, the feature guides in `docs/ai/`, the mandatory `UI.md` standard, the typed `fetch` client with Zod validation, and ESLint rules that enforce the guidelines (no `fetch` outside the client, no `any`, no inline styles).
- **What I changed and why:** my plan assumed a `my-app` folder to rename and a repo that held Week 1 history. Neither matched my disk, so the setup was adapted to `bug-bazaar` as the repo root. The plan used symlinks for the review skill, which Git on Windows checks out as plain text files, so a pointer file was used instead. Later I removed the Cursor rule files completely, because I only use VS Code and Claude Code and they were dead weight.

### 2026-11-19: D1-2: mock API with 5,000 products and error triggers

- **Prompt:** "do it", continuing the agreed plan for D1-2 (document the contract, seed 5,000 products, make every error triggerable).
- **What I kept:** the seeded random generator (same 5,000 products on every load), the in-memory mock database, idempotent orders keyed by `Idempotency-Key`, and the Mock controls panel that forces any documented error or slow and out-of-order responses.
- **What I changed and why:** the shared contract has no in-stock filter, but D2-2 needs one. Filtering only the current page of 50 on the client would give wrong totals, so I accepted adding an optional `inStock=true` query param and recorded it as a contract extension in `docs/decisions.md` and `docs/api-contract.md`.

## AI mistakes caught

### 2026-11-19: AI used outdated library APIs

- **What went wrong:** the AI wrote code for older major versions than the ones npm installed. It used msw 2's `onUnhandledRequest` option (msw 3 renamed it to `onUnhandledFrame`) and antd 5 props (`description` on `FloatButton`, `direction` on `Space`, `message` on `Alert`), which antd 6 deprecates.
- **How I caught it:** `tsc` failed on the msw option, and the type-checked ESLint rule `@typescript-eslint/no-deprecated` flagged the antd props. Running `npm run check` before every commit caught both.
- **Fix:** updated to `onUnhandledFrame`, `content`, `orientation` and `title`. Lesson: check the installed version (`package.json`) before trusting generated code, and keep strict lint rules on.

### 2026-11-19: A shell command corrupted the docs

- **What went wrong:** the AI edited `docs/decisions.md` through a shell command, and the shell treated the backticks as commands. Code words like `inStock` vanished, leaving sentences such as "keeps correct".
- **How I caught it:** reading the file after the change, plus the error lines in the command output.
- **Fix:** rewrote the broken lines with a direct file edit.

## What I wouldn't hand to AI

- **My self-assessment and reviews.** `reflection.md` ratings, the glossary in my own words, and my partner's architecture and code reviews must reflect my own understanding. If AI wrote them, they would say nothing about what I actually know.
- **Final security trade-offs.** The AI can list options for where to store the auth token, but deciding the risk I accept (memory only, logged out on refresh) is my call, and I must be able to defend it.
