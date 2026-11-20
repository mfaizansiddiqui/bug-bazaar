import type { RouteObject } from 'react-router'
import { NotFoundPage } from '@/components/NotFoundPage'
import { AccountPage } from '@/features/auth/AccountPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { RequireAuth } from '@/features/auth/RequireAuth'
import { ProductDetailsPage } from '@/features/products/ProductDetailsPage'
import { ProductListPage } from '@/features/products/ProductListPage'
import { App } from './App'

/** Route table, shared by the browser router (main.tsx) and the memory router in tests. */
export function createRoutes({ showMockControls = false } = {}): RouteObject[] {
  return [
    {
      path: '/',
      element: <App showMockControls={showMockControls} />,
      children: [
        { index: true, element: <ProductListPage /> },
        { path: 'products/:id', element: <ProductDetailsPage /> },
        { path: 'login', element: <LoginPage /> },
        {
          // Everything below needs a signed-in user.
          element: <RequireAuth />,
          children: [{ path: 'account', element: <AccountPage /> }],
        },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]
}
