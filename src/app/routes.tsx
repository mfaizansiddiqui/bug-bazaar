import type { RouteObject } from 'react-router'
import { NotFoundPage } from '@/components/NotFoundPage'
import { RouteErrorFallback } from '@/components/RouteErrorFallback'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { ProductListPage } from '@/features/products/ProductListPage'
import { App } from './App'

/**
 * Route table, shared by the browser router (main.tsx) and the memory router in tests.
 *
 * Code splitting (D4-2): only the home page (the product list) is in the main bundle.
 * Every other page is a `lazy` route, so its code downloads the first time it is visited,
 * and React Router loads it before rendering (no Suspense spinner needed).
 */
export function createRoutes({ showMockControls = false, liveStock = false } = {}): RouteObject[] {
  return [
    {
      path: '/',
      element: <App showMockControls={showMockControls} liveStock={liveStock} />,
      // A crash anywhere in the route tree shows the fallback and is logged (D4-7).
      errorElement: <RouteErrorFallback />,
      children: [
        { index: true, element: <ProductListPage /> },
        {
          path: 'products/:id',
          lazy: async () => ({
            Component: (await import('@/features/products/ProductDetailsPage')).ProductDetailsPage,
          }),
        },
        {
          path: 'cart',
          lazy: async () => ({ Component: (await import('@/features/cart/CartPage')).CartPage }),
        },
        {
          path: 'login',
          lazy: async () => ({ Component: (await import('@/features/auth/LoginPage')).LoginPage }),
        },
        {
          // Everything below needs a signed-in user.
          element: <RequireAuth />,
          children: [
            {
              path: 'account',
              lazy: async () => ({
                Component: (await import('@/features/auth/AccountPage')).AccountPage,
              }),
            },
            {
              path: 'checkout',
              lazy: async () => ({
                Component: (await import('@/features/cart/CheckoutPage')).CheckoutPage,
              }),
            },
            {
              path: 'orders/:id',
              lazy: async () => ({
                Component: (await import('@/features/orders/OrderConfirmationPage'))
                  .OrderConfirmationPage,
              }),
            },
          ],
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]
}
