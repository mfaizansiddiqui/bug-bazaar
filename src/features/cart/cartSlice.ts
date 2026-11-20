import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Product } from '@/api/contract'

/**
 * One line in the cart. It keeps a snapshot of the product so the cart can render without
 * refetching. The server stays the source of truth for price and stock at checkout (a 409
 * comes back if stock has run out since).
 */
export interface CartLine {
  productId: string
  name: string
  price: number // integer cents
  imageUrl: string
  stock: number
  quantity: number
}

export interface CartState {
  lines: CartLine[]
  /**
   * Idempotency key for the current checkout attempt (D3-2). Created once when checkout
   * starts and reused by every retry, so the server can recognise a retry and return the
   * same order. Any change to the cart clears it: a different cart is a different order.
   */
  checkoutKey: string | null
}

export const initialCartState: CartState = { lines: [], checkoutKey: null }

function clampQuantity(quantity: number, stock: number): number {
  return Math.max(1, Math.min(Math.floor(quantity), stock))
}

const cartSlice = createSlice({
  name: 'cart',
  initialState: initialCartState,
  reducers: {
    addToCart(state, action: PayloadAction<{ product: Product; quantity: number }>) {
      const { product, quantity } = action.payload
      if (product.stock < 1 || quantity < 1) return
      const line = state.lines.find((item) => item.productId === product.id)
      if (line) {
        line.stock = product.stock
        line.price = product.price
        line.quantity = clampQuantity(line.quantity + quantity, product.stock)
      } else {
        state.lines.push({
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          stock: product.stock,
          quantity: clampQuantity(quantity, product.stock),
        })
      }
      state.checkoutKey = null
    },

    setQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const line = state.lines.find((item) => item.productId === action.payload.productId)
      if (!line) return
      line.quantity = clampQuantity(action.payload.quantity, line.stock)
      state.checkoutKey = null
    },

    removeFromCart(state, action: PayloadAction<string>) {
      state.lines = state.lines.filter((item) => item.productId !== action.payload)
      state.checkoutKey = null
    },

    /** New stock from the server (after a 409 or a refetch). Quantities above it shrink. */
    stockChanged(state, action: PayloadAction<{ productId: string; stock: number }>) {
      const line = state.lines.find((item) => item.productId === action.payload.productId)
      if (!line) return
      line.stock = action.payload.stock
      if (line.stock < 1) {
        state.lines = state.lines.filter((item) => item.productId !== line.productId)
      } else {
        line.quantity = clampQuantity(line.quantity, line.stock)
      }
      state.checkoutKey = null
    },

    checkoutStarted: {
      reducer(state, action: PayloadAction<string>) {
        // Keep an existing key: a retry of the same cart must reuse it.
        state.checkoutKey ??= action.payload
      },
      prepare: () => ({ payload: crypto.randomUUID() }),
    },

    clearCart() {
      return initialCartState
    },
  },
})

export const { addToCart, setQuantity, removeFromCart, stockChanged, checkoutStarted, clearCart } =
  cartSlice.actions
export const cartReducer = cartSlice.reducer

/* Selectors. The count and total are derived, never stored, so they can't drift from the lines. */

interface WithCart {
  cart: CartState
}

export const selectCartLines = (state: WithCart) => state.cart.lines
export const selectCheckoutKey = (state: WithCart) => state.cart.checkoutKey

export const selectCartCount = createSelector([selectCartLines], (lines) =>
  lines.reduce((count, line) => count + line.quantity, 0),
)

export const selectCartTotalCents = createSelector([selectCartLines], (lines) =>
  lines.reduce((total, line) => total + line.price * line.quantity, 0),
)

export const selectQuantityInCart = (state: WithCart, productId: string) =>
  state.cart.lines.find((line) => line.productId === productId)?.quantity ?? 0
