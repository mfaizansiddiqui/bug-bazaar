import { memo } from 'react'
import { StarFilled } from '@ant-design/icons'
import { Card, Flex, Tag, Typography } from 'antd'
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
 *
 * Memoized (D4-2): when live stock changes one product, the list is rebuilt but every other
 * product keeps the same object, so memo's shallow prop check skips their re-render.
 * It only works because `product` is the only prop and is never recreated needlessly.
 */
export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
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
        <Flex vertical gap="small">
          <Flex justify="space-between" align="center">
            <Tag className="product-card__category">{product.category}</Tag>
            <Typography.Text type="secondary" className="product-card__rating">
              <StarFilled className="product-card__star" aria-hidden /> {product.rating}
              <Typography.Text className="product-card__hidden"> out of 5</Typography.Text>
            </Typography.Text>
          </Flex>
          <Typography.Title level={2} className="product-card__name">
            {product.name}
          </Typography.Title>
          <Flex justify="space-between" align="center" wrap gap="small">
            <Typography.Text strong className="product-card__price">
              {formatCents(product.price)}
            </Typography.Text>
            <StockTag stock={product.stock} />
          </Flex>
        </Flex>
      </Card>
    </Link>
  )
})
