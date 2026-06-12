import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { X, Loader2, CheckCircle2, CloudUpload, Home, Search, RotateCcw, AlertTriangle, ShieldAlert, Activity, ArrowRight } from 'lucide-react'
import {
  visitasService,
  TIPO_VISITA_LABEL,
  VISITA_FLAGS,
  type TipoVisita,
  type VisitaFlag,
} from '@/services/visitasService'
import { useTriagemStore } from '@/store/triagemStore'

interface Props {
  open: boolean
  pacienteId: number
  pacienteNome: string
  onClose: () => void
  onSuccess: () => void
}

const TIPOS: { id: TipoVisita; icon: React.ElementType; cor: string }[] = [
  { id: 'rotina',      icon: Home,          cor: 'var(--acs-azul)' },
  { id: 'busca_ativa', icon: Search,        cor: 'var(--acs-verde)' },
  { id: 'retorno',     icon: RotateCcw,     cor: '#8B5CF6' },
  { id: 'urgencia',    icon: AlertTriangle, cor: 'var(--acs-vermelho)' },
]

function dataHoraLocal() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  return now.toISOString().slice(0, 16)
}

export function RegistrarVisitaSheet({ open, pacienteId, pacienteNome, onClose, onSuccess }: Props) {
  const navigate  = useNavigate()
  const store     = useTriagemStore()

  const [tipo, setTipo]             = useState<TipoVisita>('rotina')
  const [dataHora, setDataHora]     = useState(dataHoraLocal)
  const [observacao, setObservacao] = useState('')
  const [flags, setFlags]           = useState<VisitaFlag[]>([])
  const [alertasAberto, setAlertasAberto] = useState(false)
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState<string | null>(null)
  const [visitaSalvaId, setVisitaSalvaId] = useState<number | null>(null)
  const obsRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setTipo('rotina')
      setDataHora(dataHoraLocal())
      setObservacao('')
      setFlags([])
      setAlertasAberto(false)
      setErro(null)
      setVisitaSalvaId(null)
    }
  }, [open])

  async function salvar() {
    setSalvando(true)
    setErro(null)
    try {
      const result = await visitasService.registrar({
        paciente_id: pacienteId,
        data_hora:   dataHora.length === 16 ? dataHora + ':00' : dataHora,
        tipo_visita: tipo,
        observacao:  observacao.trim() || undefined,
        flags:       flags.length > 0 ? flags : undefined,
      })
      onSuccess()
      if (result.queued) {
        // Offline: não há ID real, fechar direto
        onClose()
      } else {
        setVisitaSalvaId((result.data as any).id)
      }
    } catch (e: any) {
      setErro(e?.message ?? e?.response?.data?.message ?? 'Erro ao registrar visita.')
    } finally {
      setSalvando(false)
    }
  }

  function handleIniciarTriagem() {
    if (!visitaSalvaId) return
    store.reset()
    store.setVisitaId(visitaSalvaId)
    store.setTipoVisita(tipo)
    navigate(`/triagem/${pacienteId}/passo1`)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={visitaSalvaId ? undefined : onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(10,20,40,.18)] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-acs-paper-2" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-acs-line flex-shrink-0">
          <div>
            <h3 className="font-display font-bold text-acs-ink text-base">
              {visitaSalvaId ? 'Visita registrada!' : 'Registrar Visita'}
            </h3>
            <p className="text-xs text-acs-ink-3 mt-0.5">{pacienteNome}</p>
          </div>
          {!visitaSalvaId && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-acs-paper flex items-center justify-center text-acs-ink-3 hover:text-acs-ink transition-colors"
            >
              <X size={16} strokeWidth={2.2} />
            </button>
          )}
        </div>

        {/* ── Step 2: Triagem prompt ── */}
        {visitaSalvaId ? (
          <div className="px-5 py-6 space-y-4">
            <div className="flex items-center gap-3 bg-acs-verde/10 border border-acs-verde/25 rounded-xl px-4 py-3">
              <CheckCircle2 size={20} className="text-acs-verde flex-shrink-0" strokeWidth={2} />
              <p className="text-sm text-acs-ink font-medium">Visita registrada com sucesso.</p>
            </div>

            <div className="bg-acs-paper rounded-2xl p-4 space-y-1">
              <p className="font-display font-bold text-acs-ink text-base">Deseja realizar uma triagem agora?</p>
              <p className="text-sm text-acs-ink-3">
                A triagem ficará vinculada a esta visita.
              </p>
            </div>

            <button
              onClick={handleIniciarTriagem}
              className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-acs-coral text-white shadow-[0_4px_12px_rgba(231,111,74,.3)] hover:brightness-95 transition"
            >
              <Activity size={18} strokeWidth={2.2} />
              Iniciar triagem
              <ArrowRight size={16} />
            </button>

            <button
              onClick={() => { onClose() }}
              className="w-full py-3 rounded-xl font-semibold text-sm text-acs-ink-2 hover:bg-acs-paper transition-colors"
            >
              Não agora
            </button>
          </div>
        ) : (
          <>
            <div className="px-5 py-4 space-y-4 overflow-y-auto">
              {/* Tipo de visita */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3 block mb-2">
                  Tipo de visita
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS.map(({ id, icon: Icon, cor }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTipo(id)}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border-2 text-left transition-all ${
                        tipo === id
                          ? 'border-current shadow-sm'
                          : 'border-acs-line bg-white hover:bg-acs-paper'
                      }`}
                      style={tipo === id ? { borderColor: cor, backgroundColor: cor + '12' } : {}}
                    >
                      <Icon
                        size={18}
                        strokeWidth={1.8}
                        style={{ color: tipo === id ? cor : 'var(--acs-ink-3)' }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{ color: tipo === id ? cor : 'var(--acs-ink-2)' }}
                      >
                        {TIPO_VISITA_LABEL[id]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data e hora */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3 block mb-1.5">
                  Data e hora
                </label>
                <input
                  type="datetime-local"
                  value={dataHora}
                  onChange={(e) => setDataHora(e.target.value)}
                  className="w-full border border-acs-line rounded-xl px-4 py-3 text-sm text-acs-ink focus:outline-none focus:ring-2 focus:ring-acs-azul"
                />
              </div>

              {/* Alertas sanitários — colapsável */}
              <div>
                <button
                  type="button"
                  onClick={() => setAlertasAberto((v) => !v)}
                  className="w-full flex items-center gap-2 py-2.5 px-3 rounded-xl border border-acs-line bg-white hover:bg-acs-paper transition-colors"
                >
                  <ShieldAlert size={15} className="text-acs-coral flex-shrink-0" strokeWidth={2} />
                  <span className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-2 flex-1 text-left">
                    Alertas identificados
                  </span>
                  {flags.length > 0 && (
                    <span className="font-mono text-[10px] font-bold text-acs-coral mr-1">
                      {flags.length} alerta{flags.length > 1 ? 's' : ''}
                    </span>
                  )}
                  <svg
                    width="14" height="14" viewBox="0 0 14 14" fill="none"
                    className={`text-acs-ink-3 transition-transform duration-200 ${alertasAberto ? 'rotate-180' : ''}`}
                  >
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {alertasAberto && (
                <div className="mt-2 space-y-1.5">
                  {VISITA_FLAGS.map((flag) => {
                    const ativo = flags.includes(flag.id)
                    return (
                      <button
                        key={flag.id}
                        type="button"
                        onClick={() =>
                          setFlags((prev) =>
                            ativo ? prev.filter((f) => f !== flag.id) : [...prev, flag.id]
                          )
                        }
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          ativo ? 'border-current' : 'border-acs-line bg-white hover:bg-acs-paper'
                        }`}
                        style={ativo ? { borderColor: flag.cor, backgroundColor: flag.cor + '12' } : {}}
                      >
                        <span
                          className={`w-4 h-4 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all ${
                            ativo ? 'border-current' : 'border-acs-ink-3'
                          }`}
                          style={ativo ? { borderColor: flag.cor, backgroundColor: flag.cor } : {}}
                        >
                          {ativo && (
                            <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                              <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span
                            className="block text-sm font-medium"
                            style={{ color: ativo ? flag.cor : 'var(--acs-ink)' }}
                          >
                            {flag.label}
                            {flag.urgente && (
                              <span className="ml-1.5 font-mono text-[9px] uppercase tracking-[.1em] opacity-70">
                                urgente
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-acs-ink-3">{flag.descricao}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                )}
              </div>

              {/* Observação */}
              <div>
                <label className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3 block mb-1.5">
                  Observação <span className="normal-case tracking-normal text-acs-ink-4">(opcional)</span>
                </label>
                <textarea
                  ref={obsRef}
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Anotações sobre a visita, condição do paciente..."
                  rows={3}
                  className="w-full border border-acs-line rounded-xl px-4 py-3 text-sm text-acs-ink placeholder:text-acs-ink-4 focus:outline-none focus:ring-2 focus:ring-acs-azul resize-none"
                />
              </div>

              {/* Erro */}
              {erro && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <X size={15} className="text-acs-vermelho flex-shrink-0" />
                  <p className="text-sm text-acs-vermelho">{erro}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-6 pt-2 flex-shrink-0">
              <button
                onClick={salvar}
                disabled={salvando}
                className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-acs-azul text-white hover:bg-acs-azul-700 disabled:opacity-50"
              >
                {salvando ? (
                  <><Loader2 size={18} className="animate-spin" /> Salvando…</>
                ) : (
                  'Registrar Visita'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
