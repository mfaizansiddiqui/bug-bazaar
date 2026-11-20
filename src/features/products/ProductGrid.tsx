import { Col, Row } from 'antd'
import type { Product } from '@/api/contract'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[]
}

/** Responsive grid: 1 column on phones up to 6 on very wide screens. */
export function ProductGrid({ products }: ProductGridProps) {
  return (
    <Row gutter={[16, 16]} role="list" aria-label="Products">
      {products.map((product) => (
        <Col key={product.id} role="listitem" xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
          <ProductCard product={product} />
        </Col>
      ))}
    </Row>
  )
}
