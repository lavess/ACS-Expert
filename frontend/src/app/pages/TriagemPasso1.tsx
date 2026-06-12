import {
  ArrowLeft, Loader2, AlertCircle,
  ArrowRight, Lock, Check,
} from 'lucide-react';
import { useNavigate, useParams, Navigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useTriagemStore } from '@/store/triagemStore';
import { pacientesService, calcularIdade } from '@/services/pacientesService';
import { triagensService, idadeParaFaixaEtaria } from '@/services/triagensService';
import type { Comorbidade } from '@/types';

const FATORES_RISCO: { id: Comorbidade; label: string }[] = [
  { id: 'fumante',         label: 'Fumante' },
  { id: 'hipertenso',      label: 'Hipertenso(a)' },
  { id: 'diabetico',       label: 'Diabetico(a)' },
  { id: 'obeso',           label: 'Obeso(a)' },
  { id: 'asmatico',        label: 'Asmatico(a)' },
  { id: 'gestante',        label: 'Gestante' },
  { id: 'cardiopata',      label: 'Cardiopata' },
  { id: 'dpoc',            label: 'DPOC' },
  { id: 'imunossuprimido', label: 'Imunossuprimido(a)' },
];

const STEPPER_LABELS = ['Contexto', 'Sintomas', 'Resultado'];

export function TriagemPasso1() {
  const navigate = useNavigate();
  const { pacienteId } = useParams();
  const {
    paciente, visitaId, observacao, riskFactors, catalogo,
    triagemConcluida,
    setPaciente, setObservacao,
    toggleRiskFactor, setRiskFactors, setCatalogo, reset,
  } = useTriagemStore();

  const [loading, setLoading] = useState(true);
  const [erro, setErro]       = useState<string | null>(null);

  // Extra patient data not in the triagem store
  const [pacCns, setPacCns]               = useState<string | undefined>();
  const [pacMicroarea, setPacMicroarea]    = useState<string | undefined>();
  const [pacComorbidades, setPacComorbidades] = useState<Comorbidade[]>([]);

  useEffect(() => {
    if (!pacienteId) return;
    // Triagem já concluída neste fluxo — não buscar/popular store; o
    // guard abaixo redirecionará imediatamente para o perfil.
    if (triagemConcluida) return;
    let cancelado = false;

    async function carregar() {
      setLoading(true);
      setErro(null);
      try {
        const idNum = Number(pacienteId);
        if (paciente && paciente.id !== idNum) reset();

        const [{ data: pac }, { data: cat }] = await Promise.all([
          pacientesService.buscarPorId(idNum),
          catalogo
            ? Promise.resolve({ data: catalogo })
            : triagensService.catalogo(),
        ]);

        if (cancelado) return;

        const idade = calcularIdade(pac.data_nascimento);
        setPaciente({
          id:          pac.id,
          nome:        pac.nome,
          idade,
          sexo:        pac.sexo,
          faixaEtaria: idadeParaFaixaEtaria(idade),
        });

        setPacCns(pac.cns);
        setPacMicroarea(pac.microarea_nome);
        setPacComorbidades(pac.comorbidades ?? []);

        if (!catalogo) setCatalogo(cat);

        if (riskFactors.length === 0 && pac.comorbidades?.length) {
          setRiskFactors(pac.comorbidades as Comorbidade[]);
        }
      } catch (err: any) {
        if (!cancelado) {
          setErro(err?.response?.data?.message ?? 'Erro ao carregar triagem.');
        }
      } finally {
        if (!cancelado) setLoading(false);
      }
    }

    carregar();
    return () => { cancelado = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  /* ── Guard: triagem concluida ────────────────────────────── */
  if (triagemConcluida && pacienteId) {
    return <Navigate to={`/paciente/${pacienteId}`} replace />;
  }

  /* ── Guard: triagem sem visita ───────────────────────────── */
  // Triagem só pode ser iniciada a partir de uma visita registrada.
  if (!triagemConcluida && !loading && !visitaId && pacienteId) {
    return <Navigate to={`/paciente/${pacienteId}`} replace />;
  }

  /* ── Loading ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center gap-2 text-acs-ink-3">
        <Loader2 size={20} className="animate-spin" />
        Carregando...
      </div>
    );
  }

  /* ── Error ───────────────────────────────────────────────── */
  if (erro || !paciente) {
    return (
      <div className="h-full flex flex-col p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-acs-ink mb-6">
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="flex items-start gap-3 bg-acs-vermelho-100 border border-acs-vermelho/20 rounded-xl p-4">
          <AlertCircle size={18} className="text-acs-vermelho flex-shrink-0 mt-0.5" />
          <p className="text-sm text-acs-vermelho">{erro ?? 'Paciente não encontrado.'}</p>
        </div>
      </div>
    );
  }

  /* ── Helpers ─────────────────────────────────────────────── */
  const initials = paciente.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  // Which risk factors came from the patient's record (locked)
  const lockedFactors = pacComorbidades;
  // Observed = currently selected minus the locked ones
  const observedFactorIds = riskFactors.filter((f) => !lockedFactors.includes(f));

  return (
    <div className="h-full flex flex-col bg-acs-paper overflow-y-auto pb-28">
      {/* ── Header + Stepper ───────────────────────────────── */}
      <div className="bg-white border-b border-acs-line px-5 pt-4 pb-5">
        {/* Top row */}
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-acs-paper shrink-0"
          >
            <ArrowLeft size={20} className="text-acs-ink" />
          </button>
          <div className="min-w-0">
            <h2 className="font-display text-[18px] font-bold leading-tight text-acs-ink">
              Nova triagem
            </h2>
            <p className="text-[13px] text-acs-ink-3 truncate">
              {paciente.nome} &middot; {paciente.idade} anos
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mt-5">
          {STEPPER_LABELS.map((label, i) => {
            const isActive  = i === 0;
            const isDone    = false; // step 1 is current
            return (
              <div key={label} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive
                        ? 'bg-acs-azul text-white'
                        : isDone
                          ? 'bg-acs-azul text-white'
                          : 'bg-acs-paper-2 border border-acs-line text-acs-ink-3'
                    }`}
                  >
                    {i + 1}
                  </div>
                  {isActive && (
                    <span className="text-[11px] font-semibold text-acs-azul whitespace-nowrap">
                      {label}
                    </span>
                  )}
                </div>
                {i < STEPPER_LABELS.length - 1 && (
                  <div className="flex-1 h-[2px] bg-acs-paper-2 mx-2 self-start mt-3.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────── */}
      <div className="flex-1 px-5 py-5 space-y-6">

        {/* Patient hero card */}
        <div className="bg-gradient-to-br from-acs-azul to-acs-azul-700 rounded-[18px] p-5 text-white flex items-center gap-4">
          {/* Initials */}
          <div className="w-[52px] h-[52px] rounded-[14px] bg-white/15 flex items-center justify-center shrink-0">
            <span className="font-display text-[18px] font-bold text-white/90">{initials}</span>
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-display text-[16px] font-bold leading-tight truncate">
              {paciente.nome}
            </p>
            <p className="font-mono text-[11px] text-white/60 mt-0.5 tracking-wide truncate">
              {pacCns ? `CNS ${pacCns}` : 'CNS --'}
              {pacMicroarea ? ` \u00B7 MA ${pacMicroarea}` : ''}
            </p>
          </div>
          {/* Age + sex */}
          <div className="text-right shrink-0">
            <p className="font-display text-[22px] font-bold leading-none">
              {paciente.idade}
            </p>
            <p className="text-[11px] text-white/60 mt-0.5">
              anos &middot; {paciente.sexo === 'm' ? 'M' : 'F'}
            </p>
          </div>
        </div>

        {/* ── Section 01: Fatores de risco ─────────────────── */}
        <div>
          <p className="eyebrow mb-1">01</p>
          <h3 className="font-display text-[17px] font-bold text-acs-ink leading-tight">
            Fatores de risco
          </h3>
          <p className="text-[12px] text-acs-ink-3 mb-3">
            Pre-selecionados do prontuario. Ajuste se necessario.
          </p>

          {/* From patient record (locked) */}
          {lockedFactors.length > 0 && (
            <div className="bg-acs-azul-050 border border-acs-azul-100 rounded-2xl p-3.5 mb-3">
              <p className="eyebrow mb-2">Do cadastro</p>
              <div className="flex flex-wrap gap-2">
                {lockedFactors.map((fId) => {
                  const f = FATORES_RISCO.find((r) => r.id === fId);
                  if (!f) return null;
                  return (
                    <span
                      key={f.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-acs-azul text-[12px] font-semibold"
                    >
                      <Lock size={11} strokeWidth={2.2} className="opacity-60" />
                      {f.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Observed this visit (toggleable) */}
          <p className="eyebrow mb-2">Observados nesta visita</p>
          <div className="flex flex-wrap gap-2">
            {FATORES_RISCO.filter((f) => !lockedFactors.includes(f.id)).map((f) => {
              const ativo = observedFactorIds.includes(f.id);
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggleRiskFactor(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all ${
                    ativo
                      ? 'bg-acs-ink text-white'
                      : 'bg-white text-acs-ink border border-acs-line'
                  }`}
                >
                  {ativo && <Check size={12} strokeWidth={2.5} />}
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Section 02: Anotações ────────────────────────── */}
        <div>
          <p className="eyebrow mb-1">02</p>
          <h3 className="font-display text-[17px] font-bold text-acs-ink leading-tight">
            Anotações
          </h3>
          <p className="text-[12px] text-acs-ink-3 mb-3">
            Observações livres sobre a visita.
          </p>

          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observações sobre a visita..."
            className="w-full px-4 py-3 rounded-xl border border-acs-line bg-white text-acs-ink placeholder:text-acs-ink-4 focus:outline-none focus:ring-2 focus:ring-acs-azul/40 focus:border-acs-azul resize-none text-[14px]"
            rows={4}
          />
        </div>
      </div>

      {/* ── Footer CTA bar ─────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-acs-line px-5 py-4 flex items-center gap-3 max-w-[800px] mx-auto">
        <button
          type="button"
          className="px-4 py-3 rounded-xl text-acs-azul text-[14px] font-semibold hover:bg-acs-azul-050 transition-colors"
        >
          Salvar rascunho
        </button>
        <button
          onClick={() => navigate(`/triagem/${paciente.id}/passo2`)}
          className="flex-1 flex items-center justify-center gap-2 py-3 bg-acs-azul text-white rounded-xl font-semibold text-[14px] hover:bg-acs-azul-900 transition-colors"
        >
          Próximo: sintomas
          <ArrowRight size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
