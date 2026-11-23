import { useEffect } from 'react'
import { Button, Card, Flex, Pagination, Typography } from 'antd'
import { BackToTop } from '@/components/BackToTop'
import { StatusView } from '@/components/StatusView'
import { toRequestState } from '@/lib/toRequestState'
import { LoadMore } from './LoadMore'
import { ProductFilters } from './ProductFilters'
import { ProductGrid } from './ProductGrid'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import { useInfiniteProducts, usePagedProducts } from './productQueries'
import { toProductQuery, useProductFilters } from './useProductFilters'
import './product-list-page.scss'

/**
 * Home page: filters, result count and the product list, all driven by the URL.
 * The list is either numbered pages (25, 50 or 100 per page, the default) or, with
 * "All (scroll)", the infinite virtualized list that keeps loading as you scroll (D4-3).
 */
export function ProductListPage() {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useProductFilters()
  const query = toProductQuery(filters)
  const { pageSize } = filters
  const paged = pageSize !== 'all'

  // Hooks can't be called conditionally, so both exist, but only the current view fetches.
  const infinite = useInfiniteProducts(query, { enabled: !paged })
  const pagedProducts = usePagedProducts(query, filters.page, { enabled: paged })
  const products = paged ? pagedProducts : infinite
  const total = products.data?.pages[0]?.total

  // A link to a page past the end (?page=999, or after stock sold out) goes to the last page.
  const lastPage = paged && total !== undefined ? Math.max(1, Math.ceil(total / pageSize)) : 1
  useEffect(() => {
    if (paged && total !== undefined && filters.page > lastPage) {
      setFilters({ page: lastPage }, { replace: true })
    }
  }, [paged, total, filters.page, lastPage, setFilters])

  return (
    <Flex vertical gap="large" className="product-list-page">
      <Flex vertical gap="small" className="product-list-page__hero">
        <Typography.Text className="product-list-page__eyebrow">
          Gear for developers
        </Typography.Text>
        {/* Own group: antd adds a top margin to a heading that follows other Typography. */}
        <Flex vertical gap="small">
          <Typography.Title level={1} className="product-list-page__title">
            Products
          </Typography.Title>
          <Typography.Paragraph type="secondary" className="product-list-page__lead">
            Rubber ducks, mechanical keyboards, coffee and stickers for people who debug for a
            living. Stock updates live, so what you see is what's on the shelf.
          </Typography.Paragraph>
        </Flex>
      </Flex>
      <BackToTop />
      <Card className="product-list-page__filters">
        <ProductFilters
          filters={filters}
          onChange={setFilters}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
          total={total}
        />
      </Card>
      <StatusView
        state={toRequestState(products)}
        onRetry={() => void products.refetch()}
        isEmpty={(data) => (data.pages[0]?.total ?? 0) === 0}
        emptyTitle="No products match your filters"
        emptyAction={
          hasActiveFilters && (
            <Button type="primary" onClick={clearFilters}>
              Clear filters
            </Button>
          )
        }
        skeleton={<ProductGridSkeleton />}
      >
        {(data) => {
          const items = data.pages.flatMap((page) => page.items)
          const matching = data.pages[0]?.total ?? items.length

          if (paged) {
            const first = (filters.page - 1) * pageSize + 1
            const last = first + items.length - 1
            return (
              <>
                <ProductGrid products={items} total={matching} offset={first - 1} />
                <Flex
                  vertical
                  align="center"
                  gap="middle"
                  className="product-list-page__pagination"
                >
                  <Typography.Text type="secondary" aria-live="polite">
                    {items.length > 0
                      ? `Showing ${first.toLocaleString('en-US')}–${last.toLocaleString('en-US')} of ${matching.toLocaleString('en-US')} products`
                      : 'Loading…'}
                  </Typography.Text>
                  <Pagination
                    current={filters.page}
                    pageSize={pageSize}
                    total={matching}
                    showSizeChanger={false}
                    responsive
                    onChange={(page) => {
                      setFilters({ page })
                      // Start the new page at the top of the list, not at the old scroll spot.
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  />
                </Flex>
              </>
            )
          }

          return (
            <>
              <ProductGrid products={items} total={matching} />
              <LoadMore
                shown={items.length}
                total={matching}
                hasMore={infinite.hasNextPage}
                loading={infinite.isFetchingNextPage}
                onLoadMore={() => void infinite.fetchNextPage()}
              />
            </>
          )
        }}
      </StatusView>
    </Flex>
  )
}
