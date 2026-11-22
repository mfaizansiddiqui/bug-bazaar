import { z } from 'zod'

/**
 * Shared API contract (see docs/api-contract.md).
 * Zod schemas validate every payload at the boundary. The TypeScript types are
 * inferred from them, so the runtime check and the static type can't drift apart.
 * Prices are integer cents. Convert to currency only in the display layer.
 */

export const CATEGORIES = ['keyboards', 'ducks', 'coffee', 'stickers'] as const
export const CategorySchema = z.enum(CATEGORIES)
export type Category = z.infer<typeof CategorySchema>

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().int().nonnegative(),
  category: CategorySchema,
  stock: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  imageUrl: z.string(),
})
export type Product = z.infer<typeof ProductSchema>

export const ProductListSchema = z.object({
  items: z.array(ProductSchema),
  total: z.number().int().nonnegative(),
})
export type ProductList = z.infer<typeof ProductListSchema>

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.string(), z.string()).optional(),
  }),
})
export type ApiError = z.infer<typeof ApiErrorSchema>

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
})
export type User = z.infer<typeof UserSchema>

export const LoginResponseSchema = z.object({
  token: z.string(),
  user: UserSchema,
})
export type LoginResponse = z.infer<typeof LoginResponseSchema>

export const ORDER_STATUSES = ['queued', 'processing', 'confirmed', 'failed'] as const
export const OrderStatusSchema = z.enum(ORDER_STATUSES)
export type OrderStatus = z.infer<typeof OrderStatusSchema>

export const OrderSchema = z.object({
  id: z.string(),
  status: OrderStatusSchema,
})
export type Order = z.infer<typeof OrderSchema>

/**
 * Live stock message (D4-4). Pushed over the WebSocket at /api/stock. This channel is an
 * addition to the shared contract, documented in docs/api-contract.md.
 */
export const StockUpdateSchema = z.object({
  type: z.literal('stock'),
  productId: z.string(),
  stock: z.number().int().nonnegative(),
})
export type StockUpdate = z.infer<typeof StockUpdateSchema>

/* Request shapes */

export const PRODUCT_SORTS = ['relevance', 'price-asc', 'price-desc', 'rating', 'name'] as const
export type ProductSort = (typeof PRODUCT_SORTS)[number]

/** Fixed page size for GET /api/products (see docs/api-contract.md). */
export const PRODUCTS_PAGE_SIZE = 50

export interface ProductQuery {
  search?: string
  category?: Category
  /**
   * Extension to the shared contract, needed for the D2-2 availability filter.
   * true: only products with stock. false: only sold-out products. Absent: all products.
   */
  inStock?: boolean
  sort?: ProductSort
  page?: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface OrderItem {
  productId: string
  quantity: number
}

export interface CreateOrderRequest {
  items: OrderItem[]
}
