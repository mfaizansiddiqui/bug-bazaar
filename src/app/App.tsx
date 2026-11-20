import { Layout, Typography } from 'antd'
import { Link, Outlet, ScrollRestoration } from 'react-router'
import { MockControls } from '@/dev/MockControls'
import './app.scss'

const { Header, Content, Footer } = Layout

interface AppProps {
  /** Shows the dev panel for the mock API. Off when a real backend is used. */
  showMockControls?: boolean
}

/** App shell: header, the current route's page, footer. */
export function App({ showMockControls = false }: AppProps) {
  return (
    <Layout className="app">
      <Header className="app__header">
        <Link to="/" className="app__brand">
          The Bug Bazaar
        </Link>
      </Header>
      <Content className="app__content">
        <Outlet />
      </Content>
      <Footer className="app__footer">
        <Typography.Text type="secondary">The Bug Bazaar training project</Typography.Text>
      </Footer>
      {showMockControls && <MockControls />}
      <ScrollRestoration />
    </Layout>
  )
}
