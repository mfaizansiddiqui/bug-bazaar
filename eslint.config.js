import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'public/mockServiceWorker.js']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-nocheck': true, 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // Components never call the network directly: all HTTP goes through src/api/client.ts
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use the typed client in src/api/client.ts instead of fetch.' },
      ],
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'axios', message: 'Use the typed client in src/api/client.ts.' }] },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Render text as text. dangerouslySetInnerHTML is not allowed.',
        },
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            'No inline styles. Use antd props, theme tokens, or the component SCSS file (see UI.md).',
        },
        {
          selector: 'JSXOpeningElement[name.name=/^(div|span|button|input)$/]',
          message:
            'Use an Ant Design component instead of a raw div/span/button/input (see UI.md).',
        },
      ],
    },
  },
  {
    // The one place allowed to touch the network, plus test/mock code
    files: ['src/api/client.ts', 'src/mocks/**', 'src/test/**', '**/*.test.{ts,tsx}'],
    rules: { 'no-restricted-globals': 'off' },
  },
])
