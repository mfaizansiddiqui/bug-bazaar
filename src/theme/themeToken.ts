import type { ThemeConfig } from 'antd'

/**
 * Design tokens for The Bug Bazaar. This is the single source for colors, radius and type.
 * Keep src/styles/_variables.scss aligned with these values (see UI.md).
 * Try new values in the antd theme editor: https://ant.design/theme-editor
 */

/** Global (seed and map) tokens. */
export const globalToken: NonNullable<ThemeConfig['token']> = {
  colorPrimary: '#5b3df5',
  // Status colors are dark enough for 4.5:1 text contrast on antd's light status backgrounds
  // (D4-1). antd uses these for Tag, Alert and Result text, not just icons.
  colorSuccess: '#1d6b30',
  colorWarning: '#a24f00',
  colorError: '#c92a2a',
  colorInfo: '#1c7ed6',
  colorBgLayout: '#f7f7fb',
  colorTextBase: '#1f1d2b',
  // antd derives secondary text from colorTextBase at ~45% opacity (#96959d, only 2.8:1).
  // Explicit values keep every grey text at 4.5:1 or better (WCAG AA).
  colorTextSecondary: '#5f5c6e',
  colorTextTertiary: '#5f5c6e',
  colorTextDescription: '#5f5c6e',
  colorTextPlaceholder: '#6b6880',
  colorBorderSecondary: '#ebe9f3',
  borderRadius: 8,
  fontFamily:
    "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSize: 15,
}

/** Component tokens. Change a component here before reaching for CSS. */
export const componentTokens: NonNullable<ThemeConfig['components']> = {
  Layout: {
    headerBg: '#ffffff',
    headerColor: '#1f1d2b',
    headerPadding: '0 16px',
    headerHeight: 64,
    bodyBg: '#f7f7fb',
    footerBg: '#f7f7fb',
  },
  Card: {
    borderRadiusLG: 12,
  },
}
