import {
  ArrowLeft, AlertCircle, CheckCircle2, Loader2, Activity,
  Clock, ChevronDown, ChevronUp, Hospital, ArrowRight,
  Calendar, MessageSquare, Pencil, Check,
} from 'lucide-react';
import { useNavigate, useParams, Navigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useTriagemStore } from '@/store/triagemStore';
import {
  triagensService,
  labelPrioridade,
  labelAcao,
  corPrioridade,
  type TriagemResultadoAPI,
} from '@/services/triagensService';
import { RegistrarEncaminhamentoSheet } from '@/features/encaminhamentos';
import type { TipoEncaminhamento } from '@/types';

/* ── Priority display meta ─────────────────────────────────── */

const PRIO_DISPLAY: Record<string, { bg: string; label: string }> = {
  danger:  { bg: 'bg-acs-vermelho', label: 'Urgente' },
  warning: { bg: 'bg-acs-amar',     label: 'Moderado' },
  info:    { bg: 'bg-acs-verde',    label: 'Baixo' },
};

/* ── Helper components (outside main) ──────────────────────── */

function ResumoLinha({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-acs-line last:border-0">
      <span className="text-xs font-mono uppercase tracking-[.14em] text-acs-ink-3">{label}</span>
      <span className="text-sm font-medium text-acs-ink text-right max-w-[55%]">{valor}</span>
    </div>
  );
}

function HipoteseCard({
  d,
  isFirst,
  expandida,
  onToggle,
}: {
  d: { id: string; nome: string; descricao?: string; score: number; label: string; sintomas?: string[] };
  isFirst: boolean;
  expandida: boolean;
  onToggle: () => void;
}) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (d.score / 100) * circumference;

  return (
    <div
      className={`bg-white rounded-2xl shadow-[0_1px_2px_rgba(10,20,40,.06)] p-4 ${
        isFirst ? 'border-2 border-acs-coral/40' : 'border border-acs-line'
      }`}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-3 text-left">
        {/* Score ring */}
        <div className="w-[38px] h-[38px] flex-shrink-0 relative">
          <svg width="38" height="38" viewBox="0 0 38 38" className="-rotate-90">
            <circle
              cx="19" cy="19" r={radius}
              fill="none" stroke="currentColor"
              className="text-acs-paper-2" strokeWidth="3"
            />
            <circle
              cx="19" cy="19" r={radius}
              fill="none"
              stroke={d.score >= 65 ? '#C8364A' : d.score >= 35 ? '#F2B134' : '#2F9E6E'}
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-acs-ink">
            {d.score}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-acs-ink truncate">{d.nome}</h4>
          {d.descricao && (
            <p className="text-xs text-acs-ink-3 mt-0.5 line-clamp-1">{d.descricao}</p>
          )}
        </div>

        {expandida
          ? <ChevronUp size={18} className="text-acs-ink-3 flex-shrink-0" />
          : <ChevronDown size={18} className="text-acs-ink-3 flex-shrink-0" />
        }
      </button>

      {expandida && d.sintomas && d.sintomas.length > 0 && (
        <div className="mt-3 pt-3 border-t border-acs-line flex flex-wrap gap-1.5">
          {d.sintomas.map((s) => (
            <span
              key={s}
              className="inline-block px-2 py-0.5 rounded-md bg-acs-paper-2 text-[11px] font-mono text-acs-ink-2"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main component ────────────────────────────────────────── */

export function TriagemResultado() {
  const navigate = useNavigate();
  const { pacienteId } = useParams();
  const {
    paciente, visitaId, observacao, riskFactors,
    sintomas, qualifiers, resultado, setResultado,
    triagemConcluida, marcarTriagemConcluida,
  } = useTriagemStore();

  const [avaliando, setAvaliando]       = useState(false);
  const [salvando, setSalvando]         = useState(false);
  const [erro, setErro]                 = useState<string | null>(null);
  const [sucesso, setSucesso]           = useState(false);
  const [mostrarPorque, setMostrarPorque] = useState(false);
  const [expandida, setExpandida]       = useState<string | null>(null);
  const [triagemSalvaId, setTriagemSalvaId] = useState<number | null>(null);
  const [sheetEncOpen, setSheetEncOpen] = useState(false);

  useEffect(() => {
    if (!paciente) return;
    if (Object.keys(sintomas).length === 0) return;
    if (resultado) return;

    let cancelado = false;
    async function avaliar() {
      setAvaliando(true);
      setErro(null);
      try {
        const { data } = await triagensService.avaliar({
          faixa_etaria: paciente!.faixaEtaria,
          sexo:         paciente!.sexo,
          sintomas,
          riskFactors,
          qualifiers,
        });
        if (!cancelado) setResultado(data);
      } catch (err: any) {
        if (!cancelado) {
          setErro(err?.response?.data?.message ?? 'Erro ao avaliar triagem.');
        }
      } finally {
        if (!cancelado) setAvaliando(false);
      }
    }
    avaliar();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paciente?.id]);

  /* ── Guard: triagem já concluída ───────────────────────── */
  // Cobre o caso "Voltar" do navegador após salvar — em vez de
  // mostrar a tela vazia, redireciona silenciosamente para o perfil.
  if (triagemConcluida && pacienteId) {
    return <Navigate to={`/paciente/${pacienteId}`} replace />;
  }

  /* ── Guard: no patient ─────────────────────────────────── */

  if (!paciente) {
    return (
      <div className="h-full flex flex-col p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-acs-ink mb-6">
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="flex items-start gap-3 bg-acs-amar-100 border border-acs-amar/20 rounded-xl p-4">
          <AlertCircle size={18} className="text-[#A3740A] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#A3740A]">Triagem não iniciada.</p>
        </div>
      </div>
    );
  }

  /* ── Save handler ──────────────────────────────────────── */

  // Salva a triagem (idempotente — não duplica se já salvou nesta tela)
  // e devolve o id persistido. Usado tanto pelo CTA "Salvar triagem"
  // quanto pelo "Encaminhar agora".
  async function salvarTriagemSeNecessario(): Promise<number | null> {
    if (!paciente) return null;
    if (triagemSalvaId) return triagemSalvaId;

    const { data } = await triagensService.criar({
      paciente_id: paciente.id,
      visita_id:   visitaId ?? undefined,
      payload: {
        faixa_etaria: paciente.faixaEtaria,
        sexo:         paciente.sexo,
        sintomas,
        riskFactors,
        qualifiers,
      },
    });
    setTriagemSalvaId(data.id);
    return data.id;
  }

  async function handleSalvar() {
    if (!paciente) return;
    setSalvando(true);
    setErro(null);
    try {
      await salvarTriagemSeNecessario();
      setSucesso(true);
      setTimeout(() => {
        // Marca como concluída ao invés de resetar — assim, se o usuário
        // clicar "Voltar" no navegador após chegar no perfil, os passos
        // do wizard detectam a flag e redirecionam silenciosamente em
        // vez de mostrar "Triagem nao iniciada".
        marcarTriagemConcluida(true);
        navigate(`/paciente/${paciente.id}`, { replace: true });
      }, 1500);
    } catch (err: any) {
      console.error('[TriagemResultado] Falha ao salvar:', err);
      const data   = err?.response?.data;
      const msg    = data?.message ?? err?.message ?? 'Erro ao salvar triagem.';
      const detail = data?.error ? ` (${data.error})` : '';
      setErro(msg + detail);
    } finally {
      setSalvando(false);
    }
  }

  async function handleAbrirEncaminhamento() {
    if (!paciente) return;
    setSalvando(true);
    setErro(null);
    try {
      await salvarTriagemSeNecessario();
      setSheetEncOpen(true);
    } catch (err: any) {
      const data = err?.response?.data;
      const msg  = data?.message ?? 'Não foi possível salvar a triagem para encaminhar.';
      setErro(msg);
    } finally {
      setSalvando(false);
    }
  }

  /* ── Success screen ────────────────────────────────────── */

  if (sucesso) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-acs-verde-100 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-acs-verde" />
        </div>
        <h2 className="font-display font-bold text-acs-ink text-lg text-center">Triagem salva com sucesso!</h2>
        <p className="text-sm text-acs-ink-3 text-center">Redirecionando...</p>
      </div>
    );
  }

  /* ── Loading / evaluating ──────────────────────────────── */

  if (avaliando || !resultado) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-acs-ink-3">
        <Loader2 size={24} className="animate-spin" />
        {erro ? (
          <p className="text-acs-vermelho text-sm px-6 text-center">{erro}</p>
        ) : (
          <p className="text-sm">Avaliando sintomas...</p>
        )}
      </div>
    );
  }

  /* ── Derived values ────────────────────────────────────── */

  const prio    = resultado.nivel_prioridade;
  const corPrio = corPrioridade(prio);
  const pLabel  = labelPrioridade(prio);
  const aLabel  = labelAcao(resultado.acao_recomendada);
  const topList = resultado.computed.slice(0, 8);
  const display = PRIO_DISPLAY[corPrio] ?? PRIO_DISPLAY.info;

  const prazoMap: Record<string, string> = {
    urgencia:       'Atendimento imediato',
    encaminhar_ubs: 'Até 48 horas',
    acompanhamento: 'Próxima visita programada',
  };
  const prazoTexto = prazoMap[resultado.acao_recomendada] ?? '';

  const timestamp = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  /* ── Factors list for "por que essa prioridade" ────────── */
  const fatores: string[] = [];
  if (resultado.top_doenca) {
    fatores.push(`Hipótese principal: ${resultado.top_doenca.nome} (${resultado.top_doenca.score}%)`);
  }
  if (riskFactors.length > 0) {
    fatores.push(`Fatores de risco: ${riskFactors.join(', ')}`);
  }
  fatores.push(`${Object.keys(sintomas).length} sintomas relatados`);
  fatores.push(`Score final: ${resultado.score_final}%`);

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div className="h-full flex flex-col overflow-y-auto pb-28">
      {/* ── Header / Stepper ──────────────────────────────── */}
      <div className="bg-white border-b border-acs-line px-6 py-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={24} className="text-acs-ink" />
          </button>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-acs-ink">Resultado</h2>
            <p className="text-sm text-acs-ink-3 truncate">
              {paciente.nome} &middot; {timestamp}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <div className="flex-1 h-1.5 bg-acs-azul rounded-full" />
          <div className="flex-1 h-1.5 bg-acs-azul rounded-full" />
          <div className="flex-1 h-1.5 bg-acs-azul rounded-full" />
        </div>
        <p className="eyebrow mt-2">3 de 3 — Resultado</p>
      </div>

      <div className="flex-1 px-6 py-4 space-y-6">
        {/* ── Error banner ──────────────────────────────── */}
        {erro && (
          <div className="flex items-start gap-3 bg-acs-vermelho-100 border border-acs-vermelho/20 rounded-xl p-4">
            <AlertCircle size={18} className="text-acs-vermelho flex-shrink-0 mt-0.5" />
            <p className="text-sm text-acs-vermelho">{erro}</p>
          </div>
        )}

        {/* ── Priority hero card ────────────────────────── */}
        <div className={`${display.bg} rounded-[22px] p-5 text-white`}>
          {/* Top row: badge + ID */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/15 font-mono text-[10px] font-semibold uppercase tracking-[.1em]">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Prioridade {display.label}
            </span>
            <span className="font-mono text-[10px] opacity-70 uppercase tracking-[.1em]">
              #{paciente.id}
            </span>
          </div>

          {/* Main action label */}
          <h3 className="text-[26px] font-display font-bold leading-tight mb-3">
            {aLabel}
          </h3>

          {/* Prazo */}
          {prazoTexto && (
            <div className="flex items-center gap-2 mb-3 opacity-90">
              <Clock size={14} strokeWidth={2.2} />
              <span className="text-sm">{prazoTexto}</span>
            </div>
          )}

          {/* Clinical summary */}
          {resultado.top_doenca && (
            <p className="text-sm opacity-85 leading-relaxed mb-4">
              Hipótese principal: <strong>{resultado.top_doenca.nome}</strong> com {resultado.top_doenca.score}% de compatibilidade.
              {resultado.top_doenca.descricao ? ` ${resultado.top_doenca.descricao}` : ''}
            </p>
          )}

          {/* "Por que essa prioridade?" toggle */}
          <button
            onClick={() => setMostrarPorque(!mostrarPorque)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white/15 hover:bg-white/20 transition-colors text-sm font-medium"
          >
            <span>Por que essa prioridade?</span>
            {mostrarPorque
              ? <ChevronUp size={16} />
              : <ChevronDown size={16} />
            }
          </button>

          {mostrarPorque && (
            <ul className="mt-3 space-y-1.5 pl-1">
              {fatores.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm opacity-90">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Próximos passos ───────────────────────────── */}
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-acs-ink">Próximos passos</h3>

          {/* Primary CTA */}
          <button
            onClick={handleAbrirEncaminhamento}
            disabled={salvando}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-acs-coral text-white rounded-xl font-semibold shadow-[0_4px_12px_rgba(231,111,74,.3)] hover:brightness-95 transition-colors animate-pulse-subtle disabled:opacity-70"
          >
            {salvando && !sheetEncOpen ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Hospital size={18} strokeWidth={2.2} />
            )}
            <span>Encaminhar agora</span>
            <ArrowRight size={16} />
          </button>

          {/* 2-col grid */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex flex-col items-center gap-2 py-4 bg-white rounded-2xl border border-acs-line shadow-[0_1px_2px_rgba(10,20,40,.06)] hover:border-acs-azul/30 transition-colors">
              <Calendar size={20} className="text-acs-azul" />
              <span className="text-xs font-medium text-acs-ink">Agendar consulta</span>
            </button>
            <button className="flex flex-col items-center gap-2 py-4 bg-white rounded-2xl border border-acs-line shadow-[0_1px_2px_rgba(10,20,40,.06)] hover:border-acs-azul/30 transition-colors">
              <MessageSquare size={20} className="text-acs-azul" />
              <span className="text-xs font-medium text-acs-ink">Orientação verbal</span>
            </button>
          </div>
        </div>

        {/* ── Hipóteses ─────────────────────────────────── */}
        <div>
          <h3 className="font-display font-semibold text-acs-ink mb-3">Hipóteses diagnósticas</h3>
          {topList.length === 0 ? (
            <p className="text-sm text-acs-ink-3">Nenhuma condição com probabilidade significativa.</p>
          ) : (
            <div className="space-y-3">
              {topList.map((d, i) => (
                <HipoteseCard
                  key={d.id}
                  d={d}
                  isFirst={i === 0}
                  expandida={expandida === d.id}
                  onToggle={() => setExpandida(expandida === d.id ? null : d.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Resumo da triagem ─────────────────────────── */}
        <div className="bg-acs-paper-2 rounded-2xl p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[.14em] text-acs-ink-3 mb-3">
            Resumo da triagem
          </p>
          <div>
            {visitaId && <ResumoLinha label="Visita vinculada" valor={`#${visitaId}`} />}
            <ResumoLinha label="Faixa etaria" valor={paciente.faixaEtaria} />
            <ResumoLinha label="Sintomas" valor={String(Object.keys(sintomas).length)} />
            <ResumoLinha label="Fatores de risco" valor={riskFactors.length > 0 ? riskFactors.join(', ') : 'nenhum'} />
            {observacao && (
              <ResumoLinha label="Observação" valor={observacao} />
            )}
          </div>
        </div>
      </div>

      {/* ── Footer CTA ───────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-acs-line p-4 max-w-[800px] mx-auto">
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/triagem/${paciente.id}/passo2`)}
            disabled={salvando}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white text-acs-azul rounded-xl font-semibold border border-acs-azul hover:bg-acs-azul-050 transition-colors disabled:opacity-50"
          >
            <Pencil size={16} />
            Editar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex-1 py-3 bg-acs-coral text-white rounded-xl font-semibold hover:brightness-95 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(231,111,74,.3)]"
          >
            {salvando ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}
            {salvando ? 'Salvando...' : 'Salvar triagem'}
          </button>
        </div>
      </div>

      {/* ── Bottom sheet de encaminhamento ─────────────────── */}
      <RegistrarEncaminhamentoSheet
        open={sheetEncOpen}
        onClose={() => setSheetEncOpen(false)}
        pacienteId={paciente.id}
        pacienteNome={paciente.nome}
        triagemId={triagemSalvaId ?? undefined}
        tipoSugerido={
          (resultado.acao_recomendada === 'urgencia'
            ? 'urgencia'
            : 'consulta_medica') as TipoEncaminhamento
        }
        motivoSugerido={
          resultado.top_doenca
            ? `Suspeita de ${resultado.top_doenca.nome} (${resultado.top_doenca.score}%) — ${aLabel}.`
            : aLabel
        }
        onSuccess={() => {
          // Encaminhamento criado: marca a triagem como concluída e leva
          // ao perfil. Replace evita que o "Voltar" do navegador
          // recoloque o usuário na tela de resultado já vazia.
          setTimeout(() => {
            marcarTriagemConcluida(true);
            navigate(`/paciente/${paciente.id}`, { replace: true });
          }, 950);
        }}
      />
    </div>
  );
}
