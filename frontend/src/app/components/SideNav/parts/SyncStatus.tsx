import { Wifi, WifiOff } from 'lucide-react'
import type { Layout, SyncState } from '../types'

interface Props {
  sync:   SyncState
  layout: Layout
}

function relativo(iso: string): string {
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return ''
  const sec = Math.floor((Date.now() - ts) / 1000)
  if (sec < 30)        return 'agora'
  if (sec < 90)        return 'há 1 min'
  if (sec < 3_600)     return `há ${Math.floor(sec / 60)} min`
  if (sec < 7_200)     return 'há 1 h'
  if (sec < 86_400)    return `há ${Math.floor(sec / 3_600)} h`
  return `há ${Math.floor(sec / 86_400)} d`
}

export function SyncStatus({ sync, layout }: Props) {
  const isMobile = layout === 'mobile'
  const semConexao   = !sync.online
  const temPendentes = sync.pendingSync > 0
  const tone = semConexao || temPendentes ? 'amar' : 'verde'

  const titulo = semConexao
    ? 'Sem conexão'
    : 'Conectado'

  const detalhe = semConexao
    ? (temPendentes ? `${sync.pendingSync} envios pendentes` : 'Reconectando…')
    : (temPendentes
      ? `${sync.pendingSync} envios pendentes · ${relativo(sync.lastSyncAt)}`
      : `Sincronizado · ${relativo(sync.lastSyncAt)}`)

  return (
    <div
      className={`flex items-center gap-2.5 border-t border-acs-line ${
        isMobile ? 'px-5 py-2.5' : 'px-3.5 py-2.5'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0 ${
          tone === 'verde'
            ? 'bg-acs-verde-100 text-acs-verde-700'
            : 'bg-acs-amar-100 text-acs-amar-700'
        }`}
        aria-hidden="true"
      >
        {sync.online
          ? <Wifi size={14} strokeWidth={2.2} />
          : <WifiOff size={14} strokeWidth={2.2} />}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[12px] font-semibold text-acs-ink"
          style={{ letterSpacing: '-0.005em' }}
        >
          {titulo}
        </div>
        <div className="font-mono text-[10px] text-acs-ink-3 mt-0.5 tracking-[.04em]">
          {detalhe}
        </div>
      </div>
      {temPendentes && (
        <span
          aria-hidden="true"
          className={`w-2 h-2 rounded-full flex-shrink-0 ${
            tone === 'verde' ? 'bg-acs-verde' : 'bg-acs-amar'
          }`}
        />
      )}
    </div>
  )
}
