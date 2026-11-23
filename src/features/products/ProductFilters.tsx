import { useEffect, useState } from 'react'
import { CloseCircleOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Col, ConfigProvider, Flex, Form, Input, Row, Select, Typography } from 'antd'
import {
  CATEGORIES,
  PRODUCT_PAGE_SIZES,
  type Category,
  type ProductPageSize,
  type ProductSort,
} from '@/api/contract'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Availability, ProductFilters as Filters } from './useProductFilters'
import './product-filters.scss'

const SEARCH_DEBOUNCE_MS = 300

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'relevance', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name: A to Z' },
]

const AVAILABILITY_OPTIONS: { value: Availability; label: string }[] = [
  { value: 'all', label: 'All products' },
  { value: 'inStock', label: 'In stock' },
  { value: 'outOfStock', label: 'Out of stock' },
]

const PAGE_SIZE_OPTIONS = PRODUCT_PAGE_SIZES.map((size) => ({
  value: size,
  label: `${String(size)} per page`,
}))

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
  //
  // Our own debounced commit also changes the URL. That change equals `debouncedSearch`, and
  // must NOT be copied back into the input: the user may have typed more letters since,
  // and overwriting them would eat their input on a slow device.
  const [lastUrlSearch, setLastUrlSearch] = useState(filters.search)
  if (filters.search !== lastUrlSearch) {
    setLastUrlSearch(filters.search)
    if (filters.search !== debouncedSearch) setSearchText(filters.search)
  }

  // Commit the search to the URL once typing has settled. `replace` means each keystroke
  // pause doesn't add a history entry, so Back skips over partial words.
  useEffect(() => {
    if (debouncedSearch === searchText && debouncedSearch !== filters.search) {
      onChange({ search: debouncedSearch }, { replace: true })
    }
  }, [debouncedSearch, searchText, filters.search, onChange])

  return (
    // Scoped token: the Row gutter spaces the fields, so Form.Item needs no bottom margin here.
    <ConfigProvider theme={{ components: { Form: { itemMarginBottom: 0 } } }}>
      <Form layout="vertical" className="product-filters" role="search">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={8} xl={8} xxl={8}>
            <Form.Item label="Search" htmlFor="product-search">
              <Input
                id="product-search"
                type="search"
                allowClear
                prefix={<SearchOutlined aria-hidden className="product-filters__icon" />}
                placeholder="Ducks, keyboards, coffee…"
                value={searchText}
                onChange={(event) => {
                  setSearchText(event.target.value)
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4} xl={4} xxl={4}>
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
          <Col xs={24} sm={12} md={6} lg={4} xl={4} xxl={4}>
            <Form.Item label="Availability" htmlFor="product-availability">
              <Select<Availability>
                id="product-availability"
                options={AVAILABILITY_OPTIONS}
                value={filters.availability}
                onChange={(availability) => {
                  onChange({ availability })
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={6} lg={4} xl={4} xxl={4}>
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
          <Col xs={24} sm={12} md={6} lg={4} xl={4} xxl={4}>
            <Form.Item label="Per page" htmlFor="product-page-size">
              <Select<ProductPageSize>
                id="product-page-size"
                options={PAGE_SIZE_OPTIONS}
                value={filters.pageSize}
                onChange={(pageSize) => {
                  onChange({ pageSize })
                }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Flex
          justify="space-between"
          align="center"
          gap="small"
          className="product-filters__footer"
        >
          <Typography.Text strong aria-live="polite">
            {total === undefined
              ? 'Loading products…'
              : `${total.toLocaleString('en-US')} ${total === 1 ? 'product' : 'products'}`}
          </Typography.Text>
          <Button
            icon={<CloseCircleOutlined aria-hidden />}
            onClick={onClear}
            disabled={!hasActiveFilters}
          >
            Clear filters
          </Button>
        </Flex>
      </Form>
    </ConfigProvider>
  )
}
