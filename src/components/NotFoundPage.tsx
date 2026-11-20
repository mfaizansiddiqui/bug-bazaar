import { Button, Result } from 'antd'
import { useNavigate } from 'react-router'

/** Shown for unknown routes and for API 404s (D3-4). */
export function NotFoundPage({ title = 'Page not found' }: { title?: string }) {
  const navigate = useNavigate()
  return (
    <Result
      status="404"
      title={title}
      subTitle="It may have been moved, or the link is wrong."
      extra={
        <Button
          type="primary"
          onClick={() => {
            void navigate('/')
          }}
        >
          Back to products
        </Button>
      }
    />
  )
}
