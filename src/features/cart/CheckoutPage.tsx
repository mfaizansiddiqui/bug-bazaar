import { useState } from 'react'
import { Alert, Button, Card, Col, Flex, Row, Typography } from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useStore } from 'react-redux'
import { Navigate, useNavigate } from 'react-router'
import { createOrder, getProduct, isApiClientError } from '@/api/client'
import { errorCopy } from '@/api/errorCopy'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import type { AppState } from '@/app/store'
import { productKeys } from '@/features/products/productQueries'
import { formatCents } from '@/lib/money'
import { CartLineItem } from './CartLineItem'
import {
  checkoutStarted,
  clearCart,
  selectCartLines,
  selectCartTotalCents,
  stockChanged,
} from './cartSlice'

interface CheckoutProblem {
  title: string
  description: string
  canRetry: boolean
}

/**
 * Checkout (D3-2). A retry can't create a second order: the Idempotency-Key is created once
 * per cart (checkoutStarted keeps an existing key) and sent with every attempt, so the server
 * returns the original order instead of making a new one.
 */
export function CheckoutPage() {
  const dispatch = useAppDispatch()
  const store = useStore<AppState>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const lines = useAppSelector(selectCartLines)
  const total = useAppSelector(selectCartTotalCents)
  const [problem, setProblem] = useState<CheckoutProblem | null>(null)

  const placeOrder = useMutation({
    mutationFn: ({ key }: { key: string }) =>
      createOrder(
        { items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })) },
        key,
      ),
    onSuccess: async (order) => {
      // Stock changed on the server, so every cached product list and page is now stale (D3-5).
      await queryClient.invalidateQueries({ queryKey: productKeys.all })
      dispatch(clearCart())
      void navigate(`/orders/${order.id}`, { replace: true })
    },
    onError: async (error) => {
      if (isApiClientError(error) && error.kind === 'conflict') {
        const name = error.details.name ?? 'One of the items'
        setProblem({
          title: `Not enough stock for “${name}”`,
          description:
            'Someone got there first. We updated your cart to what is left. Check it and try again.',
          canRetry: false,
        })
        // Fetch the real stock and shrink (or drop) that line in the cart.
        const productId = error.details.productId
        if (productId) {
          const product = await getProduct(productId)
          queryClient.setQueryData(productKeys.detail(productId), product)
          dispatch(stockChanged({ productId, stock: product.stock }))
        }
        return
      }
      // 401 is handled globally (sign out + redirect back here after login).
      const copy = errorCopy(error)
      setProblem({ title: copy.title, description: copy.description, canRetry: copy.retryable })
    },
  })

  function submit() {
    if (placeOrder.isPending) return
    setProblem(null)
    dispatch(checkoutStarted())
    const key = store.getState().cart.checkoutKey
    if (key) placeOrder.mutate({ key })
  }

  // Nothing to check out. Stay put while an order is in flight, after success (the cart is
  // cleared just before navigating) and while a problem is shown (a 409 may empty the cart,
  // and the user must still see which item ran out).
  if (lines.length === 0 && !placeOrder.isPending && !placeOrder.isSuccess && !problem) {
    return <Navigate to="/cart" replace />
  }

  return (
    <Flex vertical gap="large">
      <Typography.Title level={1}>Checkout</Typography.Title>
      {problem && (
        <Alert
          type="error"
          showIcon
          role="alert"
          title={problem.title}
          description={problem.description}
          action={
            problem.canRetry ? (
              <Button onClick={submit} loading={placeOrder.isPending}>
                Try again
              </Button>
            ) : (
              <Button
                onClick={() => {
                  void navigate('/cart')
                }}
              >
                Review cart
              </Button>
            )
          }
        />
      )}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={24} md={24} lg={16} xl={16} xxl={16}>
          <Card title="Items">
            {lines.map((line) => (
              <CartLineItem key={line.productId} line={line} editable={false} />
            ))}
          </Card>
        </Col>
        <Col xs={24} sm={24} md={24} lg={8} xl={8} xxl={8}>
          <Card title="Payment">
            <Flex vertical gap="middle">
              <Flex justify="space-between">
                <Typography.Text>Total</Typography.Text>
                <Typography.Text strong>{formatCents(total)}</Typography.Text>
              </Flex>
              <Typography.Text type="secondary">
                Demo store: no real payment is taken.
              </Typography.Text>
              <Button
                type="primary"
                size="large"
                block
                loading={placeOrder.isPending}
                disabled={lines.length === 0}
                onClick={submit}
              >
                Place order
              </Button>
            </Flex>
          </Card>
        </Col>
      </Row>
    </Flex>
  )
}
