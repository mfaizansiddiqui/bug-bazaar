import { useState } from 'react'
import { Flex, Pagination, Typography } from 'antd'
import { PRODUCTS_PAGE_SIZE } from '@/api/contract'
import { StatusView } from '@/components/StatusView'
import { toRequestState } from '@/lib/toRequestState'
import { ProductGrid } from './ProductGrid'
import { ProductGridSkeleton } from './ProductGridSkeleton'
import { useProducts } from './productQueries'
import './product-list-page.scss'

/** Home page: the product grid with paging. Filters arrive in D2-2. */
export function ProductListPage() {
  const [page, setPage] = useState(1)
  const products = useProducts({ page })

  return (
    <Flex vertical gap="large" className="product-list-page">
      <Typography.Title level={1}>Products</Typography.Title>
      <StatusView
        state={toRequestState(products)}
        onRetry={() => void products.refetch()}
        isEmpty={(data) => data.items.length === 0}
        emptyTitle="No products found"
        skeleton={<ProductGridSkeleton />}
      >
        {(data) => (
          <>
            <ProductGrid products={data.items} />
            <Pagination
              className="product-list-page__pagination"
              current={page}
              pageSize={PRODUCTS_PAGE_SIZE}
              total={data.total}
              showSizeChanger={false}
              onChange={setPage}
            />
          </>
        )}
      </StatusView>
    </Flex>
  )
}
