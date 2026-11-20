import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { CATEGORIES, PRODUCT_SORTS, type Category, type ProductSort } from '@/api/contract'
import type { ProductListQuery } from './productQueries'

export interface ProductFilters {
  search: string
  category: Category | null
  inStock: boolean
  sort: ProductSort
}

const DEFAULTS: ProductFilters = {
  search: '',
  category: null,
  inStock: false,
  sort: 'relevance',
}

function isCategory(value: string | null): value is Category {
  return CATEGORIES.some((category) => category === value)
}

function isSort(value: string | null): value is ProductSort {
  return PRODUCT_SORTS.some((sort) => sort === value)
}

/** Reads filters from the URL. Anything invalid (a hand-edited link) falls back to the default. */
export function parseFilters(params: URLSearchParams): ProductFilters {
  const category = params.get('category')
  const sort = params.get('sort')
  return {
    search: params.get('search') ?? DEFAULTS.search,
    category: isCategory(category) ? category : DEFAULTS.category,
    inStock: params.get('inStock') === 'true',
    sort: isSort(sort) ? sort : DEFAULTS.sort,
  }
}

/** Writes only non-default values, so a shared link stays short: /?category=ducks&sort=rating */
function toParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.inStock) params.set('inStock', 'true')
  if (filters.sort !== DEFAULTS.sort) params.set('sort', filters.sort)
  return params
}

/** The API query for these filters. Paging is handled by the infinite list. */
export function toProductQuery(filters: ProductFilters): ProductListQuery {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.inStock ? { inStock: true } : {}),
    sort: filters.sort,
  }
}

/**
 * Filters live in the URL, not in component state (D2-2). That is why a refresh keeps them,
 * a copied link reproduces the same view, and Back steps through earlier filter changes.
 * The page isn't in the URL: the list loads more as you scroll (D4-3).
 */
export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const setFilters = useCallback(
    (patch: Partial<ProductFilters>, { replace = false }: { replace?: boolean } = {}) => {
      setSearchParams((current) => toParams({ ...parseFilters(current), ...patch }), { replace })
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams())
  }, [setSearchParams])

  const hasActiveFilters =
    filters.search !== DEFAULTS.search ||
    filters.category !== DEFAULTS.category ||
    filters.inStock !== DEFAULTS.inStock ||
    filters.sort !== DEFAULTS.sort

  return { filters, setFilters, clearFilters, hasActiveFilters }
}
