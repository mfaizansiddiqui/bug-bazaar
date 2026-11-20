import type { QueryClient } from '@tanstack/react-query'
import type { Product, ProductList, StockUpdate } from '@/api/contract'
import type { AppDispatch } from '@/app/store'
import { stockChanged } from '@/features/cart/cartSlice'
import { productKeys } from '@/features/products/productQueries'

/**
 * Writes one live stock update into every place that shows stock, without a refetch:
 * - each cached product list page that contains the product
 * - the cached product details
 * - the cart line, whose quantity shrinks if it is now above stock
 */
export function applyStockUpdate(
  queryClient: QueryClient,
  dispatch: AppDispatch,
  { productId, stock }: StockUpdate,
): void {
  queryClient.setQueriesData<ProductList>({ queryKey: productKeys.lists() }, (list) =>
    list?.items.some((item) => item.id === productId)
      ? {
          ...list,
          items: list.items.map((item) => (item.id === productId ? { ...item, stock } : item)),
        }
      : list,
  )
  queryClient.setQueryData<Product>(productKeys.detail(productId), (product) =>
    product ? { ...product, stock } : product,
  )
  dispatch(stockChanged({ productId, stock }))
}
