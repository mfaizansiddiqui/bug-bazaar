# Performance

## How it was measured

- **Page load:** Lighthouse 13, desktop preset, headless Chrome, against the production build (`npm run build && npx vite preview`), with the mock API on, as users of the demo get it. Each "after" number was taken twice and was stable within a few ms.
- **Render cost:** React's `<Profiler>` (`actualDuration`) in `src/features/products/ProductGrid.perf.test.tsx`, React dev build in jsdom. That's slower in absolute terms than a production browser, but fine for comparing before and after the same change. Card renders are counted by spying on `formatCents`, which each card calls exactly once per render. Run it with `npx vitest run ProductGrid.perf --silent=false`.

## Baseline: where the product list spends its time

Lighthouse main-thread breakdown for `/` (before any fix): **0.7 s** of main-thread work, mostly script evaluation. The two biggest costs:

1. **Every live stock tick re-renders every card.** The feed pushes a change every 2 s, and each one rebuilt the list and re-rendered all 50 cards on the page: **50 card renders, 100–139 ms per update** (3 runs).
2. **The initial grid render is the largest long task:** **210 ms** in the React/antd chunk, spent mounting 50 cards when only about 8–12 fit on screen.

## Fix 1: memoize `ProductCard` (D4-2)

`ProductCard` is wrapped in `React.memo`. It only works because of how updates are built: `applyStockUpdate` maps the cached list and keeps every unchanged product as **the same object**, so memo's shallow comparison of the single `product` prop skips the other 49 cards.

| Metric (one stock update, page of 50)   | Before     | After        |
| --------------------------------------- | ---------- | ------------ |
| Cards re-rendered                       | 50         | **1**        |
| Render time (avg of 20 updates, 3 runs) | 100–139 ms | **13–15 ms** |

The remaining ~14 ms is `ProductGrid` and its 50 `Col` wrappers, which are cheap. The test now asserts "exactly 1 card re-renders", so a future change that breaks memo (e.g. passing a new inline object or callback as a prop) fails CI.

## Fix 2: render only what's on screen

Mounting 50 cards when about 8–12 fit in the viewport is the largest long task. The fix is windowing, which the 5,000-item list (D4-3) needs anyway, so it is measured in that section below.

## Also tried: route-level code splitting (kept, small win)

Every page except the product list became a React Router `lazy` route.

| `/` (home)                      | Before  | After   |
| ------------------------------- | ------- | ------- |
| JS transferred                  | 557 KiB | 535 KiB |
| `/login` total blocking time    | 220 ms  | 20 ms   |
| `/login` Lighthouse performance | 93      | 100     |

The home page gained little: its JavaScript is mostly the shared React/antd vendor code plus the in-browser mock API (`msw` + the 5,000-product seed, about 140 KiB gzipped), which a real deployment wouldn't ship. Other pages now download their own code (1–47 KiB each) only on first visit. I kept it because it costs nothing and helps every page except the first.

## Skipped: `useMemo` around `formatCents` and `useCallback` on card handlers

`formatCents` is one `Intl.NumberFormat.format` call on a formatter created once at module load. It takes microseconds, so memoizing it would add a dependency check that costs about as much as the work it saves. Cards have no callback props (the whole card is a `<Link>`), so `useCallback` would protect nothing. The profiler showed no time in either, so neither was added.
