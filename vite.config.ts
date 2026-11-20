import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // "/" locally. The GitHub Pages deploy sets VITE_BASE=/bug-bazaar/ (see deploy.yml).
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  resolve: {
    // Keep in sync with "paths" in tsconfig.app.json
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    restoreMocks: true,
    // Rendering a full page of 50 antd cards in jsdom takes a few seconds under parallel load.
    testTimeout: 30_000,
    // Fewer, less-contended workers: each app-level test file renders full antd pages.
    maxWorkers: '50%',
  },
})
