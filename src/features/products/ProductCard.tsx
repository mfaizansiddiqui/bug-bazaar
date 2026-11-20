import { Card, Tag, Typography } from 'antd'
import { Link } from 'react-router'
import type { Product } from '@/api/contract'
import { formatCents } from '@/lib/money'
import { StockTag } from './StockTag'
import './product-card.scss'

interface ProductCardProps {
  product: Product
}

/**
 * One product in the grid. The whole card is a single link, so keyboard users get one
 * Tab stop per product and open it with Enter.
 */
export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/products/${product.id}`} className="product-card">
      <Card
        hoverable
        className="product-card__card"
        cover={
          <img
            className="product-card__image"
            src={product.imageUrl}
            alt=""
            width={400}
            height={300}
            loading="lazy"
          />
        }
      >
        <Typography.Title level={2} className="product-card__name" ellipsis={{ rows: 2 }}>
          {product.name}
        </Typography.Title>
        <Typography.Text strong className="product-card__price">
          {formatCents(product.price)}
        </Typography.Text>
        <StockTag stock={product.stock} />
        <Tag className="product-card__category">{product.category}</Tag>
      </Card>
    </Link>
  )
}
