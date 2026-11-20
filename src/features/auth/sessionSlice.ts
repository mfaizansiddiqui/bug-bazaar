import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { User } from '@/api/contract'

/**
 * Who is signed in. The token itself is NOT stored here: it lives only in the API client's
 * memory (setAuthToken), so Redux DevTools, logs and persisted state never contain it.
 */
export interface SessionState {
  user: User | null
}

const initialState: SessionState = { user: null }

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    signedIn(state, action: PayloadAction<User>) {
      state.user = action.payload
    },
    signedOut(state) {
      state.user = null
    },
  },
})

export const { signedIn, signedOut } = sessionSlice.actions
export const sessionReducer = sessionSlice.reducer

export const selectUser = (state: { session: SessionState }) => state.session.user
export const selectIsSignedIn = (state: { session: SessionState }) => state.session.user !== null
