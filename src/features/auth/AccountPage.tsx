import { UserOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Col, Descriptions, Flex, Row, Skeleton, Typography } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { getMe } from '@/api/client'
import { StatusView } from '@/components/StatusView'
import { toRequestState } from '@/lib/toRequestState'
import { useLogout } from './useLogout'

/** Protected account page. Loading /api/me also proves the token still works: a 401 signs out. */
export function AccountPage() {
  const me = useQuery({ queryKey: ['me'], queryFn: ({ signal }) => getMe(signal) })
  const logout = useLogout()

  return (
    <Row justify="center" gutter={[24, 24]}>
      <Col xs={24} sm={24} md={18} lg={14} xl={12} xxl={12}>
        <Card>
          <StatusView
            state={toRequestState(me)}
            onRetry={() => void me.refetch()}
            skeleton={<Skeleton active avatar paragraph={{ rows: 3 }} />}
          >
            {(user) => (
              <Flex vertical gap="large">
                <Flex align="center" gap="middle">
                  <Avatar size={56} icon={<UserOutlined />} />
                  <Typography.Title level={1}>{user.name}</Typography.Title>
                </Flex>
                <Descriptions
                  column={1}
                  bordered
                  items={[
                    { key: 'email', label: 'Email', children: user.email },
                    { key: 'id', label: 'Customer ID', children: user.id },
                  ]}
                />
                <Button onClick={logout}>Sign out</Button>
              </Flex>
            )}
          </StatusView>
        </Card>
      </Col>
    </Row>
  )
}
