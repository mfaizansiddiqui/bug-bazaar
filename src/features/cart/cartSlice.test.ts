import { describe, expect, it } from 'vitest'
import type { Product } from '@/api/contract'
import {
  addToCart,
  cartReducer,
  checkoutStarted,
  initialCartState,
  removeFromCart,
  selectCartCount,
  selectCartTotalCents,
  setQuantity,
  stockChanged,
  type CartState,
} from './cartSlice'

const duck: Product = {
  id: 'p-1',
  name: 'Debugging Duck',
  price: 1299,
  category: 'ducks',
  stock: 3,
  rating: 4.5,
  imageUrl: '/images/ducks.svg',
}
const coffee: Product = { ...duck, id: 'p-2', name: 'Espresso', price: 550, stock: 10 }

function cartWith(...actions: Parameters<typeof cartReducer>[1][]): CartState {
  return actions.reduce(cartReducer, initialCartState)
}

describe('cart logic', () => {
  it('derives the item count and total in cents from the lines', () => {
    const cart = cartWith(
      addToCart({ product: duck, quantity: 2 }),
      addToCart({ product: coffee, quantity: 3 }),
    )
    expect(selectCartCount({ cart })).toBe(5)
    expect(selectCartTotalCents({ cart })).toBe(2 * 1299 + 3 * 550)
  })

  it('never lets a quantity exceed stock, when adding or when editing', () => {
    let cart = cartWith(
      addToCart({ product: duck, quantity: 2 }),
      addToCart({ product: duck, quantity: 5 }),
    )
    expect(cart.lines[0]?.quantity).toBe(3)

    cart = cartReducer(cart, setQuantity({ productId: duck.id, quantity: 99 }))
    expect(cart.lines[0]?.quantity).toBe(3)
    cart = cartReducer(cart, setQuantity({ productId: duck.id, quantity: 0 }))
    expect(cart.lines[0]?.quantity).toBe(1)
  })

  it('ignores out-of-stock products and removes lines', () => {
    const cart = cartWith(
      addToCart({ product: { ...duck, stock: 0 }, quantity: 1 }),
      addToCart({ product: coffee, quantity: 1 }),
      removeFromCart(coffee.id),
    )
    expect(cart.lines).toEqual([])
  })

  it('shrinks or drops a line when the server reports less stock', () => {
    let cart = cartWith(addToCart({ product: coffee, quantity: 8 }))
    cart = cartReducer(cart, stockChanged({ productId: coffee.id, stock: 2 }))
    expect(cart.lines[0]?.quantity).toBe(2)
    cart = cartReducer(cart, stockChanged({ productId: coffee.id, stock: 0 }))
    expect(cart.lines).toEqual([])
  })

  it('keeps one checkout key across retries, and resets it when the cart changes', () => {
    let cart = cartWith(addToCart({ product: duck, quantity: 1 }), checkoutStarted())
    const firstKey = cart.checkoutKey
    expect(firstKey).toEqual(expect.any(String))

    cart = cartReducer(cart, checkoutStarted())
    expect(cart.checkoutKey).toBe(firstKey)

    cart = cartReducer(cart, setQuantity({ productId: duck.id, quantity: 2 }))
    expect(cart.checkoutKey).toBeNull()
  })
})
