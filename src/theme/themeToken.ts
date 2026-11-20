import type { ThemeConfig } from 'antd'

/**
 * Design tokens for The Bug Bazaar. This is the single source for colors, radius and type.
 * Keep src/styles/_variables.scss aligned with these values (see UI.md).
 * Try new values in the antd theme editor: https://ant.design/theme-editor
 */

/** Global (seed and map) tokens. */
export const globalToken: NonNullable<ThemeConfig['token']> = {
  colorPrimary: '#5b3df5',
  colorSuccess: '#2f9e44',
  colorWarning: '#f08c00',
  colorError: '#e03131',
  colorInfo: '#1c7ed6',
  colorBgLayout: '#f6f5fb',
  colorTextBase: '#1f1d2b',
  borderRadius: 8,
  fontFamily:
    "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  fontSize: 15,
}

/** Component tokens. Change a component here before reaching for CSS. */
export const componentTokens: NonNullable<ThemeConfig['components']> = {
  Layout: {
    headerBg: '#1f1d2b',
    headerColor: '#ffffff',
    headerPadding: '0 24px',
    bodyBg: '#f6f5fb',
    footerBg: '#f6f5fb',
  },
  Card: {
    borderRadiusLG: 12,
  },
}
