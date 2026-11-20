import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { getProduct, getProducts } from '@/api/client'
import type { Product, ProductList, ProductQuery } from '@/api/contract'

/**
 * Query keys for product data. The full query object is part of the key, so every
 * search, filter, sort and page is cached separately, and a response can only ever be
 * stored under the query that asked for it.
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (query: ProductQuery) => [...productKeys.lists(), query] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
}

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: ({ signal }) => getProducts(query, signal),
  })
}

/** Finds a product in any cached list page, with the time that page was fetched. */
function findInCachedLists(
  queryClient: QueryClient,
  id: string,
): { product: Product; updatedAt: number } | undefined {
  for (const [key, list] of queryClient.getQueriesData<ProductList>({
    queryKey: productKeys.lists(),
  })) {
    const product = list?.items.find((item) => item.id === id)
    if (product) {
      return { product, updatedAt: queryClient.getQueryState(key)?.dataUpdatedAt ?? 0 }
    }
  }
  return undefined
}

/**
 * One product. If the grid already loaded it, that copy is used as initial data with its
 * real fetch time, so opening a product from the grid needs no request while the list data
 * is still fresh (D3-5). Once it is stale, TanStack Query refetches in the background.
 */
export function useProduct(id: string) {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) => getProduct(id, signal),
    initialData: () => findInCachedLists(queryClient, id)?.product,
    initialDataUpdatedAt: () => findInCachedLists(queryClient, id)?.updatedAt,
  })
}
