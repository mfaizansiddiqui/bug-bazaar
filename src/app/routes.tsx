import type { RouteObject } from 'react-router'
import { NotFoundPage } from '@/components/NotFoundPage'
import { RouteErrorFallback } from '@/components/RouteErrorFallback'
import { AccountPage } from '@/features/auth/AccountPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { CartPage } from '@/features/cart/CartPage'
import { CheckoutPage } from '@/features/cart/CheckoutPage'
import { OrderConfirmationPage } from '@/features/orders/OrderConfirmationPage'
import { ProductDetailsPage } from '@/features/products/ProductDetailsPage'
import { ProductListPage } from '@/features/products/ProductListPage'
import { App } from './App'

/** Route table, shared by the browser router (main.tsx) and the memory router in tests. */
export function createRoutes({ showMockControls = false, liveStock = false } = {}): RouteObject[] {
  return [
    {
      path: '/',
      element: <App showMockControls={showMockControls} liveStock={liveStock} />,
      // A crash anywhere in the route tree shows the fallback and is logged (D4-7).
      errorElement: <RouteErrorFallback />,
      children: [
        { index: true, element: <ProductListPage /> },
        { path: 'products/:id', element: <ProductDetailsPage /> },
        { path: 'cart', element: <CartPage /> },
        { path: 'login', element: <LoginPage /> },
        {
          // Everything below needs a signed-in user.
          element: <RequireAuth />,
          children: [
            { path: 'account', element: <AccountPage /> },
            { path: 'checkout', element: <CheckoutPage /> },
            { path: 'orders/:id', element: <OrderConfirmationPage /> },
          ],
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]
}
