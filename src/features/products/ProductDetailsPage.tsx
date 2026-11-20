import { Breadcrumb, Button, Col, Descriptions, Flex, Row, Skeleton, Typography } from 'antd'
import { Link, useNavigate, useParams } from 'react-router'
import { BackToTop } from '@/components/BackToTop'
import { StatusView } from '@/components/StatusView'
import { useWindowEvent } from '@/hooks/useWindowEvent'
import { formatCents } from '@/lib/money'
import { toRequestState } from '@/lib/toRequestState'
import { useProduct } from './productQueries'
import { StockTag } from './StockTag'
import './product-details-page.scss'

/** Neighbouring ids for Previous and Next: p-0002 → p-0001 / p-0003. */
function neighbourIds(id: string): { previous: string | null; next: string | null } {
  const digits = /^p-(\d+)$/.exec(id)?.[1]
  if (!digits) return { previous: null, next: null }
  const number = Number(digits)
  const toId = (value: number) => `p-${String(value).padStart(digits.length, '0')}`
  return { previous: number > 1 ? toId(number - 1) : null, next: toId(number + 1) }
}

function isTypingTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

/**
 * Product details. Switching products is safe (D2-4): each id has its own query key, so the
 * page only ever shows data stored under the current id, and when the id changes TanStack
 * Query aborts the old request through the AbortSignal passed to the API client.
 */
export function ProductDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const product = useProduct(id)
  const { previous, next } = neighbourIds(id)

  // Arrow keys move between products. The listener is removed when the page closes.
  useWindowEvent('keydown', (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return
    if (event.key === 'ArrowLeft' && previous) void navigate(`/products/${previous}`)
    if (event.key === 'ArrowRight' && next) void navigate(`/products/${next}`)
  })

  return (
    <Flex vertical gap="large" className="product-details-page">
      <Breadcrumb items={[{ title: <Link to="/">Products</Link> }, { title: id }]} />
      <BackToTop />

      <StatusView
        state={toRequestState(product)}
        onRetry={() => void product.refetch()}
        notFoundTitle="Product not found"
        skeleton={<Skeleton active avatar paragraph={{ rows: 6 }} />}
      >
        {(data) => (
          <Row gutter={[32, 24]}>
            <Col xs={24} sm={24} md={12} lg={10} xl={10} xxl={8}>
              <img
                className="product-details-page__image"
                src={data.imageUrl}
                alt={data.name}
                width={400}
                height={300}
              />
            </Col>
            <Col xs={24} sm={24} md={12} lg={14} xl={14} xxl={16}>
              <Typography.Title level={1}>{data.name}</Typography.Title>
              <Typography.Title level={2} className="product-details-page__price">
                {formatCents(data.price)}
              </Typography.Title>
              <StockTag stock={data.stock} />
              <Descriptions
                className="product-details-page__facts"
                column={1}
                items={[
                  { key: 'category', label: 'Category', children: data.category },
                  { key: 'rating', label: 'Rating', children: `${String(data.rating)} / 5` },
                  { key: 'id', label: 'Product ID', children: data.id },
                ]}
              />
            </Col>
          </Row>
        )}
      </StatusView>

      <Flex gap="middle" justify="space-between">
        <Button
          disabled={!previous}
          onClick={() => {
            if (previous) void navigate(`/products/${previous}`)
          }}
        >
          Previous product
        </Button>
        <Button
          disabled={!next}
          onClick={() => {
            if (next) void navigate(`/products/${next}`)
          }}
        >
          Next product
        </Button>
      </Flex>
    </Flex>
  )
}
