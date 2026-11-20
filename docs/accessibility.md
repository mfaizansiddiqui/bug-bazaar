# Accessibility

## Lighthouse accessibility score

Lighthouse 13, desktop preset, headless Chrome, production build (`npm run build && npx vite preview`).

| Page     | Before (D4-1 start) | After   |
| -------- | ------------------- | ------- |
| `/` home | 97                  | **100** |
| `/cart`  | 95                  | **100** |
| `/login` | 92                  | **100** |

Re-check: `npx lighthouse http://localhost:4173/login --preset=desktop --only-categories=accessibility --view` (with `npx vite preview` running).

## What failed, and the fix

| Problem (Lighthouse audit)                                                | Cause                                                                                                        | Fix                                                                                                                                                                               |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `color-contrast`: grey secondary text, Empty text, placeholders (2.8:1)   | antd derives grey text from the base text color at ~45% opacity                                              | Explicit `colorTextSecondary`, `colorTextTertiary`, `colorTextDescription`, `colorTextPlaceholder` tokens in `themeToken.ts`, all 4.5:1 or better. Mirrored in `_variables.scss`. |
| `color-contrast`: green/amber stock tags and the "Live stock" tag (2.5:1) | antd's `filled` tags tint the background from the status color, so the text and its background move together | Darker status colors (`colorSuccess`, `colorWarning`, `colorError`) and `variant="solid"` tags: white text on the full color, 5:1 or better                                       |
| `target-size`: show/hide password toggle (15×15 px)                       | antd's icon has no padding token                                                                             | 24×24 px minimum hit area in `login-page.scss` (WCAG 2.2)                                                                                                                         |

## Keyboard and screen reader

- **Skip link:** the first Tab stop is "Skip to main content", which moves focus to `<main>`.
- **Landmarks:** `header`/`banner`, `nav` (labelled "Main"), `main`, `footer`, and a `role="search"` filter form.
- **Product grid:** each card is one link (one Tab stop, Enter opens it) with a visible focus ring. Items have `aria-posinset`/`aria-setsize`, so "item 3 of 5,000" is announced even though the grid is virtualized. ← → move between products on the details page.
- **Live regions:** the cart count ("2 in cart"), the result count, "Showing X of Y", the live stock status tag, and loading states (`role="status"`).
- **Errors are announced:**
  - **Form errors:** antd links each field message to its input (`aria-invalid` + `aria-describedby`) but doesn't announce them on submit. So the login form shows a `role="alert"` summary ("Please fix these: Enter your email. Enter your password.") and focuses the first invalid field.
  - **Page errors:** API failures (`StatusView`), the checkout 409/500 alerts and the crash fallback use `role="alert"`.
- **Images:** product images on cards have `alt=""`, because the card's link text already names the product. The details page image uses the product name.

## Automated checks in CI

`src/app/a11y.test.tsx` runs **axe-core** (the engine behind Lighthouse's audit) on the home, cart and login pages on every test run, and fails on any violation. It also checks that form errors are announced and focused, and that the skip link works. jsdom can't compute colors or sizes, so contrast and target size are covered by the Lighthouse runs above, not by CI.
