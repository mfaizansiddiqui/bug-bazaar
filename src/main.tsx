import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntApp, ConfigProvider } from 'antd'
import { App } from '@/app/App'
import { themeConfig } from '@/theme/themeConfig'
import '@/styles/main.scss'

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element #root not found in index.html')

createRoot(rootElement).render(
  <StrictMode>
    <ConfigProvider theme={themeConfig}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
