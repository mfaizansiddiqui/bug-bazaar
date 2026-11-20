import { BugOutlined, LoginOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons'
import { Badge, Button, Flex, Typography } from 'antd'
import { Link, useNavigate } from 'react-router'
import { useAppSelector } from '@/app/hooks'
import { useLogout } from '@/features/auth/useLogout'
import { selectUser } from '@/features/auth/sessionSlice'
import { selectCartCount } from '@/features/cart/cartSlice'
import './app-header.scss'

/** Top bar: brand, cart badge (a derived value, D3-1), and the sign-in state. */
export function AppHeader() {
  const navigate = useNavigate()
  const cartCount = useAppSelector(selectCartCount)
  const user = useAppSelector(selectUser)
  const logout = useLogout()

  return (
    <Flex align="center" justify="space-between" gap="middle" className="app-header">
      <Link to="/" className="app-header__brand">
        <BugOutlined aria-hidden /> The Bug Bazaar
      </Link>

      <Flex component="nav" aria-label="Main" align="center" gap="small">
        <Link to="/" className="app-header__link">
          Shop
        </Link>
        {user ? (
          <>
            <Link to="/account" className="app-header__link">
              <UserOutlined aria-hidden /> {user.name}
            </Link>
            <Button type="text" onClick={logout}>
              Sign out
            </Button>
          </>
        ) : (
          <Button
            type="text"
            icon={<LoginOutlined />}
            onClick={() => {
              void navigate('/login')
            }}
          >
            Sign in
          </Button>
        )}
        <Link
          to="/cart"
          className="app-header__link app-header__cart"
          aria-label={`Cart, ${String(cartCount)} ${cartCount === 1 ? 'item' : 'items'}`}
        >
          <Badge count={cartCount} size="small" overflowCount={99}>
            <ShoppingCartOutlined className="app-header__cart-icon" />
          </Badge>
        </Link>
        <Typography.Text className="app-header__live" aria-live="polite">
          {cartCount > 0 ? `${String(cartCount)} in cart` : ''}
        </Typography.Text>
      </Flex>
    </Flex>
  )
}
