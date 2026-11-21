import { LoginOutlined, ShoppingCartOutlined, UserOutlined } from '@ant-design/icons'
import { Badge, Button, Flex, Grid, Tag, Typography } from 'antd'
import { Link, useNavigate } from 'react-router'
import type { LiveStockStatus } from '@/api/liveStock'
import { useAppSelector } from '@/app/hooks'
import { BrandLogo } from '@/components/BrandLogo'
import { useLogout } from '@/features/auth/useLogout'
import { selectUser } from '@/features/auth/sessionSlice'
import { selectCartCount } from '@/features/cart/cartSlice'
import './app-header.scss'

const LIVE_TAG: Record<Exclude<LiveStockStatus, 'stopped'>, { color: string; label: string }> = {
  connecting: { color: 'default', label: 'Connecting…' },
  live: { color: 'success', label: 'Live stock' },
  reconnecting: { color: 'warning', label: 'Reconnecting…' },
}

interface AppHeaderProps {
  /** Live stock feed status, or null when the feed is off. */
  liveStatus: LiveStockStatus | null
}

/** Top bar: brand, live stock status, cart badge (a derived value, D3-1), sign-in state. */
export function AppHeader({ liveStatus }: AppHeaderProps) {
  const navigate = useNavigate()
  const cartCount = useAppSelector(selectCartCount)
  const user = useAppSelector(selectUser)
  const logout = useLogout()
  const screens = Grid.useBreakpoint()
  const liveTag = liveStatus && liveStatus !== 'stopped' ? LIVE_TAG[liveStatus] : null

  return (
    <Flex align="center" justify="space-between" gap="middle" className="app-header">
      <Flex align="center" gap="middle">
        <Link to="/" className="app-header__brand" aria-label="The Bug Bazaar, home">
          <BrandLogo compact={!screens.sm} />
        </Link>
        {liveTag && screens.sm && (
          <Tag
            color={liveTag.color}
            variant={liveTag.color === 'default' ? 'outlined' : 'solid'}
            className="app-header__live-tag"
            role="status"
          >
            {liveTag.label}
          </Tag>
        )}
      </Flex>

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
