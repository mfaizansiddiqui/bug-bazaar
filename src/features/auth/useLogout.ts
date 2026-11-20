import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { setAuthToken } from '@/api/client'
import { useAppDispatch } from '@/app/hooks'
import { signedOut } from './sessionSlice'

/** Signs out: forgets the in-memory token, clears the session and any per-user cached data. */
export function useLogout() {
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useCallback(() => {
    setAuthToken(null)
    dispatch(signedOut())
    queryClient.removeQueries({ queryKey: ['me'] })
    queryClient.removeQueries({ queryKey: ['orders'] })
    void navigate('/')
  }, [dispatch, queryClient, navigate])
}
