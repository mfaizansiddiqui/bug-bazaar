import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Col, Flex, Grid, Row } from 'antd'
import { useWindowVirtualizer } from '@tanstack/react-virtual'
import type { Product } from '@/api/contract'
import { ProductCard } from './ProductCard'
import './product-grid.scss'

/**
 * Cards per row at each antd breakpoint. Matches the Col spans below (24 / span).
 * The page is at most 1200 px wide, so 4 per row is the most that keeps names readable.
 */
function useColumns(): number {
  const screens = Grid.useBreakpoint()
  if (screens.xl) return 4
  if (screens.md) return 3
  if (screens.sm) return 2
  return 1
}

// A row of cards is about 380 px tall at desktop widths. Real heights are measured after render.
const ESTIMATED_ROW_HEIGHT = 380
const OVERSCAN_ROWS = 2

interface ProductGridProps {
  products: Product[]
  /** All matching products, loaded or not. Lets screen readers announce "item 3 of 5,000". */
  total?: number
}

/**
 * Virtualized product grid (D4-3). Products are grouped into rows, and only the rows near
 * the viewport (plus 2 above and below) are in the DOM, so the page stays fast with all
 * 5,000 products loaded. Row heights are measured after render, so cards may vary in height.
 *
 * Inline `style` is used here on purpose: row positions are computed while scrolling, so
 * they can't live in SCSS. This file is the documented exception in UI.md.
 */
export function ProductGrid({ products, total = products.length }: ProductGridProps) {
  const columns = useColumns()
  const listRef = useRef<HTMLDivElement>(null)
  const [listTop, setListTop] = useState(0)

  const rows = useMemo(() => {
    const result: Product[][] = []
    for (let start = 0; start < products.length; start += columns) {
      result.push(products.slice(start, start + columns))
    }
    return result
  }, [products, columns])

  // Distance from the top of the page to the list, so window scroll maps to list rows.
  useLayoutEffect(() => {
    setListTop(listRef.current?.offsetTop ?? 0)
  }, [])

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: OVERSCAN_ROWS,
    scrollMargin: listTop,
    // A real row is never 0 px tall. 0 means "not laid out" (a hidden tab, or jsdom in
    // tests), so keep the estimate instead of collapsing every row onto offset 0.
    measureElement: (element) => element.getBoundingClientRect().height || ESTIMATED_ROW_HEIGHT,
  })

  return (
    <Flex
      ref={listRef}
      vertical
      role="list"
      aria-label="Products"
      className="product-grid"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const row = rows[virtualRow.index] ?? []
        return (
          <Row
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            gutter={[16, 16]}
            className="product-grid__row"
            style={{ transform: `translateY(${String(virtualRow.start - listTop)}px)` }}
          >
            {row.map((product, column) => (
              <Col
                key={product.id}
                role="listitem"
                aria-setsize={total}
                aria-posinset={virtualRow.index * columns + column + 1}
                xs={24}
                sm={12}
                md={8}
                lg={8}
                xl={6}
                xxl={6}
              >
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )
      })}
    </Flex>
  )
}
