import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Home, Search, RotateCcw, AlertTriangle, Loader2, ClipboardList, Activity } from 'lucide-react'
import { visitasService, TIPO_VISITA_LABEL, VISITA_FLAGS, type VisitaAPI, type TipoVisita } from '@/services/visitasService'

interface Props {
  pacienteId: number
  /** Chave para forçar recarregamento quando uma nova visita é registrada */
  refreshKey?: number
}

const TIPO_ICON: Record<TipoVisita, React.ElementType> = {
  rotina:      Home,
  busca_ativa: Search,
  retorno:     RotateCcw,
  urgencia:    AlertTriangle,
}

const TIPO_COR: Record<TipoVisita, string> = {
  rotina:      'var(--acs-azul)',
  busca_ativa: 'var(--acs-verde)',
  retorno:     '#8B5CF6',
  urgencia:    'var(--acs-vermelho)',
}

function fmtDataHora(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function HistoricoVisitas({ pacienteId, refreshKey }: Props) {
  const navigate  = useNavigate()
  const [visitas, setVisitas] = useState<VisitaAPI[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false
    setLoading(true)
    visitasService.listar(pacienteId)
      .then(({ data }) => { if (!cancelado) setVisitas(data) })
      .catch(() => {})
      .finally(() => { if (!cancelado) setLoading(false) })
    return () => { cancelado = true }
  }, [pacienteId, refreshKey])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-acs-ink-3 gap-2">
        <Loader2 size={16} className="animate-spin" />
        <span className="text-sm">Carregando visitas…</span>
      </div>
    )
  }

  if (visitas.length === 0) {
    return (
      <div className="text-center py-8">
        <ClipboardList size={32} className="text-acs-ink-4 mx-auto mb-2" strokeWidth={1.4} />
        <p className="text-sm text-acs-ink-3">Nenhuma visita registrada.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Linha do tempo */}
      <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-acs-paper-2" />

      <div className="space-y-3">
        {visitas.map((v) => {
          const Icon = TIPO_ICON[v.tipo_visita]
          const cor  = TIPO_COR[v.tipo_visita]
          return (
            <div key={v.id} className="relative flex gap-3 pl-1">
              {/* Dot */}
              <div
                className="w-[38px] h-[38px] rounded-full flex items-center justify-center flex-shrink-0 z-10"
                style={{ backgroundColor: cor + '18' }}
              >
                <Icon size={16} strokeWidth={1.8} style={{ color: cor }} />
              </div>

              {/* Card */}
              <div className="flex-1 bg-white rounded-xl border border-acs-line px-3 py-2.5 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="font-mono text-[10px] font-semibold uppercase tracking-[.1em]"
                      style={{ color: cor }}
                    >
                      {TIPO_VISITA_LABEL[v.tipo_visita]}
                    </span>
                    {v.triagem_id && (
                      <button
                        onClick={() => navigate(`/triagem/${v.triagem_id}/detalhe`)}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-[9px] font-semibold uppercase tracking-[.08em] bg-acs-azul-100 text-acs-azul hover:bg-acs-azul/20 transition-colors"
                      >
                        <Activity size={9} strokeWidth={2.5} />
                        Triagem
                      </button>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-acs-ink-3 flex-shrink-0">
                    {fmtDataHora(v.data_hora)}
                  </span>
                </div>
                {/* Flags / alertas */}
                {v.flags && v.flags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {v.flags.map((flagId) => {
                      const cfg = VISITA_FLAGS.find((f) => f.id === flagId)
                      if (!cfg) return null
                      return (
                        <span
                          key={flagId}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-[9px] font-semibold uppercase tracking-[.08em]"
                          style={{ backgroundColor: cfg.cor + '18', color: cfg.cor }}
                        >
                          {cfg.urgente && '⚠ '}
                          {cfg.label}
                        </span>
                      )
                    })}
                  </div>
                )}
                {v.observacao && (
                  <p className="text-xs text-acs-ink-2 mt-1 leading-relaxed">{v.observacao}</p>
                )}
                <p className="text-[10px] text-acs-ink-4 mt-1">{v.acs_nome}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
