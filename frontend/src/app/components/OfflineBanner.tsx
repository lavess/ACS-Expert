/**
 * Faixa visual de status offline/sincronizando.
 *
 * - Offline:        faixa amarela fixa no topo
 * - Voltou online:  faixa verde por 3 s ("Sincronizando…" ou "Sincronizado")
 * - Pendentes:      faixa azul quando há itens na fila aguardando envio
 */
import { useEffect, useRef, useState } from 'react'
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from 'lucide-react'
import { useOnline } from '@/hooks/useOnline'
import { flushQueue, getQueue } from '@/services/offlineQueue'

type BannerState = 'hidden' | 'offline' | 'syncing' | 'synced' | 'pending'

export function OfflineBanner() {
  const online                  = useOnline()
  const [state, setState]       = useState<BannerState>('hidden')
  const [pendentes, setPendentes] = useState(0)
  const hideTimer               = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Atualiza contagem de pendentes
  async function refreshPending() {
    try {
      const q = await getQueue()
      setPendentes(q.length)
      return q.length
    } catch {
      return 0
    }
  }

  useEffect(() => {
    if (!online) {
      if (hideTimer.current) clearTimeout(hideTimer.current)
      setState('offline')
      return
    }

    // Voltou online
    setState('syncing')
    refreshPending().then(async (count) => {
      if (count > 0) {
        await flushQueue()
        const remaining = await refreshPending()
        setState(remaining === 0 ? 'synced' : 'pending')
      } else {
        setState('synced')
      }

      hideTimer.current = setTimeout(() => {
        setState((s) => (s === 'synced' ? 'hidden' : s))
      }, 3000)
    })
  }, [online])

  // Polling da fila quando online (detecta pendentes adicionados offline)
  useEffect(() => {
    if (!online) return
    const id = setInterval(async () => {
      const count = await refreshPending()
      if (count > 0) setState('pending')
    }, 5000)
    return () => clearInterval(id)
  }, [online])

  if (state === 'hidden') return null

  const configs = {
    offline: {
      bg:   'bg-acs-amar',
      text: 'text-acs-ink',
      icon: <WifiOff size={15} strokeWidth={2.2} />,
      msg:  'Você está offline — exibindo dados em cache',
    },
    syncing: {
      bg:   'bg-acs-azul',
      text: 'text-white',
      icon: <RefreshCw size={15} strokeWidth={2.2} className="animate-spin" />,
      msg:  pendentes > 0
        ? `Sincronizando ${pendentes} registro${pendentes > 1 ? 's' : ''}…`
        : 'Conexão restaurada…',
    },
    synced: {
      bg:   'bg-acs-verde',
      text: 'text-white',
      icon: <CheckCircle2 size={15} strokeWidth={2.2} />,
      msg:  'Dados sincronizados',
    },
    pending: {
      bg:   'bg-acs-azul-100',
      text: 'text-acs-azul',
      icon: <CloudUpload size={15} strokeWidth={2.2} />,
      msg:  `${pendentes} registro${pendentes > 1 ? 's' : ''} aguardando envio`,
    },
  }

  const cfg = configs[state]

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[100] ${cfg.bg} ${cfg.text} flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium shadow-md`}
    >
      {cfg.icon}
      <span>{cfg.msg}</span>
    </div>
  )
}
