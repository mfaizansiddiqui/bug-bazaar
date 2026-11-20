import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntApp, ConfigProvider } from 'antd'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { AppProviders } from '@/app/AppProviders'
import { createQueryClient } from '@/app/queryClient'
import { createRoutes } from '@/app/routes'
import { createAppStore } from '@/app/store'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { installGlobalErrorHandlers } from '@/lib/logger'
import { themeConfig } from '@/theme/themeConfig'
import '@/styles/main.scss'

const useMockApi = import.meta.env.VITE_API_MOCK !== 'false'

async function bootstrap(): Promise<void> {
  // Start the mock before the first render, so the first request is already intercepted.
  if (useMockApi) {
    const { startMockApi } = await import('@/mocks/browser')
    await startMockApi()
  }

  const rootElement = document.getElementById('root')
  if (!rootElement) throw new Error('Root element #root not found in index.html')

  const store = createAppStore()
  const queryClient = createQueryClient()
  const router = createBrowserRouter(createRoutes({ showMockControls: useMockApi }), {
    // Routes live under the deploy base, e.g. /bug-bazaar/ on GitHub Pages.
    basename: import.meta.env.BASE_URL,
  })

  installGlobalErrorHandlers()

  createRoot(rootElement).render(
    <StrictMode>
      <ConfigProvider theme={themeConfig}>
        <AntApp>
          <ErrorBoundary>
            <AppProviders store={store} queryClient={queryClient}>
              <RouterProvider router={router} />
            </AppProviders>
          </ErrorBoundary>
        </AntApp>
      </ConfigProvider>
    </StrictMode>,
  )
}

void bootstrap()
