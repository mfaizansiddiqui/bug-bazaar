import { useQuery } from '@tanstack/react-query'
import { getProduct, getProducts } from '@/api/client'
import type { ProductQuery } from '@/api/contract'

/**
 * Query keys for product data. The full query object is part of the key, so every
 * search, filter, sort and page is cached separately, and a response can only ever be
 * stored under the query that asked for it.
 */
export const productKeys = {
  all: ['products'] as const,
  list: (query: ProductQuery) => [...productKeys.all, 'list', query] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const,
}

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: productKeys.list(query),
    queryFn: ({ signal }) => getProducts(query, signal),
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: ({ signal }) => getProduct(id, signal),
  })
}
