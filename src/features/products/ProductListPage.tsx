import { useState } from 'react'
import { Flex, Pagination, Result, Skeleton, Typography } from 'antd'
import { PRODUCTS_PAGE_SIZE } from '@/api/contract'
import { ProductGrid } from './ProductGrid'
import { useProducts } from './productQueries'
import './product-list-page.scss'

/** Home page: the product grid with paging. Filters arrive in D2-2. */
export function ProductListPage() {
  const [page, setPage] = useState(1)
  const products = useProducts({ page })

  return (
    <Flex vertical gap="large" className="product-list-page">
      <Typography.Title level={1}>Products</Typography.Title>
      {products.isPending && <Skeleton active paragraph={{ rows: 8 }} />}
      {products.isError && <Result status="error" title="Products could not be loaded" />}
      {products.isSuccess && (
        <>
          <ProductGrid products={products.data.items} />
          <Pagination
            className="product-list-page__pagination"
            current={page}
            pageSize={PRODUCTS_PAGE_SIZE}
            total={products.data.total}
            showSizeChanger={false}
            onChange={setPage}
          />
        </>
      )}
    </Flex>
  )
}
