import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntApp, ConfigProvider } from 'antd'
import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { createQueryClient } from '@/app/queryClient'
import { createRoutes } from '@/app/routes'
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

  const queryClient = createQueryClient()
  const router = createBrowserRouter(createRoutes({ showMockControls: useMockApi }))

  createRoot(rootElement).render(
    <StrictMode>
      <ConfigProvider theme={themeConfig}>
        <AntApp>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </AntApp>
      </ConfigProvider>
    </StrictMode>,
  )
}

void bootstrap()
