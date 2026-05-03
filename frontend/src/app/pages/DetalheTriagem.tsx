import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Clock,
  User,
  Activity,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Info,
  FileText,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { RiskBadge } from '../components/RiskBadge';
import { riscoToUI } from '@/services/pacientesService';
import { useTriagemStore } from '@/store/triagemStore';
import {
  triagensService,
  labelPrioridade,
  labelAcao,
  corPrioridade,
  type NivelRiscoAPI,
  type NivelPrioridadeAPI,
  type AcaoRecomendadaAPI,
} from '@/services/triagensService';
import type { Sexo } from '@/types';

/* ── Types for the detail endpoint response ───────────────── */
interface TriagemSintomaDetalhe {
  sintoma_id: string;
  intensidade: number;
  qualificadores: string | Record<string, boolean> | null;
}

interface TriagemResultadoDetalhe {
  doenca_id: string;
  doenca_nome: string;
  score: number;
  label: 'Alta' | 'Média' | 'Baixa';
  rank_posicao: number;
}

interface TriagemDetalhe {
  id: number;
  paciente_id: number;
  paciente_nome?: string;
  acs_id: number;
  acs_nome?: string;
  data_hora: string;
  faixa_etaria: string;
  sexo: Sexo;
  score_final: number;
  nivel_risco: NivelRiscoAPI;
  nivel_prioridade: NivelPrioridadeAPI;
  acao_recomendada: AcaoRecomendadaAPI;
  top_doenca_id?: string;
  top_doenca_nome?: string;
  top_doenca_score?: number;
  payload_sintomas?: string;
  payload_resultado?: string;
  created_at: string;
  sintomas: TriagemSintomaDetalhe[];
  resultados: TriagemResultadoDetalhe[];
}

/* ── Priority display config ──────────────────────────────── */
const PRIO_DISPLAY: Record<string, { bg: string; textClass: string }> = {
  danger:  { bg: 'bg-acs-vermelho', textClass: 'text-white' },
  warning: { bg: 'bg-acs-amar',     textClass: 'text-white' },
  info:    { bg: 'bg-acs-verde',    textClass: 'text-white' },
};

/* ── Intensity label ──────────────────────────────────────── */
function intensidadeLabel(v: number): string {
  if (v <= 3) return 'Leve';
  if (v <= 6) return 'Moderado';
  if (v <= 8) return 'Forte';
  return 'Severo';
}

function intensidadeColor(v: number): string {
  if (v <= 3) return 'text-acs-verde';
  if (v <= 6) return 'text-acs-amar';
  if (v <= 8) return 'text-acs-coral';
  return 'text-acs-vermelho';
}

/* ── ResumoLinha helper ───────────────────────────────────── */
function ResumoLinha({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="eyebrow">{label}</span>
      <span className="text-sm font-semibold text-acs-ink">{value}</span>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────── */
export function DetalheTriagem() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [triagem, setTriagem] = useState<TriagemDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expandida, setExpandida] = useState<string | null>(null);
  const [mostrarPorque, setMostrarPorque] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelado = false;
    setLoading(true);
    setErro(null);

    triagensService.buscarPorId(Number(id))
      .then(({ data }) => { if (!cancelado) setTriagem(data as TriagemDetalhe); })
      .catch((err: any) => {
        if (!cancelado) setErro(err?.response?.data?.message ?? 'Erro ao carregar triagem.');
      })
      .finally(() => { if (!cancelado) setLoading(false); });

    return () => { cancelado = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center gap-2 text-acs-ink-3">
        <Loader2 size={20} className="animate-spin" />
        Carregando triagem...
      </div>
    );
  }

  if (erro || !triagem) {
    return (
      <div className="h-full flex flex-col p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-acs-ink mb-6">
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="flex items-start gap-3 bg-acs-vermelho-100 border border-acs-vermelho/20 rounded-xl p-4">
          <AlertCircle size={18} className="text-acs-vermelho flex-shrink-0 mt-0.5" />
          <p className="text-sm text-acs-vermelho">{erro ?? 'Triagem nao encontrada.'}</p>
        </div>
      </div>
    );
  }

  const risco = riscoToUI(triagem.nivel_risco);
  const corPrio = corPrioridade(triagem.nivel_prioridade);
  const prio = PRIO_DISPLAY[corPrio] ?? PRIO_DISPLAY.info;
  const dataFormatada = new Date(triagem.data_hora).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
  const horaFormatada = new Date(triagem.data_hora).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit',
  });

  // Parse qualifiers from string if needed
  const parseQualifiers = (q: TriagemSintomaDetalhe['qualificadores']): Record<string, boolean> => {
    if (!q) return {};
    if (typeof q === 'string') {
      try { return JSON.parse(q); } catch { return {}; }
    }
    return q;
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto pb-28 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-acs-line px-5 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Voltar" className="p-1 -ml-1">
          <ArrowLeft size={22} className="text-acs-ink" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-acs-ink text-lg leading-tight">Detalhe da Triagem</h1>
          <p className="text-xs text-acs-ink-3 font-mono tracking-wide">TRG-{triagem.id}</p>
        </div>
        <RiskBadge level={risco} />
      </div>

      <div className="flex-1 px-5 py-5 lg:px-8 space-y-5">

        {/* ── Hero: Prioridade + Acao ────────────────────────── */}
        <div className={`${prio.bg} rounded-[20px] p-5 ${prio.textClass} relative overflow-hidden`}>
          {/* Decorative glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/[.08]" />

          <div className="flex items-center justify-between mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[.18] font-mono text-[10px] font-bold uppercase tracking-[.14em]">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {labelPrioridade(triagem.nivel_prioridade)}
            </span>
            <span className="font-mono text-[10px] tracking-[.1em] uppercase opacity-70">
              {dataFormatada}
            </span>
          </div>

          <h2 className="font-display font-bold text-[24px] lg:text-[28px] leading-tight tracking-tight mb-2">
            {labelAcao(triagem.acao_recomendada)}
          </h2>

          <p className="flex items-center gap-1.5 text-sm opacity-85 mb-4">
            <Clock size={14} strokeWidth={2} />
            {horaFormatada}
          </p>

          {triagem.top_doenca_nome && (
            <p className="text-sm opacity-90 mb-4">
              Hipotese principal: <strong>{triagem.top_doenca_nome}</strong>
              {triagem.top_doenca_score != null && (
                <span className="font-mono text-xs ml-1 opacity-75">({triagem.top_doenca_score}%)</span>
              )}
            </p>
          )}

          <button
            onClick={() => setMostrarPorque(!mostrarPorque)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[.16] text-xs font-semibold hover:bg-white/[.24] transition-colors"
          >
            <Info size={13} strokeWidth={2} />
            {mostrarPorque ? 'Ocultar detalhes' : 'Por que essa prioridade?'}
          </button>

          {mostrarPorque && (
            <div className="mt-3 bg-black/20 rounded-xl p-3 text-sm leading-relaxed">
              <p className="eyebrow mb-2" style={{ color: 'rgba(255,255,255,.8)' }}>Fatores que elevaram a prioridade</p>
              <ul className="list-disc pl-4 space-y-1 opacity-95 text-xs">
                <li>Score final: {triagem.score_final}%</li>
                <li>Nivel de risco: {triagem.nivel_risco}</li>
                <li>{triagem.sintomas.length} sintoma(s) registrado(s)</li>
                {triagem.top_doenca_nome && <li>Hipotese: {triagem.top_doenca_nome} ({triagem.top_doenca_score}%)</li>}
              </ul>
            </div>
          )}
        </div>

        {/* ── Paciente ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-acs-line p-4" style={{ boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}>
          <p className="eyebrow mb-3">Paciente</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-acs-azul-050 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-acs-azul-700" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-acs-ink truncate">{triagem.paciente_nome ?? `Paciente #${triagem.paciente_id}`}</p>
              <p className="text-xs text-acs-ink-3">
                {triagem.sexo === 'm' ? 'Masculino' : 'Feminino'} · {triagem.faixa_etaria} anos
              </p>
            </div>
            <button
              onClick={() => navigate(`/paciente/${triagem.paciente_id}`)}
              className="text-xs text-acs-azul font-semibold hover:underline flex-shrink-0"
            >
              Ver perfil
            </button>
          </div>
          {triagem.acs_nome && (
            <p className="text-xs text-acs-ink-3 mt-2 pl-[52px]">
              ACS: {triagem.acs_nome}
            </p>
          )}
        </div>

        {/* ── Sintomas registrados ──────────────────────────── */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Stethoscope size={16} className="text-acs-azul" strokeWidth={2} />
            <h3 className="font-display font-bold text-acs-ink text-[15px]">
              Sintomas registrados
              <span className="ml-2 text-xs font-mono text-acs-ink-3 font-semibold">{triagem.sintomas.length}</span>
            </h3>
          </div>

          {triagem.sintomas.length === 0 ? (
            <p className="text-sm text-acs-ink-3 bg-acs-paper-2 rounded-xl p-4 text-center">
              Nenhum sintoma registrado nesta triagem.
            </p>
          ) : (
            <div className="space-y-2">
              {triagem.sintomas.map((s) => {
                const quals = parseQualifiers(s.qualificadores);
                const activeQuals = Object.entries(quals).filter(([, v]) => v);

                return (
                  <div
                    key={s.sintoma_id}
                    className="bg-white rounded-2xl border border-acs-line p-4"
                    style={{ boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{
                          backgroundColor:
                            s.intensidade <= 3 ? 'var(--acs-verde)' :
                            s.intensidade <= 6 ? 'var(--acs-amar)' :
                            s.intensidade <= 8 ? 'var(--acs-coral)' : 'var(--acs-vermelho)',
                        }} />
                        <span className="text-sm font-semibold text-acs-ink">{s.sintoma_id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-bold ${intensidadeColor(s.intensidade)}`}>
                          {intensidadeLabel(s.intensidade)}
                        </span>
                        <span className="font-mono text-[10px] text-acs-ink-3">{s.intensidade}/10</span>
                      </div>
                    </div>

                    {/* Intensity bar */}
                    <div className="mt-2.5 h-1.5 rounded-full bg-acs-paper-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${s.intensidade * 10}%`,
                          background: `linear-gradient(90deg, var(--acs-verde) 0%, var(--acs-amar) 50%, var(--acs-coral) 100%)`,
                        }}
                      />
                    </div>

                    {/* Qualifiers */}
                    {activeQuals.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {activeQuals.map(([qid]) => (
                          <span key={qid} className="px-2 py-0.5 bg-acs-azul-050 text-acs-azul text-[11px] font-medium rounded-md">
                            {qid.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Hipoteses diagnosticas ────────────────────────── */}
        {triagem.resultados.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} className="text-acs-azul" strokeWidth={2} />
              <h3 className="font-display font-bold text-acs-ink text-[15px]">
                Hipoteses diagnosticas
                <span className="ml-2 text-xs font-mono text-acs-ink-3 font-semibold">{triagem.resultados.length}</span>
              </h3>
            </div>

            <div className="space-y-2">
              {triagem.resultados.map((r, i) => {
                const isExpanded = expandida === r.doenca_id;
                const barColor =
                  r.score >= 65 ? 'bg-acs-vermelho' :
                  r.score >= 35 ? 'bg-acs-amar' : 'bg-acs-verde';
                const labelColor =
                  r.label === 'Alta'  ? 'bg-acs-vermelho-100 text-acs-vermelho' :
                  r.label === 'Média' ? 'bg-acs-amar-100 text-acs-amar' :
                                        'bg-acs-verde-100 text-acs-verde';

                return (
                  <div
                    key={r.doenca_id}
                    className={`bg-white rounded-2xl border overflow-hidden ${i === 0 ? 'border-acs-coral-300' : 'border-acs-line'}`}
                    style={{ boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}
                  >
                    <button
                      onClick={() => setExpandida(isExpanded ? null : r.doenca_id)}
                      className="w-full p-4 flex items-center gap-3 text-left"
                    >
                      {/* Score ring */}
                      <div className="relative w-[38px] h-[38px] flex-shrink-0">
                        <svg width={38} height={38} className="-rotate-90">
                          <circle cx={19} cy={19} r={15} fill="none" stroke="var(--acs-paper-2)" strokeWidth={4} />
                          <circle
                            cx={19} cy={19} r={15} fill="none"
                            stroke="var(--acs-coral)"
                            strokeWidth={4}
                            strokeDasharray={2 * Math.PI * 15}
                            strokeDashoffset={2 * Math.PI * 15 * (1 - r.score / 100)}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center font-mono text-[11px] font-bold text-acs-ink">
                          {r.score}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-acs-ink leading-tight">{r.doenca_nome}</p>
                        <span className={`inline-block mt-1 px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold uppercase tracking-[.08em] ${labelColor}`}>
                          {r.label}
                        </span>
                      </div>

                      {isExpanded
                        ? <ChevronUp size={16} className="text-acs-ink-3 flex-shrink-0" />
                        : <ChevronDown size={16} className="text-acs-ink-3 flex-shrink-0" />
                      }
                    </button>

                    {isExpanded && (
                      <div className="border-t border-acs-line bg-acs-paper px-4 py-3">
                        <p className="eyebrow mb-2">Compatibilidade</p>
                        <div className="h-1.5 rounded-full bg-acs-paper-2 overflow-hidden mb-2">
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${r.score}%` }} />
                        </div>
                        <p className="text-xs text-acs-ink-3 font-mono">{r.score}% de compatibilidade com os sintomas</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Resumo ────────────────────────────────────────── */}
        <div className="bg-acs-paper-2 rounded-2xl p-4">
          <p className="eyebrow mb-3">Resumo da triagem</p>
          <ResumoLinha label="Data" value={`${dataFormatada}, ${horaFormatada}`} />
          <ResumoLinha label="Sintomas" value={`${triagem.sintomas.length} registrados`} />
          <ResumoLinha label="Score final" value={`${triagem.score_final}%`} />
          <ResumoLinha label="Risco" value={triagem.nivel_risco} />
          <ResumoLinha label="Acao" value={labelAcao(triagem.acao_recomendada)} />
          <ResumoLinha label="Faixa etaria" value={triagem.faixa_etaria} />
        </div>

        {/* ── Proximos passos ───────────────────────────────── */}
        <div>
          <p className="eyebrow mb-3">Acoes</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                useTriagemStore.getState().reset();
                navigate(`/triagem/${triagem.paciente_id}/passo1`);
              }}
              className="w-full flex items-center justify-between px-4 py-3 bg-acs-coral text-white rounded-xl font-semibold text-sm hover:brightness-95 transition-all shadow-[0_4px_12px_rgba(231,111,74,.3)]"
            >
              <span className="flex items-center gap-2">
                <Stethoscope size={16} strokeWidth={2} />
                Nova triagem
              </span>
              <ArrowLeft size={16} className="rotate-180" />
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center gap-2 px-4 py-3 bg-white border border-acs-line rounded-xl text-sm font-semibold text-acs-ink hover:border-acs-azul-300 transition-colors">
                <Calendar size={15} className="text-acs-azul" strokeWidth={1.8} />
                Agendar consulta
              </button>
              <button className="flex items-center gap-2 px-4 py-3 bg-white border border-acs-line rounded-xl text-sm font-semibold text-acs-ink hover:border-acs-azul-300 transition-colors">
                <MessageSquare size={15} className="text-acs-azul" strokeWidth={1.8} />
                Orientacao
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
