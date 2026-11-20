import { useState } from 'react'
import { Alert, Button, Card, Col, Form, Input, Row, Typography } from 'antd'
import { useMutation } from '@tanstack/react-query'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { login, setAuthToken } from '@/api/client'
import type { LoginRequest } from '@/api/contract'
import { errorCopy, errorKindOf } from '@/api/errorCopy'
import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { fieldErrorsFrom } from '@/lib/formErrors'
import { returnPathFrom } from './returnTo'
import { selectIsSignedIn, selectSessionExpired, signedIn } from './sessionSlice'
import './login-page.scss'

const FIELDS = ['email', 'password'] as const

export function LoginPage() {
  const [form] = Form.useForm<LoginRequest>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const isSignedIn = useAppSelector(selectIsSignedIn)
  const sessionWasExpired = useAppSelector(selectSessionExpired)
  const returnPath = returnPathFrom(location.state)
  const [formError, setFormError] = useState<string | null>(null)

  const signIn = useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => {
      setAuthToken(token)
      dispatch(signedIn(user))
      void navigate(returnPath, { replace: true })
    },
    onError: (error) => {
      // 400: show each message under its field. 401 and others: one message for the form.
      const fieldErrors = fieldErrorsFrom(error, FIELDS)
      if (fieldErrors.length > 0) {
        form.setFields(fieldErrors)
        return
      }
      setFormError(
        errorKindOf(error) === 'unauthorized'
          ? 'Wrong email or password.'
          : errorCopy(error).description,
      )
    },
  })

  if (isSignedIn && !signIn.isPending) return <Navigate to={returnPath} replace />

  return (
    <Row justify="center" gutter={[24, 24]} className="login-page">
      <Col xs={24} sm={20} md={14} lg={10} xl={8} xxl={8}>
        <Card>
          <Typography.Title level={1} className="login-page__title">
            Sign in
          </Typography.Title>
          <Typography.Paragraph type="secondary">
            Sign in to check out and see your account.
          </Typography.Paragraph>

          {sessionWasExpired && !formError && (
            <Alert
              type="info"
              showIcon
              role="status"
              title="Your session has ended. Please sign in again."
              className="login-page__alert"
            />
          )}
          {formError && (
            <Alert
              type="error"
              showIcon
              role="alert"
              title={formError}
              className="login-page__alert"
            />
          )}

          <Form<LoginRequest>
            form={form}
            layout="vertical"
            requiredMark={false}
            disabled={signIn.isPending}
            onFinish={(values) => {
              // The button is disabled while pending. This guard also stops Enter-key repeats.
              if (signIn.isPending) return
              setFormError(null)
              signIn.mutate(values)
            }}
          >
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: 'Enter your email' },
                { type: 'email', message: 'Enter a valid email address' },
              ]}
            >
              <Input autoComplete="email" inputMode="email" />
            </Form.Item>
            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true, message: 'Enter your password' }]}
            >
              <Input.Password autoComplete="current-password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={signIn.isPending}>
              Sign in
            </Button>
          </Form>

          <Typography.Paragraph type="secondary" className="login-page__hint">
            Demo account: dev@bugbazaar.test / password123
          </Typography.Paragraph>
        </Card>
      </Col>
    </Row>
  )
}
