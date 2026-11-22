# API contract

The shared contract every task builds against. The mock in `src/mocks/` implements it, and the Zod schemas in `src/api/contract.ts` check every response at runtime.

- Base URL: `/api` (`VITE_API_BASE_URL`)
- Bodies are JSON. Requests with a body send `Content-Type: application/json`.
- **Prices are integer cents.** `1299` means $12.99. Convert only for display.
- Authenticated endpoints need `Authorization: Bearer <token>`.

## Types

```ts
type Product = {
  id: string
  name: string
  price: number // integer cents
  category: 'keyboards' | 'ducks' | 'coffee' | 'stickers'
  stock: number // integer, 0 = out of stock
  rating: number // 0–5
  imageUrl: string
}

type User = { id: string; email: string; name: string }

type OrderStatus = 'queued' | 'processing' | 'confirmed' | 'failed'

type ApiError = {
  error: {
    code: string // machine-readable, e.g. "OUT_OF_STOCK"
    message: string // for logs only, never shown to users
    details?: Record<string, string> // field errors (400) or the failing item (409)
  }
}
```

`User` and the order statuses beyond `"queued"` aren't spelled out in the brief. The shapes above are this project's definition.

## Endpoints

| Method | Endpoint                                      | Success                                   | Errors                          |
| ------ | --------------------------------------------- | ----------------------------------------- | ------------------------------- |
| GET    | `/api/products?search=&category=&sort=&page=` | 200 `{ items: Product[], total: number }` | 500                             |
| GET    | `/api/products/:id`                           | 200 `Product`                             | 404                             |
| POST   | `/api/login`                                  | 200 `{ token, user }`                     | 400, 401                        |
| GET    | `/api/me`                                     | 200 `User`                                | 401                             |
| POST   | `/api/orders`                                 | 201 `{ id, status: "queued" }`            | 400, 401, 409 when out of stock |
| GET    | `/api/orders/:id`                             | 200 `{ id, status }`                      | 401, 404                        |

### GET /api/products

| Param      | Values                                                                         | Default     |
| ---------- | ------------------------------------------------------------------------------ | ----------- |
| `search`   | Text matched against the name, case-insensitive                                | none        |
| `category` | `keyboards`, `ducks`, `coffee`, `stickers`                                     | all         |
| `sort`     | `relevance`, `price-asc`, `price-desc`, `rating` (highest first), `name` (A–Z) | `relevance` |
| `page`     | 1-based page number. The page size is fixed at **50**.                         | `1`         |
| `inStock`  | `true`: only products with stock. `false`: only products with `stock: 0`       | off (all)   |

`total` is the number of matching products across all pages. `inStock` **is an addition to the shared contract**, needed for the D2-2 availability filter (in stock / out of stock) so the server can filter before paging (see `docs/decisions.md`).

```json
// GET /api/products?category=ducks&sort=price-asc&page=1
{
  "items": [
    {
      "id": "p-0042",
      "name": "Zen Duck #42",
      "price": 512,
      "category": "ducks",
      "stock": 7,
      "rating": 4.3,
      "imageUrl": "/images/ducks.svg"
    }
  ],
  "total": 1243
}
```

### GET /api/products/:id

- 200: the `Product`.
- 404: `{ "error": { "code": "PRODUCT_NOT_FOUND", "message": "Product not found" } }`

### POST /api/login

Request: `{ "email": string, "password": string }`

- 200: `{ "token": string, "user": User }`
- 400: a field is missing. `details` maps each field to its error: `{ "error": { "code": "VALIDATION_ERROR", "message": "Missing fields", "details": { "email": "Email is required" } } }`
- 401: wrong email or password, code `INVALID_CREDENTIALS`.

### GET /api/me

- 200: the signed-in `User`.
- 401: missing or unknown token, code `UNAUTHORIZED`.

### POST /api/orders

Headers: `Authorization`, and **`Idempotency-Key: <uuid>`**, generated once per checkout attempt and reused on retries.

Request: `{ "items": [{ "productId": string, "quantity": number }] }`

- 201: `{ "id": "o-1", "status": "queued" }`. Stock is reduced for every line.
- **Repeat with the same `Idempotency-Key`**: 201 with the _same_ order. Nothing is created twice and stock isn't reduced twice.
- 400: no items, an unknown product, a quantity below 1, or a missing `Idempotency-Key`. Code `VALIDATION_ERROR` or `MISSING_IDEMPOTENCY_KEY`.
- 401: not signed in.
- 409: a line asks for more than is in stock. `details` names the item: `{ "error": { "code": "OUT_OF_STOCK", "message": "Out of stock", "details": { "productId": "p-0001", "name": "Last-One Debugging Duck" } } }`. Stock isn't changed for any line.

### GET /api/orders/:id

- 200: `{ "id", "status" }`. In the mock, the status moves from `queued` to `processing` after 2 s and to `confirmed` after 5 s.
- 401: not signed in. 404: unknown order, code `ORDER_NOT_FOUND`.

### WebSocket /api/stock (live stock, D4-4)

**An addition to the shared contract.** The brief asks for live stock, and no listed endpoint pushes data.

- URL: `ws(s)://<host>/api/stock`, next to the REST base. No auth: stock is public.
- Server → client messages, one per change: `{ "type": "stock", "productId": "p-0007", "stock": 12 }`
- The client ignores anything that fails the `StockUpdateSchema` check.
- The mock pushes a change every 2 s for one of the first 60 products and writes it to the mock database, so REST and the feed agree. **Mock panel → Drop live stock connection** closes the socket server-side, to show the client reconnecting.

## Error handling in the app

`src/api/client.ts` turns every non-2xx response into an `ApiClientError` with a `kind`:

| Status           | `kind`            | What the UI does (D3-4)                            |
| ---------------- | ----------------- | -------------------------------------------------- |
| 400              | `validation`      | Show `details` as form field errors                |
| 401              | `unauthorized`    | Clear the session and sign out                     |
| 404              | `notFound`        | Show the Not Found page                            |
| 409              | `conflict`        | Show an out-of-stock message naming `details.name` |
| 5xx              | `server`          | Show a retry option                                |
| none             | `network`         | Show a retry option                                |
| 2xx, wrong shape | `invalidResponse` | Treat as a server error                            |

The `message` from the server is never shown on screen.

## Mock API: triggering every case on purpose

The mock runs in the browser through MSW and holds **5,000 products** generated from a fixed seed, so the data is the same on every load. Stock and orders reset when the page reloads.

**Mock controls panel** (the "Mock" button, bottom-left, shown whenever the mock is on):

- **Force an error on** a route with any of its documented statuses: products 500, product 404, login 400/401, me 401, create order 400/401/409, order 401/404.
- **Latency:** `None`, `Slow` (1.5 s, for loading states), or `Random` (100–1500 ms, so responses arrive **out of order** for the D2-6 race).

**Natural triggers** (no panel needed):

| Case            | How                                     |
| --------------- | --------------------------------------- |
| 404 product     | Open `/products/does-not-exist`         |
| 400 login       | Submit an empty field                   |
| 401 login       | Use a wrong password                    |
| 401 me / orders | Call while signed out                   |
| 409 order       | Order 2 of `p-0001` (it has 1 in stock) |
| 400 order       | Send an empty cart                      |
| 404 order       | Open an unknown order id                |

Demo account: `dev@bugbazaar.test` / `password123`.
