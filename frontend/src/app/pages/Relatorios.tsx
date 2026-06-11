import { useEffect, useState } from 'react'
import {
  FileText, Download, Loader2, AlertCircle,
  Users, ClipboardCheck, TrendingUp, ChevronDown,
  CheckCircle2, Clock, XCircle, AlertTriangle,
} from 'lucide-react'
import { BottomNav } from '../components/BottomNav'
import {
  relatoriosService,
  type RelatorioProducao,
  type RelatorioEncaminhamentos,
} from '@/services/relatoriosService'
import { exportarProducaoPDF, exportarEncaminhamentosPDF } from '@/utils/exportPDF'

type TipoRelatorio = 'producao' | 'encaminhamentos'

const TIPO_LABEL: Record<string, string> = {
  consulta_medica: 'Consulta médica',
  enfermagem:      'Enfermagem',
  vacinacao:       'Vacinação',
  exame:           'Exame',
  urgencia:        'Urgência',
  especialista:    'Especialista',
}

const STATUS_LABEL: Record<string, string> = {
  pendente:  'Pendente',
  realizado: 'Realizado',
  ausencia:  'Ausência',
  cancelado: 'Cancelado',
}

function fmt(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Período padrão: mês atual
function periodoDefault() {
  const hoje = new Date()
  const de  = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().slice(0, 10)
  const ate = hoje.toISOString().slice(0, 10)
  return { de, ate }
}

export function Relatorios() {
  const [tipo, setTipo] = useState<TipoRelatorio>('producao')
  const [periodo, setPeriodo] = useState(periodoDefault)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [dadosProducao, setDadosProducao] = useState<RelatorioProducao | null>(null)
  const [dadosEnc, setDadosEnc] = useState<RelatorioEncaminhamentos | null>(null)
  const [exportando, setExportando] = useState(false)

  async function carregar() {
    setCarregando(true)
    setErro(null)
    try {
      if (tipo === 'producao') {
        const { data } = await relatoriosService.producao(periodo)
        setDadosProducao(data)
      } else {
        const { data } = await relatoriosService.encaminhamentos(periodo)
        setDadosEnc(data)
      }
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Erro ao carregar relatório.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => { carregar() }, [tipo, periodo])

  async function exportarPDF() {
    setExportando(true)
    try {
      if (tipo === 'producao' && dadosProducao) {
        await exportarProducaoPDF(dadosProducao, periodo)
      } else if (tipo === 'encaminhamentos' && dadosEnc) {
        await exportarEncaminhamentosPDF(dadosEnc, periodo)
      }
    } finally {
      setExportando(false)
    }
  }

  const temDados = tipo === 'producao' ? !!dadosProducao : !!dadosEnc

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-acs-line px-4 lg:px-8 py-4 lg:py-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-acs-ink text-lg pl-12 lg:pl-0">
              Relatórios
            </h2>
            <button
              onClick={exportarPDF}
              disabled={!temDados || exportando || carregando}
              className="inline-flex items-center gap-2 bg-acs-azul text-white rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-acs-azul-700 transition-colors"
            >
              {exportando
                ? <Loader2 size={16} className="animate-spin" />
                : <Download size={16} strokeWidth={2.2} />}
              Exportar PDF
            </button>
          </div>

          {/* Seletor de tipo */}
          <div className="flex gap-2 mb-4">
            {([
              { id: 'producao',        label: 'Produção dos ACS',  icon: TrendingUp },
              { id: 'encaminhamentos', label: 'Encaminhamentos',   icon: ClipboardCheck },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTipo(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tipo === id
                    ? 'bg-acs-azul text-white'
                    : 'bg-white border border-acs-line text-acs-ink-2 hover:bg-acs-paper'
                }`}
              >
                <Icon size={15} strokeWidth={2} />
                {label}
              </button>
            ))}
          </div>

          {/* Filtro de período */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3">Período:</span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={periodo.de}
                onChange={(e) => setPeriodo((p) => ({ ...p, de: e.target.value }))}
                className="border border-acs-line rounded-lg px-3 py-1.5 text-sm text-acs-ink focus:outline-none focus:ring-2 focus:ring-acs-azul"
              />
              <span className="text-acs-ink-3 text-sm">até</span>
              <input
                type="date"
                value={periodo.ate}
                onChange={(e) => setPeriodo((p) => ({ ...p, ate: e.target.value }))}
                className="border border-acs-line rounded-lg px-3 py-1.5 text-sm text-acs-ink focus:outline-none focus:ring-2 focus:ring-acs-azul"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
        {carregando && (
          <div className="flex items-center justify-center py-20 text-acs-ink-3 gap-2">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm">Gerando relatório…</span>
          </div>
        )}

        {!carregando && erro && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <AlertCircle size={18} className="text-acs-vermelho flex-shrink-0 mt-0.5" />
            <p className="text-sm text-acs-vermelho">{erro}</p>
          </div>
        )}

        {/* RELATÓRIO: PRODUÇÃO DOS ACS */}
        {!carregando && !erro && tipo === 'producao' && dadosProducao && (
          <div className="space-y-6">
            {/* Cards de totais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Triagens', value: dadosProducao.totais.total_triagens,              color: 'text-acs-azul' },
                { label: 'Encaminhamentos', value: dadosProducao.totais.total_encaminhamentos, color: 'text-acs-ink' },
                { label: 'Realizados', value: dadosProducao.totais.encaminhamentos_realizados, color: 'text-acs-verde' },
                { label: 'Vencidos', value: dadosProducao.totais.encaminhamentos_vencidos,     color: 'text-acs-vermelho' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-acs-line p-4 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3 mb-1">{label}</p>
                  <p className={`font-display font-bold text-2xl ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Tabela por ACS */}
            <div className="bg-white rounded-2xl border border-acs-line overflow-hidden">
              <div className="px-5 py-4 border-b border-acs-line flex items-center gap-2">
                <Users size={16} className="text-acs-azul" strokeWidth={1.8} />
                <h3 className="font-semibold text-acs-ink text-sm">Por Agente Comunitário de Saúde</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-acs-paper border-b border-acs-line">
                      <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">ACS</th>
                      <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">Microárea</th>
                      <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">Triagens</th>
                      <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">Encam.</th>
                      <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">Realizados</th>
                      <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">Vencidos</th>
                      <th className="text-right px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">Alto risco</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosProducao.acs.map((acs, i) => (
                      <tr
                        key={acs.acs_id}
                        className={`border-b border-acs-line last:border-0 ${i % 2 === 0 ? '' : 'bg-acs-paper/50'}`}
                      >
                        <td className="px-5 py-3 font-medium text-acs-ink">{acs.acs_nome}</td>
                        <td className="px-4 py-3 text-acs-ink-3">{acs.microarea ?? '—'}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-acs-azul">{acs.total_triagens}</td>
                        <td className="px-4 py-3 text-right font-mono text-acs-ink-2">{acs.total_encaminhamentos}</td>
                        <td className="px-4 py-3 text-right font-mono text-acs-verde">{acs.encaminhamentos_realizados}</td>
                        <td className="px-4 py-3 text-right font-mono text-acs-vermelho">{acs.encaminhamentos_vencidos}</td>
                        <td className="px-4 py-3 text-right font-mono text-acs-coral">{acs.pacientes_alto_risco}</td>
                      </tr>
                    ))}
                    {dadosProducao.acs.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center text-sm text-acs-ink-3">
                          Nenhum ACS encontrado para o período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* RELATÓRIO: ENCAMINHAMENTOS */}
        {!carregando && !erro && tipo === 'encaminhamentos' && dadosEnc && (
          <div className="space-y-6">
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'Total',     value: dadosEnc.total,                      color: 'text-acs-ink',      icon: FileText },
                { label: 'Pendentes', value: dadosEnc.resumo['pendente']  ?? 0,   color: 'text-acs-amar',     icon: Clock },
                { label: 'Realizados',value: dadosEnc.resumo['realizado'] ?? 0,   color: 'text-acs-verde',    icon: CheckCircle2 },
                { label: 'Vencidos',  value: dadosEnc.resumo['ausencia']  ?? 0,   color: 'text-acs-vermelho', icon: XCircle },
              ].map(({ label, value, color, icon: Icon }) => (
                <div key={label} className="bg-white rounded-2xl border border-acs-line p-4 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3 mb-1">{label}</p>
                  <p className={`font-display font-bold text-2xl ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-2xl border border-acs-line overflow-hidden">
              <div className="px-5 py-4 border-b border-acs-line flex items-center gap-2">
                <ClipboardCheck size={16} className="text-acs-azul" strokeWidth={1.8} />
                <h3 className="font-semibold text-acs-ink text-sm">Lista de Encaminhamentos</h3>
                <span className="ml-auto font-mono text-[10px] text-acs-ink-3">{dadosEnc.total} registro{dadosEnc.total !== 1 ? 's' : ''}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-acs-paper border-b border-acs-line">
                      <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">Paciente</th>
                      <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">ACS</th>
                      <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">Tipo</th>
                      <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">Data prev.</th>
                      <th className="text-left px-4 py-3 font-mono text-[10px] uppercase tracking-[.12em] text-acs-ink-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosEnc.encaminhamentos.map((enc, i) => {
                      const vencido = enc.status === 'pendente' && enc.dias_atraso != null && enc.dias_atraso > 0
                      return (
                        <tr
                          key={enc.id}
                          className={`border-b border-acs-line last:border-0 ${i % 2 === 0 ? '' : 'bg-acs-paper/50'}`}
                        >
                          <td className="px-5 py-3 font-medium text-acs-ink">{enc.paciente_nome}</td>
                          <td className="px-4 py-3 text-acs-ink-3 text-xs">{enc.acs_nome}</td>
                          <td className="px-4 py-3 text-acs-ink-2 text-xs">{TIPO_LABEL[enc.tipo] ?? enc.tipo}</td>
                          <td className="px-4 py-3 font-mono text-xs text-acs-ink-2">
                            {fmt(enc.data_prevista)}
                            {vencido && (
                              <span className="ml-1.5 text-acs-vermelho font-semibold">+{enc.dias_atraso}d</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill status={enc.status} vencido={vencido} />
                          </td>
                        </tr>
                      )
                    })}
                    {dadosEnc.encaminhamentos.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-sm text-acs-ink-3">
                          Nenhum encaminhamento no período.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}

function StatusPill({ status, vencido }: { status: string; vencido: boolean }) {
  const cfg: Record<string, { bg: string; text: string }> = {
    pendente:  { bg: vencido ? 'bg-red-50'    : 'bg-acs-amar/15',    text: vencido ? 'text-acs-vermelho' : 'text-acs-amar' },
    realizado: { bg: 'bg-acs-verde/15',  text: 'text-acs-verde' },
    ausencia:  { bg: 'bg-acs-coral/15',  text: 'text-acs-coral' },
    cancelado: { bg: 'bg-acs-paper-2',   text: 'text-acs-ink-3' },
  }
  const { bg, text } = cfg[status] ?? cfg.cancelado
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold uppercase tracking-[.08em] ${bg} ${text}`}>
      {vencido ? 'Vencido' : STATUS_LABEL[status] ?? status}
    </span>
  )
}
