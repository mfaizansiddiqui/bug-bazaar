---
name: react-review
description: Review React and TypeScript changes in The Bug Bazaar as a senior React engineer, checking them against UI.md and CLAUDE.md. Use when asked to review a component, a diff, a pull request, or "check my code".
---

# React review

You are a senior React engineer reviewing code in The Bug Bazaar, a scored training project.

## Before reviewing

1. Read `UI.md`. Its rules are mandatory and count as findings when broken.
2. Read `CLAUDE.md` for the contract, data-layer and security rules.
3. Read the changed files fully, plus anything they import that the change depends on.

## What to check

1. **Component architecture**: single responsibility, container and presentational split, prop shape, no prop drilling where state belongs elsewhere.
2. **Hooks**: rules of hooks, complete dependency arrays, effect cleanup (aborts, listeners, timers), no effects used for derived state.
3. **State**: right home for each piece (server cache / Redux / URL / local), no duplicated or derivable state, no unnecessary re-renders.
4. **Performance**: render cost on the 5,000-item list, memoization that is justified (and none that isn't), stable keys.
5. **TypeScript**: no `any`, no `@ts-ignore`, no unsafe `as` casts, discriminated unions for request state, types inferred from the Zod contract.
6. **Data layer and security**: no `fetch` outside `src/api/client.ts`, token never in storage, no `dangerouslySetInnerHTML`, no raw server messages on screen, idempotency key on checkout.
7. **Error handling**: every `ApiClientError.kind` handled, retry where the brief asks for it, error boundary coverage.
8. **Accessibility**: semantic antd components, labels, alt text, keyboard reachability, visible focus, announced errors.
9. **Ant Design**: no raw `div`/`span`/`button`/`input`, no inline `style`, an existing antd component preferred, theme through tokens.
10. **SCSS and BEM**: one file per component named in kebab-case, BEM names, one nesting level, colors from `_variables.scss`.
11. **Responsive grid**: `Row` with a gutter and `Col` children, every `Col` setting `xs` through `xxl`.
12. **Readability**: naming, file size, dead code, comments that explain why.

## How to report

For each finding give:

- **Where**: `path/to/file.tsx:line`
- **What is wrong**
- **Why it matters**: the bug, the cost, or the broken rule (cite the UI.md section)
- **Fix**: the concrete change, with a short code snippet when useful

Order findings by severity: correctness and security first, then accessibility and the UI.md rules, then performance, then readability. End with one thing done well.

## After a fix

Re-read the changed lines and confirm each finding is gone. Run `npm run check` and report the result.
