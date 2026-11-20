# UI standard for The Bug Bazaar

These rules are **mandatory** for every `.tsx` and `.scss` file in this repo. Read this file before creating or editing UI. Where a rule can be checked automatically, ESLint enforces it.

## 1. Ant Design for all UI and layout

- Build UI and layout only from Ant Design components (`Layout`, `Flex`, `Space`, `Row`/`Col`, `Card`, `Typography`, `Button`, `Input`, `Form`, `Result`, `Skeleton`, `Empty`, …).
- In component TSX, don't use raw `div`, `span`, `button` or `input` (enforced by ESLint).
- No inline `style` props (enforced by ESLint). Use component props, theme tokens, or the component's SCSS file.
  - **The one exception:** `src/features/products/ProductGrid.tsx`, the virtualized grid. It sets row `transform` and list `height` values computed while scrolling, which can't live in SCSS. ESLint allows `style` in that file only (`eslint.config.js`). Any new exception needs the same: a reason, a UI.md entry and a per-file ESLint override.
- Use an existing Ant Design component before writing a custom one. If you need a custom one, compose it from Ant Design components.
- The `index.html` document shell (`html`, `body`, `#root`) stays as plain HTML, because React needs a node to mount into.
- Use `App.useApp()` for `message`, `notification` and `modal`, so they inherit the theme.

## 2. SCSS with BEM

- Class names follow BEM: `.block`, `.block__element`, `.block--modifier`. One block per component, named after it.
- Nest at most one level below the block (`&__element`, `&--modifier`). No deeper selector chains.
- No duplicate properties, and no `!important`.
- No hardcoded colors (`#fff`, `#000`, `#1677ff`, `rgb(...)`) in component SCSS. Colors come from `src/styles/_variables.scss` via `@use '@/styles/variables' as *;`.
- Don't override Ant Design internals (`.ant-*`) when a token can do the same job. See section 5.

## 3. One SCSS file per component

- Each component has at most one SCSS file, next to it and named after it in kebab-case:
  - `Product.tsx` → `product.scss`
  - `UserProfile.tsx` → `user-profile.scss`
- No `style.scss`, `styles.scss` or shared grab-bag files. Global document rules live only in `src/styles/main.scss`.

## 4. Responsive layout with Row and Col

- Page and section layout uses Ant Design `Row` and `Col` only.
- Every `Row` sets a `gutter` (e.g. `gutter={[24, 24]}`), and its children are real `Col`s.
- Every `Col` sets all six breakpoints: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`.
- No custom breakpoints. Use the antd breakpoints mirrored in `_variables.scss`.
- If a grid prop or token can't do the job, put the media query on the property inside that component's selector, not in a separate block.

## 5. Theme through ConfigProvider and tokens

- Theme changes go through the Ant Design `ConfigProvider` and design tokens ([customize theme](https://ant.design/docs/react/customize-theme), [theme editor](https://ant.design/theme-editor)).
- `src/theme/themeToken.ts` holds global tokens (`globalToken`) and component tokens (`componentTokens`).
- `src/theme/themeConfig.ts` assembles them, and `main.tsx` passes them to the root `ConfigProvider`.
- Extra CSS is only for cases a token can't cover.
- Keep `src/styles/_variables.scss` aligned with `themeToken.ts`. When you change one, change the other in the same commit.

## 6. Accessibility in every component

- Use semantic Ant Design components: `Button` for actions, `Link`/`Typography.Link` for navigation, and `Form.Item` with a `label` for every input.
- Every image has meaningful `alt` text, or `alt=""` if it's decorative.
- Keyboard: everything clickable is reachable with Tab and works with Enter or Space, with a visible focus.
- Keep heading levels in order. Form errors are announced (antd `Form.Item` help plus a `role="alert"` summary where needed).

## 7. Before you finish a UI change

- [ ] No raw `div`/`span`/`button`/`input`, and no inline `style`.
- [ ] SCSS is BEM, one level of nesting, colors from variables, file named after the component.
- [ ] Every `Row` has a gutter, and every `Col` sets `xs` through `xxl`.
- [ ] Theme changes are made in `themeToken.ts`, with `_variables.scss` updated to match.
- [ ] Keyboard and screen-reader checks done.
- [ ] `npm run check` passes.
