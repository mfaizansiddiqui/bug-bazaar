import type { ThemeConfig } from 'antd'
import { componentTokens, globalToken } from './themeToken'

/** Passed to the root ConfigProvider in main.tsx. */
export const themeConfig: ThemeConfig = {
  cssVar: {},
  hashed: false,
  token: globalToken,
  components: componentTokens,
}
