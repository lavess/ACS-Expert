import { useEffect, useState } from 'react'
import { getQueue } from '@/services/offlineQueue'
import { useOnline } from './useOnline'
import type { SyncState } from '@/app/components/SideNav'

/**
 * Estado de sincronização agregado: online + tamanho da fila offline +
 * último sync conhecido. Re-checa a fila a cada 4s e quando a janela
 * volta ao foreground.
 *
 * TODO: ligar com API real quando o endpoint /api/sync/status estiver
 * disponível — por ora deriva apenas do navegador + IndexedDB local.
 */
export function useSyncStatus(): SyncState {
  const online = useOnline()
  const [pendingSync, setPendingSync] = useState(0)
  const [lastSyncAt, setLastSyncAt]   = useState<string>(() =>
    localStorage.getItem('acs:lastSyncAt') ?? new Date().toISOString()
  )

  // Atualiza tamanho da fila periodicamente
  useEffect(() => {
    let cancelado = false

    async function refresh() {
      try {
        const q = await getQueue()
        if (cancelado) return
        setPendingSync(q.length)
        if (online && q.length === 0) {
          const agora = new Date().toISOString()
          setLastSyncAt(agora)
          localStorage.setItem('acs:lastSyncAt', agora)
        }
      } catch {
        if (!cancelado) setPendingSync(0)
      }
    }

    refresh()
    const interval = window.setInterval(refresh, 4_000)
    const onFocus  = () => refresh()
    window.addEventListener('focus', onFocus)

    return () => {
      cancelado = true
      window.clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [online])

  return { online, pendingSync, lastSyncAt }
}
