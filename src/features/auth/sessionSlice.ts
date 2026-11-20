import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/api/contract'

/**
 * Who is signed in. The token itself is NOT stored here: it lives only in the API client's
 * memory (setAuthToken), so Redux DevTools, logs and persisted state never contain it.
 */
export interface SessionState {
  user: User | null
  /** True when the server ended the session (a 401), so login can explain why. */
  expired: boolean
}

const initialState: SessionState = { user: null, expired: false }

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<User>) {
      state.user = action.payload
      state.expired = false
    },
    /** The user chose to sign out. */
    signedOut(state) {
      state.user = null
      state.expired = false
    },
    /** The server answered 401: the token is missing, wrong or expired. */
    sessionExpired(state) {
      state.expired = state.user !== null
      state.user = null
    },
  },
})

export const { signedIn, signedOut, sessionExpired } = sessionSlice.actions
export const sessionReducer = sessionSlice.reducer

export const selectUser = (state: { session: SessionState }) => state.session.user
export const selectIsSignedIn = (state: { session: SessionState }) => state.session.user !== null
export const selectSessionExpired = (state: { session: SessionState }) => state.session.expired
