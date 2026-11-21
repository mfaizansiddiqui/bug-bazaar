import { useState, useSyncExternalStore } from 'react'
import { ExperimentOutlined } from '@ant-design/icons'
import {
  Alert,
  Button,
  Divider,
  Drawer,
  FloatButton,
  Form,
  Radio,
  Select,
  Space,
  Typography,
} from 'antd'
import {
  getMockControls,
  MOCK_ROUTES,
  resetMockControls,
  setMockControls,
  subscribeMockControls,
  type MockControls as Controls,
  type MockLatency,
  type MockRoute,
} from '@/mocks/controls'
import './mock-controls.scss'

const routeOptions = (Object.keys(MOCK_ROUTES) as MockRoute[]).map((route) => ({
  value: route,
  label: MOCK_ROUTES[route].label,
}))

const LATENCY_LABELS: Record<MockLatency, string> = {
  none: 'None',
  slow: 'Slow',
  random: 'Random',
}

/**
 * What the saved controls are doing right now, in words, or null when nothing is switched on.
 * Controls are saved in localStorage, so a forced error survives a reload. Saying so on screen
 * stops a forgotten setting (e.g. "401 on POST /api/login") from looking like an app bug.
 */
function describeActive(controls: Controls): string | null {
  const parts: string[] = []
  if (controls.failRoute && controls.failStatus !== null) {
    parts.push(`${MOCK_ROUTES[controls.failRoute].label} answers ${String(controls.failStatus)}`)
  }
  if (controls.latency !== 'none') {
    parts.push(`${LATENCY_LABELS[controls.latency].toLowerCase()} responses`)
  }
  return parts.length > 0 ? parts.join(' and ') : null
}

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
  const active = describeActive(controls)

  // D4-7 demo: throwing during render is exactly the kind of crash an error boundary catches.
  const [crash, setCrash] = useState(false)
  if (crash) throw new Error('Test crash from the mock controls panel')

  return (
    <>
      <FloatButton
        // antd only fits text in the square shape; a circle cuts "Mock" off.
        shape="square"
        className="mock-controls__toggle"
        icon={<ExperimentOutlined aria-hidden />}
        content="Mock"
        tooltip={active ? `Mock API: ${active}` : 'Mock API controls'}
        type={active ? 'primary' : 'default'}
        badge={active ? { dot: true } : undefined}
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
        <Space orientation="vertical" size="middle" className="mock-controls__body">
          {active ? (
            <Alert
              type="warning"
              showIcon
              title="Mock settings are on"
              description={`Right now: ${active}. Requests fail or slow down on purpose until you reset.`}
              action={
                <Button size="small" onClick={resetMockControls}>
                  Reset
                </Button>
              }
            />
          ) : (
            <Typography.Paragraph type="secondary" className="mock-controls__intro">
              Force an API error or slow responses to see each screen state. Settings are saved in
              this browser. Reload the page to reset the mock stock and orders.
            </Typography.Paragraph>
          )}

          <Form layout="vertical" className="mock-controls__form">
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
                placeholder="Pick a route first"
                options={statusOptions}
                value={controls.failStatus ?? undefined}
                onChange={(status: number) => {
                  setMockControls({ failStatus: status })
                }}
              />
            </Form.Item>
            <Form.Item
              label="Latency"
              extra="Slow: 1.5 s. Random: 0.1 to 1.5 s, so replies can arrive out of order."
            >
              <Radio.Group
                block
                optionType="button"
                aria-label="Latency"
                value={controls.latency}
                onChange={(event) => {
                  setMockControls({ latency: event.target.value as MockLatency })
                }}
                options={(Object.keys(LATENCY_LABELS) as MockLatency[]).map((value) => ({
                  value,
                  label: LATENCY_LABELS[value],
                }))}
              />
            </Form.Item>
          </Form>

          <Alert
            type="info"
            showIcon
            title="Demo login"
            description="dev@bugbazaar.test / password123. Product p-0001 has 1 in stock: order 2 to get a 409."
          />

          <Divider plain titlePlacement="start" className="mock-controls__divider">
            Tools
          </Divider>
          <Button block onClick={resetMockControls} disabled={!active}>
            Reset controls
          </Button>
          <Button
            block
            onClick={() => {
              // Loaded on demand, so msw never ends up in the main bundle.
              void import('@/mocks/liveStock').then(({ dropLiveStockConnections }) => {
                dropLiveStockConnections()
              })
            }}
          >
            Drop live stock connection
          </Button>
          <Button
            block
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
