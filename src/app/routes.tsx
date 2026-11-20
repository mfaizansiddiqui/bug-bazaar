import type { RouteObject } from 'react-router'
import { NotFoundPage } from '@/components/NotFoundPage'
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
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]
}
