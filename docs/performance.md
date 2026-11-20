# Performance

## How it was measured

- **Page load:** Lighthouse 13, desktop preset, headless Chrome, against the production build (`npm run build && npx vite preview`), with the mock API on, as users of the demo get it. Each "after" number was taken twice and was stable within a few ms.
- **5,000-item list:** a headless-Chrome (puppeteer-core) script that loads every page and records DOM size, JS heap, long tasks and per-frame timing while scrolling (details in Fix 2).
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

## Fix 2: render only what's on screen (windowing, D4-3)

Mounting cards that aren't visible was the largest long task, and it gets far worse as the list grows. The list now loads as one growing list (infinite scroll: 50 more each time you near the end, until all 5,000 are loaded), so this is measured with **all 5,000 products loaded**.

**How:** `ProductGrid` groups products into rows (1–6 cards per row by breakpoint) and uses `useWindowVirtualizer` from `@tanstack/react-virtual`. Only the rows in the viewport plus 2 above and below are mounted. Each row is positioned with `translateY` inside a container as tall as the whole list, so the scrollbar still reflects 5,000 products. Row heights are measured after render, so cards may vary in height.

**Measured** with a headless-Chrome script against the production build (1280×900): scroll to the end until all 5,000 are loaded, then a fast but realistic scroll of 20,000 px (about 50 rows) in 5 s, recording every animation frame and every long task.

| All 5,000 products loaded       | Without windowing | With windowing (2 runs) |
| ------------------------------- | ----------------- | ----------------------- |
| DOM nodes                       | 95,190            | **729**                 |
| Cards in the DOM                | 5,000             | **28**                  |
| JS heap                         | 871–917 MB        | **19–53 MB**            |
| Time to load all 100 pages      | 55–87 s           | **7–13 s**              |
| Worst long task while loading   | 2.9–5.1 s         | **71–137 ms**           |
| Fast scroll: average fps        | 35                | **60**                  |
| Fast scroll: p95 frame time     | 50 ms             | **17 ms**               |
| Fast scroll: frames over 50 ms  | 9 of 178          | **0 of 299**            |
| Fast scroll: long tasks (worst) | 25 (437 ms)       | **0**                   |

Without windowing, every appended page made React reconcile thousands of existing items, and the browser laid out a 660,000 px page of real cards, so loading got slower with every page. With windowing, the cost per frame depends on the viewport, not on the list length.

**A measurement mistake I caught:** my first scroll test crossed the whole 600,000 px list in 4 s, about 11,000 px per frame. Then every frame mounts entirely new rows, and windowing looked _worse_ (13 fps). No user scrolls like that, so the test was changed to a realistic fast scroll for both versions.

**Trade-offs:**

- Ctrl+F browser search only finds cards that are mounted. The search box (server-side) covers this.
- Keyboard users can still Tab through every product: the 2 overscan rows mean the next card is always mounted, and focusing it scrolls it into view, which mounts the rows after it.
- Each item has `aria-setsize`/`aria-posinset`, so screen readers announce "item 3 of 5,000" even though most items aren't in the DOM.
- UI.md bans inline styles. Row positions are computed while scrolling, so `ProductGrid.tsx` is the one documented exception (see UI.md and `eslint.config.js`).

## Also tried: route-level code splitting (kept, small win)

Every page except the product list became a React Router `lazy` route.

| `/` (home)                      | Before  | After   |
| ------------------------------- | ------- | ------- |
| JS transferred                  | 557 KiB | 535 KiB |
| `/login` total blocking time    | 220 ms  | 20 ms   |
| `/login` Lighthouse performance | 93      | 100     |

The home page gained little: its JavaScript is mostly the shared React/antd vendor code plus the in-browser mock API (`msw` + the 5,000-product seed, about 140 KiB gzipped), which a real deployment wouldn't ship. Other pages now download their own code (1–47 KiB each) only on first visit. I kept it because it costs nothing and helps every page except the first.

## Removed: the JS text ellipsis on card names

Card names used antd's `Typography` `ellipsis={{ rows: 2 }}`, which measures each title in JavaScript after it renders (a ResizeObserver and layout reads per card). It was replaced with a CSS line clamp (`-webkit-line-clamp: 2`), which the browser applies during layout at no JS cost. It looks the same, and it removed a per-card measurement that also made tests slow and flaky.

## Skipped: `useMemo` around `formatCents` and `useCallback` on card handlers

`formatCents` is one `Intl.NumberFormat.format` call on a formatter created once at module load. It takes microseconds, so memoizing it would add a dependency check that costs about as much as the work it saves. Cards have no callback props (the whole card is a `<Link>`), so `useCallback` would protect nothing. The profiler showed no time in either, so neither was added.
