import { Col, Layout, Row, Typography } from 'antd'
import './app.scss'

const { Header, Content, Footer } = Layout

/** App shell. Routes and feature screens plug into Content from Day 2. */
export function App() {
  return (
    <Layout className="app">
      <Header className="app__header">
        <Typography.Title level={1} className="app__brand">
          The Bug Bazaar
        </Typography.Title>
      </Header>
      <Content className="app__content">
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={24} md={24} lg={16} xl={16} xxl={16}>
            <Typography.Title level={2}>
              Gear for people who ship bugs and fix them
            </Typography.Title>
            <Typography.Paragraph>
              Rubber ducks, mechanical keyboards, coffee and stickers. The store opens on Day 2.
            </Typography.Paragraph>
          </Col>
        </Row>
      </Content>
      <Footer className="app__footer">
        <Typography.Text type="secondary">The Bug Bazaar training project</Typography.Text>
      </Footer>
    </Layout>
  )
}
