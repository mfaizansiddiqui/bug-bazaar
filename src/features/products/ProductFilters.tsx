import { useEffect, useState } from 'react'
import { Button, Checkbox, Col, Form, Input, Row, Select, Typography } from 'antd'
import { CATEGORIES, type Category, type ProductSort } from '@/api/contract'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { ProductFilters as Filters } from './useProductFilters'
import './product-filters.scss'

const SEARCH_DEBOUNCE_MS = 300

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'relevance', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name: A to Z' },
]

const CATEGORY_OPTIONS = CATEGORIES.map((category) => ({
  value: category,
  label: category.charAt(0).toUpperCase() + category.slice(1),
}))

interface ProductFiltersProps {
  filters: Filters
  onChange: (patch: Partial<Filters>, options?: { replace?: boolean }) => void
  onClear: () => void
  hasActiveFilters: boolean
  /** Matching products across all pages. Undefined while loading. */
  total: number | undefined
}

export function ProductFilters({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
  total,
}: ProductFiltersProps) {
  // The input keeps its own text so typing stays instant. The URL only gets the debounced value.
  const [searchText, setSearchText] = useState(filters.search)
  const debouncedSearch = useDebouncedValue(searchText, SEARCH_DEBOUNCE_MS)

  // When the URL changes from outside (Back, Clear, a pasted link), show its search text.
  // This is React's "adjust state during render" pattern: no effect, no extra render pass.
  const [lastUrlSearch, setLastUrlSearch] = useState(filters.search)
  if (filters.search !== lastUrlSearch) {
    setLastUrlSearch(filters.search)
    setSearchText(filters.search)
  }

  // Commit the search to the URL once typing has settled. `replace` means each keystroke
  // pause doesn't add a history entry, so Back skips over partial words.
  useEffect(() => {
    if (debouncedSearch === searchText && debouncedSearch !== filters.search) {
      onChange({ search: debouncedSearch }, { replace: true })
    }
  }, [debouncedSearch, searchText, filters.search, onChange])

  return (
    <Form layout="vertical" className="product-filters" role="search">
      <Row gutter={[16, 0]} align="bottom">
        <Col xs={24} sm={24} md={24} lg={8} xl={8} xxl={8}>
          <Form.Item label="Search" htmlFor="product-search">
            <Input
              id="product-search"
              type="search"
              allowClear
              placeholder="Ducks, keyboards, coffee…"
              value={searchText}
              onChange={(event) => {
                setSearchText(event.target.value)
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5} xl={5} xxl={5}>
          <Form.Item label="Category" htmlFor="product-category">
            <Select<Category>
              id="product-category"
              allowClear
              placeholder="All categories"
              options={CATEGORY_OPTIONS}
              value={filters.category ?? undefined}
              onChange={(category: Category | undefined) => {
                onChange({ category: category ?? null })
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12} md={8} lg={5} xl={5} xxl={5}>
          <Form.Item label="Sort by" htmlFor="product-sort">
            <Select<ProductSort>
              id="product-sort"
              options={SORT_OPTIONS}
              value={filters.sort}
              onChange={(sort) => {
                onChange({ sort })
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={24} md={8} lg={6} xl={6} xxl={6}>
          <Form.Item>
            <Checkbox
              checked={filters.inStock}
              onChange={(event) => {
                onChange({ inStock: event.target.checked })
              }}
            >
              In stock only
            </Checkbox>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={[16, 8]} align="middle" justify="space-between">
        <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12}>
          <Typography.Text strong aria-live="polite">
            {total === undefined
              ? 'Loading products…'
              : `${total.toLocaleString('en-US')} ${total === 1 ? 'product' : 'products'}`}
          </Typography.Text>
        </Col>
        <Col xs={12} sm={12} md={12} lg={12} xl={12} xxl={12} className="product-filters__actions">
          <Button onClick={onClear} disabled={!hasActiveFilters}>
            Clear filters
          </Button>
        </Col>
      </Row>
    </Form>
  )
}
