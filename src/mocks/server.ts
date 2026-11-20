import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** MSW server for Vitest (Node). The browser worker is added in D1-2. */
export const server = setupServer(...handlers)
