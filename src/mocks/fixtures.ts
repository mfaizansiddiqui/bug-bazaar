import type { Product, User } from '@/api/contract'

/**
 * Small fixed dataset for tests and the API seam.
 * The 5,000-product seed and error triggers come in D1-2.
 */
export const fixtureProducts: Product[] = [
  {
    id: 'p-1',
    name: 'Debugging Duck',
    price: 1299,
    category: 'ducks',
    stock: 12,
    rating: 4.8,
    imageUrl: '/images/duck.png',
  },
  {
    id: 'p-2',
    name: 'Clicky Mechanical Keyboard',
    price: 8999,
    category: 'keyboards',
    stock: 1,
    rating: 4.5,
    imageUrl: '/images/keyboard.png',
  },
  {
    id: 'p-3',
    name: 'Stack Trace Espresso',
    price: 1550,
    category: 'coffee',
    stock: 0,
    rating: 4.2,
    imageUrl: '/images/coffee.png',
  },
]

export const fixtureUser: User = { id: 'u-1', email: 'dev@bugbazaar.test', name: 'Dev User' }
export const FIXTURE_PASSWORD = 'password123'
export const FIXTURE_TOKEN = 'mock-token-u-1'
