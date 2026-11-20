import { combineReducers, configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { onUnauthorized, setAuthToken } from '@/api/client'
import { sessionExpired, sessionReducer } from '@/features/auth/sessionSlice'
import { cartReducer } from '@/features/cart/cartSlice'
import { loadCart, saveCart } from '@/features/cart/cartStorage'

const rootReducer = combineReducers({ cart: cartReducer, session: sessionReducer })
export type AppState = ReturnType<typeof rootReducer>

/**
 * Global client state (D3-1): the cart and the session. Server data (products, orders) is
 * not here. It lives in the TanStack Query cache. State only changes through the slice
 * actions, and Redux Toolkit's dev checks catch accidental mutation outside reducers.
 */
export function createAppStore() {
  const persistence = createListenerMiddleware()
  const startAppListening = persistence.startListening.withTypes<AppState>()

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: { cart: loadCart() },
    middleware: (getDefault) => getDefault().prepend(persistence.middleware),
  })

  // Save the cart whenever it changes, and only then.
  startAppListening({
    predicate: (_action, current, previous) => current.cart !== previous.cart,
    effect: (_action, api) => {
      saveCart(api.getState().cart)
    },
  })

  // Any 401 from any request clears the session in one place (D3-3, D3-4).
  onUnauthorized(() => {
    setAuthToken(null)
    store.dispatch(sessionExpired())
  })

  return store
}

export type AppStore = ReturnType<typeof createAppStore>
export type AppDispatch = AppStore['dispatch']
