import { useState } from 'react'
import { ShoppingCartOutlined } from '@ant-design/icons'
import { App, Button, Flex, InputNumber, Typography } from 'antd'
import type { Product } from '@/api/contract'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { addToCart, selectQuantityInCart } from './cartSlice'

interface AddToCartProps {
  product: Product
}

/** Quantity picker + Add to cart. You can never pick more than the stock left after your cart. */
export function AddToCart({ product }: AddToCartProps) {
  const dispatch = useAppDispatch()
  const { message } = App.useApp()
  const inCart = useAppSelector((state) => selectQuantityInCart(state, product.id))
  const available = Math.max(0, product.stock - inCart)
  const [quantity, setQuantity] = useState(1)

  if (product.stock === 0) {
    return <Typography.Text type="secondary">Out of stock. Check back soon.</Typography.Text>
  }
  if (available === 0) {
    return (
      <Typography.Text type="secondary">
        All {product.stock} in stock are already in your cart.
      </Typography.Text>
    )
  }

  return (
    <Flex gap="small" align="center" wrap>
      <InputNumber
        aria-label="Quantity"
        min={1}
        max={available}
        precision={0}
        value={Math.min(quantity, available)}
        onChange={(value) => {
          setQuantity(value ?? 1)
        }}
      />
      <Button
        type="primary"
        size="large"
        icon={<ShoppingCartOutlined />}
        onClick={() => {
          const amount = Math.min(quantity, available)
          dispatch(addToCart({ product, quantity: amount }))
          void message.success(`Added ${String(amount)} × ${product.name} to your cart`)
          setQuantity(1)
        }}
      >
        Add to cart
      </Button>
      {inCart > 0 && (
        <Typography.Text type="secondary">{inCart} already in your cart</Typography.Text>
      )}
    </Flex>
  )
}
