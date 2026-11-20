import { DeleteOutlined } from '@ant-design/icons'
import { Button, Col, InputNumber, Row, Typography } from 'antd'
import { Link } from 'react-router'
import { useAppDispatch } from '@/app/hooks'
import { formatCents } from '@/lib/money'
import { removeFromCart, setQuantity, type CartLine } from './cartSlice'
import './cart-line-item.scss'

interface CartLineItemProps {
  line: CartLine
  /** Read-only on the checkout summary. */
  editable?: boolean
}

export function CartLineItem({ line, editable = true }: CartLineItemProps) {
  const dispatch = useAppDispatch()

  return (
    <Row gutter={[16, 8]} align="middle" className="cart-line-item">
      <Col xs={6} sm={4} md={4} lg={3} xl={3} xxl={3}>
        <img className="cart-line-item__image" src={line.imageUrl} alt="" width={80} height={60} />
      </Col>
      <Col xs={18} sm={10} md={10} lg={11} xl={11} xxl={11}>
        <Link to={`/products/${line.productId}`} className="cart-line-item__name">
          {line.name}
        </Link>
        <Typography.Text type="secondary" className="cart-line-item__unit">
          {formatCents(line.price)} each · {line.stock} in stock
        </Typography.Text>
      </Col>
      <Col xs={12} sm={5} md={5} lg={5} xl={5} xxl={5}>
        {editable ? (
          <InputNumber
            aria-label={`Quantity of ${line.name}`}
            min={1}
            max={line.stock}
            precision={0}
            value={line.quantity}
            onChange={(value) => {
              if (value !== null)
                dispatch(setQuantity({ productId: line.productId, quantity: value }))
            }}
          />
        ) : (
          <Typography.Text>Qty {line.quantity}</Typography.Text>
        )}
      </Col>
      <Col xs={12} sm={5} md={5} lg={5} xl={5} xxl={5} className="cart-line-item__end">
        <Typography.Text strong>{formatCents(line.price * line.quantity)}</Typography.Text>
        {editable && (
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            aria-label={`Remove ${line.name} from cart`}
            onClick={() => {
              dispatch(removeFromCart(line.productId))
            }}
          />
        )}
      </Col>
    </Row>
  )
}
