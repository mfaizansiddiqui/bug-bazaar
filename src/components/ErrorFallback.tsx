import { Button, Flex, Result, Typography } from 'antd'
import './error-fallback.scss'

interface ErrorFallbackProps {
  /** Short id of the logged entry, so a user can quote it to support. */
  reference?: string
}

/**
 * Shown instead of a white screen when rendering crashes (D4-7). It deliberately uses no
 * router or store, because whatever crashed may be one of those.
 */
export function ErrorFallback({ reference }: ErrorFallbackProps) {
  return (
    <Flex align="center" justify="center" className="error-fallback">
      <Result
        role="alert"
        status="500"
        title="Something broke on this page"
        subTitle="The error has been logged. Reloading usually fixes it."
        extra={[
          <Button
            key="reload"
            type="primary"
            onClick={() => {
              window.location.reload()
            }}
          >
            Reload the page
          </Button>,
          <Button
            key="home"
            onClick={() => {
              window.location.assign('/')
            }}
          >
            Go to the shop
          </Button>,
        ]}
      >
        {reference && <Typography.Text type="secondary">Reference: {reference}</Typography.Text>}
      </Result>
    </Flex>
  )
}
