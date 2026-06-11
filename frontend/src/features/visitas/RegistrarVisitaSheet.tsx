import { useEffect, useRef, useState } from 'react'
import { X, Loader2, CheckCircle2, Home, Search, RotateCcw, AlertTriangle } from 'lucide-react'
import {
  visitasService,
  TIPO_VISITA_LABEL,
  type TipoVisita,
} from '@/services/visitasService'

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
  const [tipo, setTipo]             = useState<TipoVisita>('rotina')
  const [dataHora, setDataHora]     = useState(dataHoraLocal)
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState<string | null>(null)
  const [sucesso, setSucesso]       = useState(false)
  const obsRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open) {
      setTipo('rotina')
      setDataHora(dataHoraLocal())
      setObservacao('')
      setErro(null)
      setSucesso(false)
    }
  }, [open])

  async function salvar() {
    setSalvando(true)
    setErro(null)
    try {
      await visitasService.registrar({
        paciente_id: pacienteId,
        data_hora:   dataHora.length === 16 ? dataHora + ':00' : dataHora,
        tipo_visita: tipo,
        observacao:  observacao.trim() || undefined,
      })
      setSucesso(true)
      setTimeout(() => { onSuccess(); onClose() }, 1200)
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Erro ao registrar visita.')
    } finally {
      setSalvando(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg bg-white rounded-t-3xl shadow-[0_-8px_30px_rgba(10,20,40,.18)] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-acs-paper-2" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 pt-1 border-b border-acs-line flex-shrink-0">
          <div>
            <h3 className="font-display font-bold text-acs-ink text-base">Registrar Visita</h3>
            <p className="text-xs text-acs-ink-3 mt-0.5">{pacienteNome}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-acs-paper flex items-center justify-center text-acs-ink-3 hover:text-acs-ink transition-colors"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

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
            disabled={salvando || sucesso}
            className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 bg-acs-azul text-white hover:bg-acs-azul-700 disabled:opacity-50"
          >
            {sucesso ? (
              <><CheckCircle2 size={18} strokeWidth={2.2} /> Visita registrada!</>
            ) : salvando ? (
              <><Loader2 size={18} className="animate-spin" /> Salvando…</>
            ) : (
              'Registrar Visita'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
