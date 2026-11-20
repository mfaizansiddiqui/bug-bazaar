import { Layout, Typography } from 'antd'
import { Outlet, ScrollRestoration } from 'react-router'
import { MockControls } from '@/dev/MockControls'
import { useLiveStock } from '@/features/stock/useLiveStock'
import { AppHeader } from './AppHeader'
import './app.scss'

const { Header, Content, Footer } = Layout

interface AppProps {
  /** Shows the dev panel for the mock API. Off when a real backend is used. */
  showMockControls?: boolean
  /** Opens the live stock WebSocket. Off in tests, which drive the feed directly. */
  liveStock?: boolean
}

/** App shell: header, the current route's page, footer. */
export function App({ showMockControls = false, liveStock = false }: AppProps) {
  const liveStatus = useLiveStock(liveStock)

  return (
    <Layout className="app">
      <Header className="app__header">
        <AppHeader liveStatus={liveStock ? liveStatus : null} />
      </Header>
      <Content className="app__content" id="main">
        <Outlet />
      </Content>
      <Footer className="app__footer">
        <Typography.Text type="secondary">
          The Bug Bazaar · gear for people who ship bugs and fix them
        </Typography.Text>
      </Footer>
      {showMockControls && <MockControls />}
      <ScrollRestoration />
    </Layout>
  )
}
