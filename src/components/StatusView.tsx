import type { ReactNode } from 'react'
import { Button, Empty, Flex, Result, Skeleton, Typography } from 'antd'
import { errorCopy } from '@/api/errorCopy'
import { assertNever, type RequestState } from '@/api/requestState'
import { NotFoundPage } from './NotFoundPage'
import './status-view.scss'

interface StatusViewProps<T> {
  state: RequestState<T>
  /** Re-runs the request. Shown as a Retry button on errors that can recover. */
  onRetry: () => void
  /** Renders the data. Only called in the success state, so `data` is always defined. */
  children: (data: T) => ReactNode
  /** Treats a successful but empty result as the empty state. */
  isEmpty?: (data: T) => boolean
  emptyTitle?: string
  emptyAction?: ReactNode
  /** Title for a 404, e.g. "Product not found". */
  notFoundTitle?: string
  /** Loading placeholder shaped like the content. Defaults to a generic skeleton. */
  skeleton?: ReactNode
}

/**
 * One component for the four UI states (D2-3), so loading, empty, error and success
 * look and behave the same on every page.
 */
export function StatusView<T>({
  state,
  onRetry,
  children,
  isEmpty,
  emptyTitle = 'Nothing here yet',
  emptyAction,
  notFoundTitle,
  skeleton = <Skeleton active paragraph={{ rows: 6 }} />,
}: StatusViewProps<T>) {
  switch (state.status) {
    case 'idle':
    case 'loading':
      return (
        <Flex vertical aria-busy="true" className="status-view">
          <Typography.Text role="status" className="status-view__hidden">
            Loading…
          </Typography.Text>
          {skeleton}
        </Flex>
      )

    case 'error': {
      if (state.error.kind === 'notFound') {
        return notFoundTitle ? <NotFoundPage title={notFoundTitle} /> : <NotFoundPage />
      }
      const copy = errorCopy(state.error)
      return (
        <Result
          role="alert"
          status={state.error.kind === 'network' ? 'warning' : 'error'}
          title={copy.title}
          subTitle={copy.description}
          extra={
            <Button type="primary" onClick={onRetry}>
              Try again
            </Button>
          }
        />
      )
    }

    case 'success':
      if (isEmpty?.(state.data)) {
        return (
          <Empty description={emptyTitle} className="status-view">
            {emptyAction}
          </Empty>
        )
      }
      return <>{children(state.data)}</>

    default:
      return assertNever(state)
  }
}
