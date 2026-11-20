import {
  Breadcrumb,
  Button,
  Col,
  Descriptions,
  Flex,
  Result,
  Row,
  Skeleton,
  Typography,
} from 'antd'
import { Link, useNavigate, useParams } from 'react-router'
import { formatCents } from '@/lib/money'
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

export function ProductDetailsPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const product = useProduct(id)
  const { previous, next } = neighbourIds(id)

  return (
    <Flex vertical gap="large" className="product-details-page">
      <Breadcrumb items={[{ title: <Link to="/">Products</Link> }, { title: id }]} />

      {product.isPending && <Skeleton active avatar paragraph={{ rows: 6 }} />}
      {product.isError && <Result status="error" title="Product could not be loaded" />}
      {product.isSuccess && (
        <Row gutter={[32, 24]}>
          <Col xs={24} sm={24} md={12} lg={10} xl={10} xxl={8}>
            <img
              className="product-details-page__image"
              src={product.data.imageUrl}
              alt={product.data.name}
              width={400}
              height={300}
            />
          </Col>
          <Col xs={24} sm={24} md={12} lg={14} xl={14} xxl={16}>
            <Typography.Title level={1}>{product.data.name}</Typography.Title>
            <Typography.Title level={2} className="product-details-page__price">
              {formatCents(product.data.price)}
            </Typography.Title>
            <StockTag stock={product.data.stock} />
            <Descriptions
              className="product-details-page__facts"
              column={1}
              items={[
                { key: 'category', label: 'Category', children: product.data.category },
                { key: 'rating', label: 'Rating', children: `${String(product.data.rating)} / 5` },
                { key: 'id', label: 'Product ID', children: product.data.id },
              ]}
            />
          </Col>
        </Row>
      )}

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
