import { Button, Flex, Pagination, Typography } from 'antd'
import { PRODUCTS_PAGE_SIZE } from '@/api/contract'
import { BackToTop } from '@/components/BackToTop'
import { StatusView } from '@/components/StatusView'
import { toRequestState } from '@/lib/toRequestState'
import { ProductFilters } from './ProductFilters'
import { ProductGrid } from './ProductGrid'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import { useProducts } from './productQueries'
import { toProductQuery, useProductFilters } from './useProductFilters'
import './product-list-page.scss'

/** Home page: filters, result count, product grid and paging, all driven by the URL. */
export function ProductListPage() {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useProductFilters()
  const products = useProducts(toProductQuery(filters))

  return (
    <Flex vertical gap="large" className="product-list-page">
      <Typography.Title level={1}>Products</Typography.Title>
      <BackToTop />
      <ProductFilters
        filters={filters}
        onChange={setFilters}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        total={products.data?.total}
      />
      <StatusView
        state={toRequestState(products)}
        onRetry={() => void products.refetch()}
        isEmpty={(data) => data.items.length === 0}
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
        {(data) => (
          <>
            <ProductGrid products={data.items} />
            <Pagination
              className="product-list-page__pagination"
              current={filters.page}
              pageSize={PRODUCTS_PAGE_SIZE}
              total={data.total}
              showSizeChanger={false}
              onChange={(page) => {
                setFilters({ page })
                window.scrollTo({ top: 0 })
              }}
            />
          </>
        )}
      </StatusView>
    </Flex>
  )
}
