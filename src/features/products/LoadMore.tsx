import { useEffect, useRef } from 'react'
import { Button, Flex, Typography } from 'antd'
import { useInView } from '@/hooks/useInView'

interface LoadMoreProps {
  shown: number
  total: number
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
}

/**
 * End of the list: "Showing X of Y" and a Load more button. When the button comes within
 * 800 px of the viewport, the next page loads by itself (infinite scroll). The button stays
 * for keyboard and screen-reader users, who shouldn't have to scroll to trigger loading.
 */
export function LoadMore({ shown, total, hasMore, loading, onLoadMore }: LoadMoreProps) {
  const ref = useRef<HTMLDivElement>(null)
  const nearEnd = useInView(ref, { rootMargin: '800px', enabled: hasMore })

  useEffect(() => {
    if (nearEnd && hasMore && !loading) onLoadMore()
  }, [nearEnd, hasMore, loading, onLoadMore])

  return (
    <Flex ref={ref} vertical align="center" gap="small">
      <Typography.Text type="secondary" aria-live="polite">
        Showing {shown.toLocaleString('en-US')} of {total.toLocaleString('en-US')} products
      </Typography.Text>
      {hasMore && (
        <Button onClick={onLoadMore} loading={loading}>
          Load more
        </Button>
      )}
    </Flex>
  )
}
