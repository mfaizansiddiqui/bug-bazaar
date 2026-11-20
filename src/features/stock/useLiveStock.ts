import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { connectLiveStock, liveStockUrl, type LiveStockStatus } from '@/api/liveStock'
import { useAppDispatch } from '@/app/hooks'
import { applyStockUpdate } from './applyStockUpdate'

/**
 * Keeps stock live while the app is open (D4-4). The effect opens the feed on mount, and
 * its cleanup stops it (closes the socket and cancels any reconnect) on unmount.
 */
export function useLiveStock(enabled: boolean): LiveStockStatus {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()
  const [status, setStatus] = useState<LiveStockStatus>('stopped')

  useEffect(() => {
    if (!enabled) return
    const feed = connectLiveStock({
      url: liveStockUrl(),
      onUpdate: (update) => {
        applyStockUpdate(queryClient, dispatch, update)
      },
      onStatus: setStatus,
    })
    return () => {
      feed.stop()
    }
  }, [enabled, queryClient, dispatch])

  return status
}
