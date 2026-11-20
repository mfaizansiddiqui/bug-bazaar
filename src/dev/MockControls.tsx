import { useState, useSyncExternalStore } from 'react'
import { Alert, Button, Drawer, FloatButton, Form, Radio, Select, Space, Typography } from 'antd'
import {
  getMockControls,
  MOCK_ROUTES,
  resetMockControls,
  setMockControls,
  subscribeMockControls,
  type MockLatency,
  type MockRoute,
} from '@/mocks/controls'
import './mock-controls.scss'

const routeOptions = (Object.keys(MOCK_ROUTES) as MockRoute[]).map((route) => ({
  value: route,
  label: MOCK_ROUTES[route].label,
}))

/**
 * Dev-only panel that switches on each documented API error and slow or out-of-order
 * responses, so every UI state can be triggered on purpose (D1-2, D2-3, D2-6).
 */
export function MockControls() {
  const [open, setOpen] = useState(false)
  const controls = useSyncExternalStore(subscribeMockControls, getMockControls)
  const statusOptions = controls.failRoute
    ? MOCK_ROUTES[controls.failRoute].statuses.map((status) => ({
        value: status,
        label: String(status),
      }))
    : []
  const isActive = controls.failRoute !== null || controls.latency !== 'none'

  // D4-7 demo: throwing during render is exactly the kind of crash an error boundary catches.
  const [crash, setCrash] = useState(false)
  if (crash) throw new Error('Test crash from the mock controls panel')

  return (
    <>
      <FloatButton
        className="mock-controls__toggle"
        content="Mock"
        tooltip="Mock API controls"
        type={isActive ? 'primary' : 'default'}
        aria-label="Open mock API controls"
        onClick={() => {
          setOpen(true)
        }}
      />
      <Drawer
        title="Mock API controls"
        open={open}
        onClose={() => {
          setOpen(false)
        }}
        size="default"
      >
        <Space orientation="vertical" size="large" className="mock-controls__body">
          <Typography.Paragraph type="secondary">
            Settings are saved in this browser and apply to the next request. Reload the page to
            reset the mock database (stock and orders).
          </Typography.Paragraph>
          <Form layout="vertical">
            <Form.Item label="Force an error on" htmlFor="mock-fail-route">
              <Select<MockRoute>
                id="mock-fail-route"
                allowClear
                placeholder="No forced error"
                options={routeOptions}
                value={controls.failRoute ?? undefined}
                onChange={(route: MockRoute | undefined) => {
                  setMockControls({
                    failRoute: route ?? null,
                    failStatus: route ? MOCK_ROUTES[route].statuses[0] : null,
                  })
                }}
              />
            </Form.Item>
            <Form.Item label="Status" htmlFor="mock-fail-status">
              <Select<number>
                id="mock-fail-status"
                disabled={!controls.failRoute}
                options={statusOptions}
                value={controls.failStatus ?? undefined}
                onChange={(status: number) => {
                  setMockControls({ failStatus: status })
                }}
              />
            </Form.Item>
            <Form.Item label="Latency">
              <Radio.Group
                optionType="button"
                value={controls.latency}
                onChange={(event) => {
                  setMockControls({ latency: event.target.value as MockLatency })
                }}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'slow', label: 'Slow (1.5 s)' },
                  { value: 'random', label: 'Random (out of order)' },
                ]}
              />
            </Form.Item>
          </Form>
          <Alert
            type="info"
            showIcon
            title="Demo login"
            description="dev@bugbazaar.test / password123. Product p-0001 has 1 in stock: order 2 to get a 409."
          />
          <Button onClick={resetMockControls}>Reset controls</Button>
          <Button
            danger
            onClick={() => {
              setCrash(true)
            }}
          >
            Throw a test error
          </Button>
        </Space>
      </Drawer>
    </>
  )
}
