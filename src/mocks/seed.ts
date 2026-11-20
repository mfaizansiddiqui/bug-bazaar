import { CATEGORIES, type Category, type Product } from '@/api/contract'

export const PRODUCT_COUNT = 5000

/** Image path under the deploy base: /images/x.svg locally, /bug-bazaar/images/x.svg on Pages. */
function imageFor(category: Category): string {
  return `${import.meta.env.BASE_URL}images/${category}.svg`
}

/**
 * mulberry32: a tiny seeded PRNG. The same seed always gives the same 5,000 products,
 * so links, screenshots and tests stay stable across reloads.
 */
function createRandom(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NAME_PARTS: Record<
  Category,
  { adjectives: string[]; nouns: string[]; priceCents: [number, number] }
> = {
  keyboards: {
    adjectives: ['Clicky', 'Silent', 'Tactile', 'Wireless', 'Compact', 'Split', 'Retro', 'RGB'],
    nouns: ['Mechanical Keyboard', 'Keypad', 'TKL Board', '60% Board', 'Macro Pad', 'Ergo Board'],
    priceCents: [3999, 24999],
  },
  ducks: {
    adjectives: ['Debugging', 'Rubber', 'Pirate', 'Senior', 'Junior', 'Golden', 'Ninja', 'Zen'],
    nouns: ['Duck', 'Duckling', 'Duck Pair', 'Desk Duck', 'Duck Squad'],
    priceCents: [499, 2999],
  },
  coffee: {
    adjectives: ['Stack Trace', 'Late Night', 'Hotfix', 'Deploy Day', 'Legacy', 'Async'],
    nouns: ['Espresso', 'Cold Brew', 'Dark Roast', 'Beans', 'Drip Pack', 'Mug'],
    priceCents: [899, 3499],
  },
  stickers: {
    adjectives: ['It Works On My Machine', 'Null Pointer', '404', 'Semicolon', 'Merge Conflict'],
    nouns: ['Sticker', 'Sticker Pack', 'Laptop Decal', 'Holo Sticker'],
    priceCents: [199, 1299],
  },
}

function pick<T>(items: readonly T[], random: () => number): T {
  const item = items[Math.floor(random() * items.length)]
  if (item === undefined) throw new Error('pick() called with an empty list')
  return item
}

export function seedProducts(seed = 42): Product[] {
  const random = createRandom(seed)
  const products: Product[] = []

  for (let index = 1; index <= PRODUCT_COUNT; index += 1) {
    const category = pick(CATEGORIES, random)
    const parts = NAME_PARTS[category]
    const [minPrice, maxPrice] = parts.priceCents
    // About 1 in 10 products is out of stock, so the in-stock filter has something to hide.
    const stock = random() < 0.1 ? 0 : Math.floor(random() * 50) + 1

    products.push({
      id: `p-${String(index).padStart(4, '0')}`,
      name: `${pick(parts.adjectives, random)} ${pick(parts.nouns, random)} #${String(index)}`,
      price: Math.round(minPrice + random() * (maxPrice - minPrice)),
      category,
      stock,
      rating: Math.round((2.5 + random() * 2.5) * 10) / 10,
      imageUrl: imageFor(category),
    })
  }

  // Fixed demo product for the 409 path: only one left, so ordering two triggers OUT_OF_STOCK.
  products[0] = {
    id: 'p-0001',
    name: 'Last-One Debugging Duck',
    price: 1299,
    category: 'ducks',
    stock: 1,
    rating: 4.9,
    imageUrl: imageFor('ducks'),
  }
  return products
}
