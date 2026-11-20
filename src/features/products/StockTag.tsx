import { Tag } from 'antd'

const LOW_STOCK = 5

interface StockTagProps {
  stock: number
}

/** Stock label used on the card and the details page, so both always agree. */
export function StockTag({ stock }: StockTagProps) {
  if (stock === 0) return <Tag color="error">Out of stock</Tag>
  if (stock <= LOW_STOCK) return <Tag color="warning">Only {stock} left</Tag>
  return <Tag color="success">{stock} in stock</Tag>
}
