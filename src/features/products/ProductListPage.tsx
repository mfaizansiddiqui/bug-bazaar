import { Button, Card, Flex, Typography } from 'antd'
import { BackToTop } from '@/components/BackToTop'
import { StatusView } from '@/components/StatusView'
import { toRequestState } from '@/lib/toRequestState'
import { LoadMore } from './LoadMore'
import { ProductFilters } from './ProductFilters'
import { ProductGrid } from './ProductGrid'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import { useInfiniteProducts } from './productQueries'
import { toProductQuery, useProductFilters } from './useProductFilters'
import './product-list-page.scss'

/** Home page: filters, result count and one growing list of products, driven by the URL. */
export function ProductListPage() {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useProductFilters()
  const products = useInfiniteProducts(toProductQuery(filters))
  const total = products.data?.pages[0]?.total

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
          return (
            <>
              <ProductGrid products={items} total={data.pages[0]?.total ?? items.length} />
              <LoadMore
                shown={items.length}
                total={data.pages[0]?.total ?? items.length}
                hasMore={products.hasNextPage}
                loading={products.isFetchingNextPage}
                onLoadMore={() => void products.fetchNextPage()}
              />
            </>
          )
        }}
      </StatusView>
    </Flex>
  )
}
