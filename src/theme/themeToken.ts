import type { ThemeConfig } from 'antd'

/**
 * Design tokens for The Bug Bazaar. This is the single source for colors, radius and type.
 * Keep src/styles/_variables.scss aligned with these values (see UI.md).
 * Try new values in the antd theme editor: https://ant.design/theme-editor
 *
 * Theme: "Ink & Crimson". Rice-paper backgrounds, ink text, a crimson accent and muted
 * gold, with sharper corners. Every text color below is 4.5:1 or better on its background
 * (WCAG AA, D4-1); the numbers are in docs/decisions.md.
 */

/** Global (seed and map) tokens. */
export const globalToken: NonNullable<ThemeConfig['token']> = {
  colorPrimary: '#9e1b1b',
  // Darker on hover (antd's default is lighter), so white text keeps its contrast.
  colorPrimaryHover: '#7f1414',
  colorPrimaryBg: '#f6e6df',
  // Status colors are dark enough for 4.5:1 text contrast, including white text on solid
  // tags. antd uses these for Tag, Alert and Result text, not just icons.
  colorSuccess: '#2f5d2a',
  colorWarning: '#8a5a00',
  colorError: '#b42318',
  colorInfo: '#2f4b7c',
  colorBgLayout: '#f6f1e7',
  colorBgContainer: '#fffcf6',
  colorTextBase: '#1c1a17',
  // antd derives secondary text from colorTextBase at ~45% opacity, which fails contrast.
  // Explicit values keep every grey text at 4.5:1 or better (WCAG AA).
  colorTextSecondary: '#5a5247',
  colorTextTertiary: '#5a5247',
  colorTextDescription: '#5a5247',
  colorTextPlaceholder: '#6b6357',
  colorBorder: '#d6cbb6',
  colorBorderSecondary: '#e4dccb',
  borderRadius: 4,
  fontFamily:
    "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSize: 15,
}

/** Component tokens. Change a component here before reaching for CSS. */
export const componentTokens: NonNullable<ThemeConfig['components']> = {
  Layout: {
    // An ink header bar over the paper page.
    headerBg: '#1c1a17',
    headerColor: '#f6f1e7',
    headerPadding: '0 16px',
    headerHeight: 64,
    bodyBg: '#f6f1e7',
    footerBg: '#f6f1e7',
  },
  Card: {
    borderRadiusLG: 6,
  },
}
