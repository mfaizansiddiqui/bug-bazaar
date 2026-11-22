import { Card, Col, Row, Skeleton } from 'antd'

const PLACEHOLDER_COUNT = 8

/** Loading placeholder shaped like the grid, so the layout doesn't jump when data arrives. */
export function ProductGridSkeleton() {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: PLACEHOLDER_COUNT }, (_, index) => (
        <Col key={index} xs={24} sm={12} md={8} lg={8} xl={6} xxl={6}>
          <Card cover={<Skeleton.Image active />}>
            <Skeleton active paragraph={{ rows: 2 }} />
          </Card>
        </Col>
      ))}
    </Row>
  )
}
