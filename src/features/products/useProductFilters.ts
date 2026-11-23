import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import {
  CATEGORIES,
  isProductPageSize,
  PRODUCT_SORTS,
  PRODUCTS_PAGE_SIZE,
  type Category,
  type ProductPageSize,
  type ProductSort,
} from '@/api/contract'
import type { ProductListQuery } from './productQueries'

/** Stock filter. `all` shows everything; the others map to the API's `inStock=true|false`. */
export type Availability = 'all' | 'inStock' | 'outOfStock'

export interface ProductFilters {
  search: string
  category: Category | null
  availability: Availability
  sort: ProductSort
  /** Products loaded per batch. In the URL so a shared link loads the same way. */
  pageSize: ProductPageSize
}

const DEFAULTS: ProductFilters = {
  search: '',
  category: null,
  availability: 'all',
  sort: 'relevance',
  pageSize: PRODUCTS_PAGE_SIZE,
}

function isCategory(value: string | null): value is Category {
  return CATEGORIES.some((category) => category === value)
}

/** `?inStock=true` and `?inStock=false` in the URL, the same values the API takes. */
function parseAvailability(value: string | null): Availability {
  if (value === 'true') return 'inStock'
  if (value === 'false') return 'outOfStock'
  return 'all'
}

function isSort(value: string | null): value is ProductSort {
  return PRODUCT_SORTS.some((sort) => sort === value)
}

/** `?pageSize=25|50|100`. Missing or anything else (`abc`, `7`, `5000`) means the default. */
function parsePageSize(value: string | null): ProductPageSize {
  const size = Number(value)
  return value !== null && isProductPageSize(size) ? size : DEFAULTS.pageSize
}

/** Reads filters from the URL. Anything invalid (a hand-edited link) falls back to the default. */
export function parseFilters(params: URLSearchParams): ProductFilters {
  const category = params.get('category')
  const sort = params.get('sort')
  return {
    search: params.get('search') ?? DEFAULTS.search,
    category: isCategory(category) ? category : DEFAULTS.category,
    availability: parseAvailability(params.get('inStock')),
    sort: isSort(sort) ? sort : DEFAULTS.sort,
    pageSize: parsePageSize(params.get('pageSize')),
  }
}

/** Writes only non-default values, so a shared link stays short: /?category=ducks&sort=rating */
function toParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.availability !== 'all') {
    params.set('inStock', String(filters.availability === 'inStock'))
  }
  if (filters.sort !== DEFAULTS.sort) params.set('sort', filters.sort)
  if (filters.pageSize !== DEFAULTS.pageSize) params.set('pageSize', String(filters.pageSize))
  return params
}

/** The API query for these filters. Paging is handled by the infinite list. */
export function toProductQuery(filters: ProductFilters): ProductListQuery {
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.availability === 'all' ? {} : { inStock: filters.availability === 'inStock' }),
    sort: filters.sort,
    ...(filters.pageSize === DEFAULTS.pageSize ? {} : { pageSize: filters.pageSize }),
  }
}

/**
 * Filters live in the URL, not in component state (D2-2). That is why a refresh keeps them,
 * a copied link reproduces the same view, and Back steps through earlier filter changes.
 * The page number isn't in the URL: the list loads more as you scroll (D4-3). The page
 * size is, because it changes how the list loads.
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
    filters.availability !== DEFAULTS.availability ||
    filters.sort !== DEFAULTS.sort ||
    filters.pageSize !== DEFAULTS.pageSize

  return { filters, setFilters, clearFilters, hasActiveFilters }
}
