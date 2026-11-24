import type { z } from 'zod'
import {
  ApiErrorSchema,
  LoginResponseSchema,
  OrderSchema,
  ProductListSchema,
  ProductSchema,
  UserSchema,
  type CreateOrderRequest,
  type LoginRequest,
  type LoginResponse,
  type Order,
  type Product,
  type ProductList,
  type ProductQuery,
  type User,
} from './contract'

/**
 * The only module in the app that calls fetch.
 * Components and hooks call the typed functions at the bottom of this file.
 */

/**
 * Where the API lives. By default it sits inside the app's own folder: `/api` locally,
 * `/bug-bazaar/api` on GitHub Pages. VITE_API_BASE_URL overrides it for a real backend.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? `${import.meta.env.BASE_URL}api`
const BASE_URL = API_BASE_URL

export type ApiErrorKind =
  | 'validation' // 400
  | 'unauthorized' // 401
  | 'notFound' // 404
  | 'conflict' // 409
  | 'server' // 5xx and unexpected statuses
  | 'network' // the request never got a response
  | 'invalidResponse' // the response did not match the contract

export class ApiClientError extends Error {
  readonly kind: ApiErrorKind
  readonly status: number | null
  readonly code: string
  readonly details: Readonly<Record<string, string>>

  constructor(args: {
    kind: ApiErrorKind
    status: number | null
    code: string
    details?: Record<string, string> | undefined
  }) {
    // Generic message on purpose: raw server text never reaches the UI or the logs.
    super(`API request failed (${args.kind}${args.status === null ? '' : `, ${args.status}`})`)
    this.name = 'ApiClientError'
    this.kind = args.kind
    this.status = args.status
    this.code = args.code
    this.details = args.details ?? {}
  }
}

export function isApiClientError(value: unknown): value is ApiClientError {
  return value instanceof ApiClientError
}

function kindFromStatus(status: number): ApiErrorKind {
  switch (status) {
    case 400:
      return 'validation'
    case 401:
      return 'unauthorized'
    case 404:
      return 'notFound'
    case 409:
      return 'conflict'
    default:
      return 'server'
  }
}

/* Auth token: kept in memory only, never in localStorage (see docs/auth.md). */

let authToken: string | null = null
let unauthorizedListener: (() => void) | null = null

export function setAuthToken(token: string | null): void {
  authToken = token
}

/** Registered once by the session layer, so every 401 clears the session in one place. */
export function onUnauthorized(listener: (() => void) | null): void {
  unauthorizedListener = listener
}

interface RequestOptions<S extends z.ZodType> {
  method?: 'GET' | 'POST'
  body?: unknown
  schema: S
  signal?: AbortSignal | undefined
  headers?: Record<string, string>
}

async function request<S extends z.ZodType>(
  path: string,
  { method = 'GET', body, schema, signal, headers = {} }: RequestOptions<S>,
): Promise<z.infer<S>> {
  const finalHeaders: Record<string, string> = { Accept: 'application/json', ...headers }
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json'
  if (authToken !== null) finalHeaders.Authorization = `Bearer ${authToken}`

  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? null : JSON.stringify(body),
      signal: signal ?? null,
    })
  } catch (error) {
    // Rethrow aborts so callers can tell "I cancelled this" apart from a network failure.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiClientError({ kind: 'network', status: null, code: 'NETWORK_ERROR' })
  }

  const json: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const parsed = ApiErrorSchema.safeParse(json)
    const error = new ApiClientError({
      kind: kindFromStatus(response.status),
      status: response.status,
      code: parsed.success ? parsed.data.error.code : 'UNKNOWN_ERROR',
      details: parsed.success ? parsed.data.error.details : undefined,
    })
    if (error.kind === 'unauthorized') unauthorizedListener?.()
    throw error
  }

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw new ApiClientError({
      kind: 'invalidResponse',
      status: response.status,
      code: 'INVALID_RESPONSE',
    })
  }
  return parsed.data
}

function toSearchParams(query: ProductQuery): string {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  if (query.category) params.set('category', query.category)
  if (query.inStock !== undefined) params.set('inStock', String(query.inStock))
  if (query.sort) params.set('sort', query.sort)
  if (query.page !== undefined) params.set('page', String(query.page))
  if (query.pageSize !== undefined) params.set('pageSize', String(query.pageSize))
  const text = params.toString()
  return text ? `?${text}` : ''
}

/* Typed endpoints: one function per row of the contract. */

export function getProducts(query: ProductQuery = {}, signal?: AbortSignal): Promise<ProductList> {
  return request(`/products${toSearchParams(query)}`, { schema: ProductListSchema, signal })
}

export function getProduct(id: string, signal?: AbortSignal): Promise<Product> {
  return request(`/products/${encodeURIComponent(id)}`, { schema: ProductSchema, signal })
}

export function login(credentials: LoginRequest): Promise<LoginResponse> {
  return request('/login', { method: 'POST', body: credentials, schema: LoginResponseSchema })
}

export function getMe(signal?: AbortSignal): Promise<User> {
  return request('/me', { schema: UserSchema, signal })
}

/**
 * The caller generates the idempotency key once per checkout attempt and reuses it on
 * retries, so a retried request returns the same order instead of creating a second one.
 */
export function createOrder(order: CreateOrderRequest, idempotencyKey: string): Promise<Order> {
  return request('/orders', {
    method: 'POST',
    body: order,
    schema: OrderSchema,
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}

export function getOrder(id: string, signal?: AbortSignal): Promise<Order> {
  return request(`/orders/${encodeURIComponent(id)}`, { schema: OrderSchema, signal })
}
