import { Tag } from 'antd'

const LOW_STOCK = 5

interface StockTagProps {
  stock: number
}

/**
 * Stock label used on the card and the details page, so both always agree.
 * `solid` tags put white text on the full status color (5:1 contrast or better). The default
 * `filled` style mixes a tinted background that failed WCAG AA contrast (D4-1).
 */
export function StockTag({ stock }: StockTagProps) {
  if (stock === 0) {
    return (
      <Tag color="error" variant="solid">
        Out of stock
      </Tag>
    )
  }
  if (stock <= LOW_STOCK) {
    return (
      <Tag color="warning" variant="solid">
        Only {stock} left
      </Tag>
    )
  }
  return (
    <Tag color="success" variant="solid">
      {stock} in stock
    </Tag>
  )
}
