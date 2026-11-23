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

/**
 * How the list is shown: numbered pages of 25, 50 or 100, or `all`, the infinite list that
 * keeps loading as you scroll (the virtualized 5,000-item list from D4-3).
 */
export type PageSizeOption = ProductPageSize | 'all'

export interface ProductFilters {
  search: string
  category: Category | null
  availability: Availability
  sort: ProductSort
  pageSize: PageSizeOption
  /** 1-based page number. Always 1 for the infinite list. */
  page: number
}

const DEFAULTS: ProductFilters = {
  search: '',
  category: null,
  availability: 'all',
  sort: 'relevance',
  pageSize: PRODUCTS_PAGE_SIZE,
  page: 1,
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

/** `?pageSize=25|50|100|all`. Missing or anything else (`abc`, `7`, `5000`) means the default. */
function parsePageSize(value: string | null): PageSizeOption {
  if (value === 'all') return 'all'
  const size = Number(value)
  return value !== null && isProductPageSize(size) ? size : DEFAULTS.pageSize
}

/** `?page=3`. Missing, zero, negative or not a whole number means page 1. */
function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : DEFAULTS.page
}

/** Reads filters from the URL. Anything invalid (a hand-edited link) falls back to the default. */
export function parseFilters(params: URLSearchParams): ProductFilters {
  const category = params.get('category')
  const sort = params.get('sort')
  const pageSize = parsePageSize(params.get('pageSize'))
  return {
    search: params.get('search') ?? DEFAULTS.search,
    category: isCategory(category) ? category : DEFAULTS.category,
    availability: parseAvailability(params.get('inStock')),
    sort: isSort(sort) ? sort : DEFAULTS.sort,
    pageSize,
    page: pageSize === 'all' ? DEFAULTS.page : parsePage(params.get('page')),
  }
}

/** Writes only non-default values, so a shared link stays short: /?category=ducks&page=2 */
function toParams(filters: ProductFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.search) params.set('search', filters.search)
  if (filters.category) params.set('category', filters.category)
  if (filters.availability !== 'all') {
    params.set('inStock', String(filters.availability === 'inStock'))
  }
  if (filters.sort !== DEFAULTS.sort) params.set('sort', filters.sort)
  if (filters.pageSize !== DEFAULTS.pageSize) params.set('pageSize', String(filters.pageSize))
  if (filters.pageSize !== 'all' && filters.page > 1) params.set('page', String(filters.page))
  return params
}

/**
 * The API query for these filters, without the page (the list hooks add it). The infinite
 * list loads in batches of the default size; numbered pages send their size.
 */
export function toProductQuery(filters: ProductFilters): ProductListQuery {
  const { pageSize } = filters
  return {
    ...(filters.search ? { search: filters.search } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    ...(filters.availability === 'all' ? {} : { inStock: filters.availability === 'inStock' }),
    sort: filters.sort,
    ...(pageSize === 'all' || pageSize === DEFAULTS.pageSize ? {} : { pageSize }),
  }
}

/**
 * Filters live in the URL, not in component state (D2-2). That is why a refresh keeps them,
 * a copied link reproduces the same view, and Back steps through earlier filter changes.
 * The page number and page size are in the URL too, so a link opens on the same page.
 */
export function useProductFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = useMemo(() => parseFilters(searchParams), [searchParams])

  const setFilters = useCallback(
    (patch: Partial<ProductFilters>, { replace = false }: { replace?: boolean } = {}) => {
      // Any change other than the page itself starts again from page 1: page 7 of the old
      // results may not exist for the new ones.
      const page = patch.page ?? DEFAULTS.page
      setSearchParams((current) => toParams({ ...parseFilters(current), ...patch, page }), {
        replace,
      })
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams())
  }, [setSearchParams])

  // The page number isn't a filter, so it doesn't turn on "Clear filters" by itself.
  const hasActiveFilters =
    filters.search !== DEFAULTS.search ||
    filters.category !== DEFAULTS.category ||
    filters.availability !== DEFAULTS.availability ||
    filters.sort !== DEFAULTS.sort ||
    filters.pageSize !== DEFAULTS.pageSize

  return { filters, setFilters, clearFilters, hasActiveFilters }
}
