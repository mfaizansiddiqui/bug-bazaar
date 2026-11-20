import type { QueryClient } from '@tanstack/react-query'
import type { Product, StockUpdate } from '@/api/contract'
import type { AppDispatch } from '@/app/store'
import { stockChanged } from '@/features/cart/cartSlice'
import { productKeys, type ProductPages } from '@/features/products/productQueries'

/**
 * Writes one live stock update into every place that shows stock, without a refetch:
 * - each cached product list (every loaded page) that contains the product
 * - the cached product details
 * - the cart line, whose quantity shrinks if it is now above stock
 *
 * Unchanged products and pages keep their object identity, so memoized cards skip
 * re-rendering (see docs/performance.md).
 */
export function applyStockUpdate(
  queryClient: QueryClient,
  dispatch: AppDispatch,
  { productId, stock }: StockUpdate,
): void {
  queryClient.setQueriesData<ProductPages>({ queryKey: productKeys.lists() }, (data) => {
    if (!data?.pages.some((page) => page.items.some((item) => item.id === productId))) {
      return data
    }
    return {
      ...data,
      pages: data.pages.map((page) =>
        page.items.some((item) => item.id === productId)
          ? {
              ...page,
              items: page.items.map((item) => (item.id === productId ? { ...item, stock } : item)),
            }
          : page,
      ),
    }
  })
  queryClient.setQueryData<Product>(productKeys.detail(productId), (product) =>
    product ? { ...product, stock } : product,
  )
  dispatch(stockChanged({ productId, stock }))
}
