import { Button, Card, Col, Empty, Flex, Row, Typography } from 'antd'
import { useNavigate } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { formatCents } from '@/lib/money'
import { CartLineItem } from './CartLineItem'
import { selectCartCount, selectCartLines, selectCartTotalCents } from './cartSlice'

export function CartPage() {
  const navigate = useNavigate()
  const lines = useAppSelector(selectCartLines)
  const count = useAppSelector(selectCartCount)
  const total = useAppSelector(selectCartTotalCents)

  if (lines.length === 0) {
    return (
      <Card>
        <Typography.Title level={1}>Your cart</Typography.Title>
        <Empty description="Your cart is empty">
          <Button
            type="primary"
            onClick={() => {
              void navigate('/')
            }}
          >
            Browse products
          </Button>
        </Empty>
      </Card>
    )
  }

  return (
    <Flex vertical gap="large">
      <Typography.Title level={1}>Your cart</Typography.Title>
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={24} md={24} lg={16} xl={16} xxl={16}>
          <Card>
            {lines.map((line) => (
              <CartLineItem key={line.productId} line={line} />
            ))}
          </Card>
        </Col>
        <Col xs={24} sm={24} md={24} lg={8} xl={8} xxl={8}>
          <Card title="Order summary">
            <Flex vertical gap="middle">
              <Flex justify="space-between">
                <Typography.Text>
                  {count} {count === 1 ? 'item' : 'items'}
                </Typography.Text>
                <Typography.Text strong>{formatCents(total)}</Typography.Text>
              </Flex>
              <Typography.Text type="secondary">
                Shipping is free. Stock is confirmed when you place the order.
              </Typography.Text>
              <Button
                type="primary"
                size="large"
                block
                onClick={() => {
                  void navigate('/checkout')
                }}
              >
                Go to checkout
              </Button>
            </Flex>
          </Card>
        </Col>
      </Row>
    </Flex>
  )
}
