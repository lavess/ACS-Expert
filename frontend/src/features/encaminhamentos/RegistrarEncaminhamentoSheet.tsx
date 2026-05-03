import { useEffect, useMemo, useState } from 'react';
import {
  X, Loader2, AlertCircle, CheckCircle2,
  Stethoscope, Syringe, FlaskConical, Activity, UserPlus, Hospital,
} from 'lucide-react';
import {
  encaminhamentosService,
  TIPO_ENCAMINHAMENTO_LABEL,
  type CriarEncaminhamentoPayload,
} from '@/services/encaminhamentosService';
import {
  unidadesSaudeService,
  TIPO_UNIDADE_LABEL,
  type UnidadeSaudeAPI,
} from '@/services/unidadesSaudeService';
import type { TipoEncaminhamento } from '@/types';
import { useAuthStore } from '@/store/authStore';

/* ── Visual map dos tipos ────────────────────────────────── */
const TIPO_META: Record<TipoEncaminhamento, { icon: React.ElementType; color: string }> = {
  consulta_medica: { icon: Stethoscope, color: 'var(--acs-azul)'     },
  enfermagem:      { icon: Activity,    color: '#8B5CF6'             },
  vacinacao:       { icon: Syringe,     color: 'var(--acs-verde)'    },
  exame:           { icon: FlaskConical, color: 'var(--acs-amar)'    },
  urgencia:        { icon: Hospital,    color: 'var(--acs-vermelho)' },
  especialista:    { icon: UserPlus,    color: 'var(--acs-coral)'    },
};

const TIPOS: TipoEncaminhamento[] = [
  'consulta_medica', 'enfermagem', 'vacinacao', 'exame', 'urgencia', 'especialista',
];

interface Props {
  open:           boolean;
  onClose:        () => void;
  pacienteId:     number;
  pacienteNome?:  string;
  triagemId?:     number;
  /** Tipo sugerido (ex.: a partir da ação recomendada da triagem). */
  tipoSugerido?:  TipoEncaminhamento;
  /** Motivo pré-preenchido (ex.: hipótese da triagem). */
  motivoSugerido?: string;
  onSuccess?:     (id: number) => void;
}

export function RegistrarEncaminhamentoSheet({
  open, onClose, pacienteId, pacienteNome, triagemId,
  tipoSugerido, motivoSugerido, onSuccess,
}: Props) {
  const usuario = useAuthStore((s) => s.usuario);

  const [tipo, setTipo]                 = useState<TipoEncaminhamento>(tipoSugerido ?? 'consulta_medica');
  const [motivo, setMotivo]             = useState(motivoSugerido ?? '');
  const [unidadeId, setUnidadeId]       = useState<number | ''>('');
  const [dataPrevista, setDataPrevista] = useState('');
  const [unidades, setUnidades]         = useState<UnidadeSaudeAPI[]>([]);
  const [loadingUnidades, setLoadingUnidades] = useState(false);
  const [salvando, setSalvando]         = useState(false);
  const [erro, setErro]                 = useState<string | null>(null);
  const [sucesso, setSucesso]           = useState(false);

  // Reseta quando abrir / mudar paciente
  useEffect(() => {
    if (!open) return;
    setTipo(tipoSugerido ?? 'consulta_medica');
    setMotivo(motivoSugerido ?? '');
    setUnidadeId('');
    setDataPrevista('');
    setErro(null);
    setSucesso(false);
  }, [open, pacienteId, tipoSugerido, motivoSugerido]);

  // Carrega unidades do município do usuário
  useEffect(() => {
    if (!open) return;
    setLoadingUnidades(true);
    unidadesSaudeService
      .listar(usuario?.municipioId ? { municipio_id: usuario.municipioId } : undefined)
      .then((r) => setUnidades(r.data))
      .catch(() => setUnidades([]))
      .finally(() => setLoadingUnidades(false));
  }, [open, usuario?.municipioId]);

  const unidadesFiltradas = useMemo(() => {
    // Para urgência, ordena hospitais primeiro; para vacinação UBS primeiro
    const prefer = tipo === 'urgencia' ? 'hospital'
                 : tipo === 'exame'    ? 'laboratorio'
                 : 'ubs';
    return [...unidades].sort((a, b) => {
      const ap = a.tipo === prefer ? 0 : 1;
      const bp = b.tipo === prefer ? 0 : 1;
      if (ap !== bp) return ap - bp;
      return a.nome.localeCompare(b.nome);
    });
  }, [unidades, tipo]);

  if (!open) return null;

  const podeSalvar = motivo.trim().length > 2 && !salvando;

  async function handleSalvar() {
    if (!podeSalvar) return;
    setSalvando(true);
    setErro(null);
    try {
      const payload: CriarEncaminhamentoPayload = {
        paciente_id: pacienteId,
        triagem_id:  triagemId,
        tipo,
        motivo: motivo.trim(),
        unidade_saude_id: unidadeId === '' ? undefined : Number(unidadeId),
        data_prevista: dataPrevista || undefined,
        notificar_ausencia: true,
      };
      const { data } = await encaminhamentosService.criar(payload);
      setSucesso(true);
      onSuccess?.(data.id);
      setTimeout(() => onClose(), 900);
    } catch (err: any) {
      setErro(err?.response?.data?.message ?? 'Erro ao registrar encaminhamento.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[800px] bg-white rounded-t-3xl lg:rounded-3xl lg:mb-8 max-h-[90vh] overflow-y-auto shadow-[0_-8px_24px_rgba(10,20,40,.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <span className="w-10 h-1 rounded-full bg-acs-paper-2" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-3 pb-4 border-b border-acs-line">
          <div className="min-w-0 pr-4">
            <p className="eyebrow">Novo encaminhamento</p>
            <h3 className="font-display font-bold text-acs-ink truncate">
              {pacienteNome ?? `Paciente #${pacienteId}`}
            </h3>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-1 -mr-1">
            <X size={22} className="text-acs-ink-3" />
          </button>
        </div>

        {sucesso ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 gap-3">
            <div className="w-14 h-14 rounded-full bg-acs-verde-100 flex items-center justify-center">
              <CheckCircle2 size={26} className="text-acs-verde" />
            </div>
            <p className="text-sm font-semibold text-acs-ink">Encaminhamento registrado</p>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Tipo */}
            <div>
              <p className="eyebrow mb-2">Tipo de encaminhamento</p>
              <div className="grid grid-cols-3 gap-2">
                {TIPOS.map((t) => {
                  const meta   = TIPO_META[t];
                  const Icon   = meta.icon;
                  const ativo  = tipo === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTipo(t)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-colors ${
                        ativo
                          ? 'border-acs-azul bg-acs-azul-050'
                          : 'border-acs-line bg-white hover:border-acs-azul-300'
                      }`}
                    >
                      <Icon
                        size={20}
                        strokeWidth={ativo ? 2.2 : 1.8}
                        style={{ color: meta.color }}
                      />
                      <span className={`text-[11px] text-center leading-tight ${ativo ? 'font-semibold text-acs-ink' : 'text-acs-ink-2'}`}>
                        {TIPO_ENCAMINHAMENTO_LABEL[t]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Motivo */}
            <div>
              <label className="eyebrow mb-2 block" htmlFor="enc-motivo">
                Motivo / orientação clínica
              </label>
              <textarea
                id="enc-motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Ex.: Suspeita de hipertensão descompensada — solicitar consulta médica"
                className="w-full px-3 py-2.5 rounded-xl border border-acs-line text-sm text-acs-ink placeholder:text-acs-ink-4 focus:outline-none focus:border-acs-azul resize-none"
              />
            </div>

            {/* Unidade */}
            <div>
              <label className="eyebrow mb-2 block" htmlFor="enc-unidade">
                Unidade de saúde
              </label>
              <select
                id="enc-unidade"
                value={unidadeId}
                onChange={(e) => setUnidadeId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-acs-line text-sm text-acs-ink bg-white focus:outline-none focus:border-acs-azul"
              >
                <option value="">— a definir —</option>
                {loadingUnidades ? (
                  <option disabled>Carregando…</option>
                ) : (
                  unidadesFiltradas.map((u) => (
                    <option key={u.id} value={u.id}>
                      [{TIPO_UNIDADE_LABEL[u.tipo]}] {u.nome}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Data prevista */}
            <div>
              <label className="eyebrow mb-2 block" htmlFor="enc-data">
                Data prevista
              </label>
              <input
                id="enc-data"
                type="date"
                value={dataPrevista}
                onChange={(e) => setDataPrevista(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-acs-line text-sm text-acs-ink focus:outline-none focus:border-acs-azul"
              />
            </div>

            {/* Erro */}
            {erro && (
              <div className="flex items-start gap-2 bg-acs-vermelho-100 border border-acs-vermelho/30 rounded-xl p-3">
                <AlertCircle size={16} className="text-acs-vermelho flex-shrink-0 mt-0.5" />
                <p className="text-sm text-acs-vermelho">{erro}</p>
              </div>
            )}

            {/* Ações */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={salvando}
                className="flex-1 py-3 bg-white text-acs-azul rounded-xl font-semibold border border-acs-azul hover:bg-acs-azul-050 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={!podeSalvar}
                className="flex-1 py-3 bg-acs-coral text-white rounded-xl font-semibold hover:brightness-95 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(231,111,74,.3)]"
              >
                {salvando ? <Loader2 size={18} className="animate-spin" /> : null}
                {salvando ? 'Registrando…' : 'Registrar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
