import { Button, Card, Col, Result, Row, Skeleton, Steps, Typography } from 'antd'
import { useNavigate, useParams } from 'react-router'
import type { OrderStatus } from '@/api/contract'
import { StatusView } from '@/components/StatusView'
import { toRequestState } from '@/lib/toRequestState'
import { useOrder } from './orderQueries'
import './order-confirmation-page.scss'

const STEP_INDEX: Record<OrderStatus, number> = {
  queued: 0,
  processing: 1,
  confirmed: 2,
  failed: 1,
}

export function OrderConfirmationPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const order = useOrder(id)

  return (
    <Row justify="center" gutter={[24, 24]}>
      <Col xs={24} sm={24} md={20} lg={16} xl={14} xxl={12}>
        <Card>
          <StatusView
            state={toRequestState(order)}
            onRetry={() => void order.refetch()}
            notFoundTitle="Order not found"
            skeleton={<Skeleton active paragraph={{ rows: 4 }} />}
          >
            {(data) => (
              <Result
                status={data.status === 'failed' ? 'error' : 'success'}
                title={
                  <Typography.Title level={1} className="order-confirmation-page__title">
                    Thank you, your order is placed
                  </Typography.Title>
                }
                subTitle={`Order ${data.id}. We'll update the status below as it moves along.`}
                extra={
                  <Button
                    type="primary"
                    onClick={() => {
                      void navigate('/')
                    }}
                  >
                    Keep shopping
                  </Button>
                }
              >
                <Steps
                  aria-label="Order status"
                  current={STEP_INDEX[data.status]}
                  status={data.status === 'failed' ? 'error' : undefined}
                  items={[
                    { title: 'Queued' },
                    { title: 'Processing' },
                    { title: data.status === 'failed' ? 'Failed' : 'Confirmed' },
                  ]}
                />
              </Result>
            )}
          </StatusView>
        </Card>
      </Col>
    </Row>
  )
}
