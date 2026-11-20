import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query'
import { getProduct, getProducts } from '@/api/client'
import type { Product, ProductList, ProductQuery } from '@/api/contract'

/** A product list query without the page: the infinite query owns paging. */
export type ProductListQuery = Omit<ProductQuery, 'page'>

/** Cached shape of a product list: every page loaded so far. */
export type ProductPages = InfiniteData<ProductList, number>

/**
 * Query keys for product data. The full query object is part of the key, so every
 * search, filter and sort is cached separately, and a response can only ever be stored
 * under the query that asked for it.
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (query: ProductListQuery) => [...productKeys.lists(), query] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
}

/**
 * The product list as one growing list (D4-3): page 1 first, then the next 50 each time
 * fetchNextPage is called, until all `total` products are loaded.
 */
export function useInfiniteProducts(query: ProductListQuery) {
  return useInfiniteQuery({
    queryKey: productKeys.list(query),
    queryFn: ({ signal, pageParam }) => getProducts({ ...query, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const loaded = allPages.reduce((count, page) => count + page.items.length, 0)
      return loaded < lastPage.total ? allPages.length + 1 : undefined
    },
  })
}

/** Finds a product in any cached list, with the time that list was fetched. */
function findInCachedLists(
  queryClient: QueryClient,
  id: string,
): { product: Product; updatedAt: number } | undefined {
  for (const [key, data] of queryClient.getQueriesData<ProductPages>({
    queryKey: productKeys.lists(),
  })) {
    for (const page of data?.pages ?? []) {
      const product = page.items.find((item) => item.id === id)
      if (product) {
        return { product, updatedAt: queryClient.getQueryState(key)?.dataUpdatedAt ?? 0 }
      }
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
