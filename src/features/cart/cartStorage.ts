import { z } from 'zod'
import { initialCartState, type CartState } from './cartSlice'

/**
 * Cart persistence (D3-2: "the cart survives a reload"). The cart isn't a credential, so
 * localStorage is fine for it (unlike the auth token, see docs/auth.md).
 *
 * What comes back from storage is untrusted (old versions, hand edits), so it is validated
 * with Zod. Anything invalid falls back to an empty cart instead of crashing the app.
 */

const STORAGE_KEY = 'bug-bazaar:cart'

const CartStateSchema = z.object({
  lines: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      price: z.number().int().nonnegative(),
      imageUrl: z.string(),
      stock: z.number().int().nonnegative(),
      quantity: z.number().int().positive(),
    }),
  ),
  checkoutKey: z.string().nullable(),
})

export function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialCartState
    const parsed = CartStateSchema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : initialCartState
  } catch {
    return initialCartState
  }
}

export function saveCart(cart: CartState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
  } catch {
    // Storage full or blocked (private mode): the cart still works for this visit.
  }
}
