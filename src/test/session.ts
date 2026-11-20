import { login, setAuthToken } from '@/api/client'
import type { AppStore } from '@/app/store'
import { signedIn } from '@/features/auth/sessionSlice'
import { DEMO_PASSWORD, DEMO_USER } from '@/mocks/db'

/** Signs the demo user in, the same way the login page does. */
export async function signInDemoUser(store: AppStore): Promise<void> {
  const session = await login({ email: DEMO_USER.email, password: DEMO_PASSWORD })
  setAuthToken(session.token)
  store.dispatch(signedIn(session.user))
}
