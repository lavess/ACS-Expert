import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Pencil,
  Loader2,
  AlertCircle,
  MapPin,
  ClipboardList,
  FileText,
  ChevronRight,
  User,
  CreditCard,
  Hash,
  Map,
  UserCheck,
  Home,
  Phone,
  Navigation,
  Heart,
  ShieldAlert,
  Accessibility,
  HandCoins,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { RiskBadge } from '../components/RiskBadge';
import {
  pacientesService,
  calcularIdade,
  riscoToUI,
  type PacienteDetalhe,
} from '@/services/pacientesService';
import {
  triagensService,
  labelPrioridade,
  labelAcao,
  corPrioridade,
  type TriagemResumo,
} from '@/services/triagensService';
import {
  encaminhamentosService,
  TIPO_ENCAMINHAMENTO_LABEL,
  type EncaminhamentoAPI,
} from '@/services/encaminhamentosService';
import {
  RegistrarEncaminhamentoSheet,
  RegistrarDesfechoSheet,
  EncaminhamentoVencidoBadge,
} from '@/features/encaminhamentos';
import { RegistrarVisitaSheet } from '@/features/visitas/RegistrarVisitaSheet';
import { HistoricoVisitas } from '@/features/visitas/HistoricoVisitas';
import type { Comorbidade } from '@/types';

const COMORBIDADE_LABEL: Record<Comorbidade, string> = {
  fumante:          'Fumante',
  hipertenso:       'Hipertenso(a)',
  diabetico:        'Diabetico(a)',
  obeso:            'Obeso(a)',
  asmatico:         'Asmatico(a)',
  gestante:         'Gestante',
  cardiopata:       'Cardiopata',
  dpoc:             'DPOC',
  imunossuprimido:  'Imunossuprimido(a)',
};

function formatarCPF(cpf?: string) {
  if (!cpf) return '\u2014';
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatarCNS(cns?: string) {
  if (!cns) return '\u2014';
  const d = cns.replace(/\D/g, '');
  if (d.length !== 15) return cns;
  return `${d.slice(0, 3)} ${d.slice(3, 7)} ${d.slice(7, 11)} ${d.slice(11)}`;
}

/* Risk color map for gradients and avatar tones */
const RISK_COLORS: Record<string, { gradient: string; avatarBg: string; avatarFg: string; dot: string }> = {
  urgent:  { gradient: 'rgba(200,54,74,.08)',  avatarBg: 'var(--acs-vermelho-100)', avatarFg: 'var(--acs-vermelho)',  dot: 'var(--acs-vermelho)' },
  warning: { gradient: 'rgba(242,177,52,.10)', avatarBg: 'var(--acs-amar-100)',     avatarFg: 'var(--acs-amar)',      dot: 'var(--acs-amar)' },
  low:     { gradient: 'rgba(47,158,110,.08)', avatarBg: 'var(--acs-verde-100)',    avatarFg: 'var(--acs-verde)',     dot: 'var(--acs-verde)' },
};

/* Status badge styles for encaminhamentos */
const ENC_STATUS: Record<string, { bg: string; fg: string; label: string }> = {
  realizado:  { bg: 'bg-acs-verde-100',    fg: 'text-acs-verde',    label: 'Realizado' },
  pendente:   { bg: 'bg-acs-amar-100',     fg: 'text-acs-amar',     label: 'Pendente' },
  ausencia:   { bg: 'bg-acs-vermelho-100', fg: 'text-acs-vermelho', label: 'Ausencia' },
  cancelado:  { bg: 'bg-acs-vermelho-100', fg: 'text-acs-vermelho', label: 'Cancelado' },
};

/* ── DataRow helper ─────────────────────────────────────────── */
function DataRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-7 h-7 rounded-lg bg-acs-azul-050 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-acs-azul-700" strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-acs-ink-3 leading-tight">{label}</p>
        <p className="text-sm font-medium text-acs-ink truncate">{value}</p>
      </div>
    </div>
  );
}

/* ── FlagBadge helper ───────────────────────────────────────── */
function FlagBadge({ icon: Icon, label, variant }: { icon: React.ElementType; label: string; variant: 'coral' | 'amar' | 'azul' }) {
  const styles = {
    coral: 'bg-acs-coral-100 text-acs-coral border-acs-coral-300',
    amar:  'bg-acs-amar-100 text-acs-amar border-acs-amar',
    azul:  'bg-acs-azul-100 text-acs-azul border-acs-azul-300',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${styles[variant]}`}>
      <Icon size={13} strokeWidth={2} />
      {label}
    </span>
  );
}

export function PerfilPaciente() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [paciente, setPaciente] = useState<PacienteDetalhe | null>(null);
  const [loading, setLoading]   = useState(true);
  const [erro, setErro]         = useState<string | null>(null);

  const [triagens, setTriagens] = useState<TriagemResumo[]>([]);
  const [encaminhamentos, setEncaminhamentos] = useState<EncaminhamentoAPI[]>([]);
  const [sheetEncOpen, setSheetEncOpen]   = useState(false);
  const [encDesfecho, setEncDesfecho]     = useState<EncaminhamentoAPI | null>(null);
  const [sheetVisitaOpen, setSheetVisitaOpen] = useState(false);
  const [visitaRefreshKey, setVisitaRefreshKey] = useState(0);

  function recarregarEncaminhamentos(idNum: number) {
    return encaminhamentosService
      .listar({ paciente_id: idNum, limit: 30 })
      .then((r) => setEncaminhamentos(r.data))
      .catch(() => setEncaminhamentos([]));
  }

  useEffect(() => {
    if (!id) return;
    let cancelado = false;
    setLoading(true);
    setErro(null);

    const idNum = Number(id);
    Promise.all([
      pacientesService.buscarPorId(idNum),
      triagensService.listar({ paciente_id: idNum, limit: 20 }).catch(() => ({ data: [] as TriagemResumo[] })),
      encaminhamentosService.listar({ paciente_id: idNum, limit: 30 }).catch(() => ({ data: [] as EncaminhamentoAPI[] })),
    ])
      .then(([pacRes, triRes, encRes]) => {
        if (cancelado) return;
        setPaciente(pacRes.data);
        setTriagens(triRes.data);
        setEncaminhamentos(encRes.data);
      })
      .catch((err) => {
        if (!cancelado) setErro(err?.response?.data?.message ?? 'Erro ao carregar paciente.');
      })
      .finally(() => { if (!cancelado) setLoading(false); });
    return () => { cancelado = true; };
  }, [id]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center gap-2 text-acs-ink-3">
        <Loader2 size={20} className="animate-spin" />
        Carregando paciente...
      </div>
    );
  }

  if (erro || !paciente) {
    return (
      <div className="h-full flex flex-col p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-acs-ink mb-6">
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="flex items-start gap-3 bg-acs-vermelho-100 border border-acs-vermelho rounded-xl p-4">
          <AlertCircle size={18} className="text-acs-vermelho flex-shrink-0 mt-0.5" />
          <p className="text-sm text-acs-vermelho">{erro ?? 'Paciente não encontrado.'}</p>
        </div>
      </div>
    );
  }

  const risco    = riscoToUI(paciente.nivel_risco);
  const idade    = calcularIdade(paciente.data_nascimento);
  const endereco = [paciente.logradouro, paciente.numero].filter(Boolean).join(', ');
  const riscoLabel =
    paciente.nivel_risco === 'alto'     ? 'ALTO RISCO'     :
    paciente.nivel_risco === 'moderado' ? 'RISCO MODERADO' :
                                          'BAIXO RISCO';
  const rc = RISK_COLORS[risco] ?? RISK_COLORS.low;

  const bandeirasSociais: { label: string; icon: React.ElementType; variant: 'coral' | 'amar' | 'azul' }[] = [
    ...(paciente.idoso_mora_sozinho     ? [{ label: 'Idoso mora sozinho',      icon: ShieldAlert,   variant: 'coral' as const }] : []),
    ...(paciente.vulnerabilidade_social ? [{ label: 'Vulnerabilidade social',  icon: Heart,         variant: 'coral' as const }] : []),
    ...(paciente.dificuldade_locomocao  ? [{ label: 'Dificuldade de locomoção', icon: Accessibility, variant: 'amar' as const }] : []),
    ...(paciente.beneficio_social       ? [{ label: 'Benefício social',        icon: HandCoins,     variant: 'azul' as const }] : []),
  ];

  const irParaEditar = () => {
    navigate(`/paciente/${paciente.id}/editar`);
  };

  /* Alert cards for high-risk patients */
  const alertCards: { text: string; color: string; borderColor: string; icon: React.ElementType }[] = [];
  if (paciente.nivel_risco === 'alto') {
    alertCards.push({
      text: 'Paciente classificado como alto risco. Acompanhamento prioritario recomendado.',
      color: 'text-acs-vermelho',
      borderColor: 'var(--acs-vermelho)',
      icon: AlertCircle,
    });
  }

  return (
    <>
      {/* pulse-red keyframes */}
      <style>{`
        @keyframes pulse-red {
          0%, 100% { box-shadow: 0 0 0 0 rgba(200,54,74,.55); }
          50% { box-shadow: 0 0 0 6px rgba(200,54,74,0); }
        }
        .pulse-red-dot { animation: pulse-red 2s ease-in-out infinite; }
      `}</style>

      <div className="h-full flex flex-col overflow-y-auto pb-28 lg:pb-8">
        {/* ── Hero Card ──────────────────────────────────────────── */}
        <div
          className="relative px-5 pt-4 pb-5 lg:px-8 lg:pt-6 lg:pb-6"
          style={{ background: `linear-gradient(135deg, ${rc.gradient} 0%, transparent 60%)` }}
        >
          {/* Top bar: back + desktop actions */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate(-1)} aria-label="Voltar" className="p-1 -ml-1">
              <ArrowLeft size={22} className="text-acs-ink" />
            </button>
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={irParaEditar}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-acs-azul text-acs-azul text-sm font-semibold hover:bg-acs-azul-050 transition-colors"
              >
                <Pencil size={15} strokeWidth={1.8} /> Editar
              </button>
              <button
                onClick={() => setSheetVisitaOpen(true)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-acs-coral text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Home size={15} strokeWidth={2} /> Registrar visita
              </button>
            </div>
          </div>

          {/* Avatar + Identity */}
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div
                className="w-[60px] h-[60px] lg:w-[80px] lg:h-[80px] rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: rc.avatarBg }}
              >
                <User size={28} className="lg:hidden" style={{ color: rc.avatarFg }} strokeWidth={1.8} />
                <User size={36} className="hidden lg:block" style={{ color: rc.avatarFg }} strokeWidth={1.8} />
              </div>
              {risco === 'urgent' && (
                <span
                  className="pulse-red-dot absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                  style={{ backgroundColor: 'var(--acs-vermelho)' }}
                />
              )}
            </div>

            {/* Name + meta */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h1 className="font-display font-bold text-acs-ink text-xl lg:text-[28px] leading-tight truncate">
                {paciente.nome}
              </h1>
              <p className="text-sm text-acs-ink-2 mt-1">
                {idade} anos
                <span className="mx-1.5 text-acs-ink-4">&middot;</span>
                {paciente.sexo === 'm' ? 'Masculino' : 'Feminino'}
                <span className="mx-1.5 text-acs-ink-4">&middot;</span>
                <span className="font-mono text-xs">{formatarCPF(paciente.cpf)}</span>
              </p>
              <div className="mt-2 flex items-center gap-3 flex-wrap">
                <RiskBadge level={risco} label={`${riscoLabel} ${paciente.score_risco_atual ? paciente.score_risco_atual + '%' : ''}`} />
                {paciente.data_ultima_triagem && (
                  <span className="text-[11px] font-mono text-acs-ink-3">
                    Triagem: {new Date(paciente.data_ultima_triagem).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Alert cards in hero */}
          {alertCards.length > 0 && (
            <div className="mt-4 space-y-2">
              {alertCards.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 bg-white rounded-xl p-3"
                  style={{ borderLeft: `4px solid ${alert.borderColor}`, boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}
                >
                  <alert.icon size={16} className={`flex-shrink-0 mt-0.5 ${alert.color}`} />
                  <p className={`text-sm ${alert.color}`}>{alert.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Main Content (2-col on desktop) ────────────────────── */}
        <div className="flex-1 px-5 py-5 lg:px-8 lg:grid lg:grid-cols-[2fr_1fr] lg:gap-6">

          {/* ── Left Column: Timeline + Encaminhamentos ──────────── */}
          <div className="space-y-6">

            {/* Historico de Triagens */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="eyebrow">Histórico de triagens</h3>
                {triagens.length > 0 && (
                  <span className="eyebrow">{triagens.length} registro(s)</span>
                )}
              </div>

              {triagens.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-acs-ink-4/30 text-center" style={{ boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}>
                  <ClipboardList size={28} className="text-acs-ink-4 mx-auto mb-2" strokeWidth={1.8} />
                  <p className="text-sm text-acs-ink-3 mb-1">Nenhuma triagem registrada</p>
                  <p className="text-xs text-acs-ink-4 mb-4">
                    As triagens realizadas com este paciente aparecerão aqui.
                  </p>
                  <button
                    onClick={() => setSheetVisitaOpen(true)}
                    className="text-sm text-acs-coral font-semibold hover:underline"
                  >
                    Registrar uma visita para iniciar &rarr;
                  </button>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical timeline line */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-acs-ink-4/20" />

                  <div className="space-y-3">
                    {triagens.map((triagem) => {
                      const tRisco = riscoToUI(triagem.nivel_risco);
                      const tCorPrio = corPrioridade(triagem.nivel_prioridade);
                      const dotColor =
                        tRisco === 'urgent'  ? 'var(--acs-vermelho)' :
                        tRisco === 'warning' ? 'var(--acs-amar)' : 'var(--acs-verde)';

                      return (
                        <button
                          key={triagem.id}
                          onClick={() => navigate(`/triagem/${triagem.id}/detalhe`)}
                          className="relative flex gap-4 w-full text-left group"
                        >
                          {/* Dot */}
                          <div className="relative z-10 mt-4 flex-shrink-0">
                            <div
                              className="w-[22px] h-[22px] rounded-full border-[3px] border-white"
                              style={{ backgroundColor: dotColor, boxShadow: '0 0 0 2px rgba(10,20,40,.06)' }}
                            />
                          </div>

                          {/* Card */}
                          <div className="flex-1 bg-white rounded-2xl p-4 border border-acs-line group-hover:border-acs-azul-300 transition-colors" style={{ boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-mono text-[11px] text-acs-ink-4 tracking-wider">TRG-{triagem.id}</p>
                                <p className="text-sm font-semibold text-acs-ink">
                                  {new Date(triagem.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </p>
                              </div>
                              <RiskBadge level={tRisco} label={`${triagem.score_final}%`} />
                            </div>

                            {triagem.top_doenca_nome && (
                              <p className="text-sm text-acs-ink-2 mb-2">
                                <span className="font-semibold text-acs-ink">Hipótese:</span> {triagem.top_doenca_nome}
                                {triagem.top_doenca_score != null && (
                                  <span className="font-mono text-xs text-acs-ink-3 ml-1">({triagem.top_doenca_score}%)</span>
                                )}
                              </p>
                            )}

                            <p className="text-sm text-acs-ink-2 mb-3">
                              <span className="font-semibold text-acs-ink">Ação:</span> {labelAcao(triagem.acao_recomendada)}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="eyebrow">
                                  {labelPrioridade(triagem.nivel_prioridade)}
                                </span>
                                {triagem.visita_id && (
                                  <span className="font-mono text-[9px] text-acs-ink-3 bg-acs-paper px-1.5 py-0.5 rounded">
                                    Visita #{triagem.visita_id}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-acs-azul font-semibold group-hover:underline flex items-center gap-1">
                                Ver detalhe <ChevronRight size={12} />
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* Visitas domiciliares */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="eyebrow">Visitas domiciliares</h3>
                <button
                  onClick={() => setSheetVisitaOpen(true)}
                  className="text-xs font-semibold text-acs-azul hover:underline"
                >
                  Registrar +
                </button>
              </div>
              <HistoricoVisitas pacienteId={paciente.id} refreshKey={visitaRefreshKey} />
            </section>

            {/* Encaminhamentos */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className="eyebrow">Encaminhamentos</h3>
                <div className="flex items-center gap-3">
                  {encaminhamentos.length > 0 && (
                    <span className="eyebrow">{encaminhamentos.length} registro(s)</span>
                  )}
                  <button
                    onClick={() => setSheetEncOpen(true)}
                    className="text-xs font-semibold text-acs-coral hover:underline"
                  >
                    Novo +
                  </button>
                </div>
              </div>

              {encaminhamentos.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 border-2 border-dashed border-acs-ink-4/30 text-center" style={{ boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}>
                  <FileText size={28} className="text-acs-ink-4 mx-auto mb-2" strokeWidth={1.8} />
                  <p className="text-sm text-acs-ink-3 mb-1">Nenhum encaminhamento registrado</p>
                  <p className="text-xs text-acs-ink-4 mb-4">
                    Encaminhamentos para UBS, consultas ou exames aparecerao aqui.
                  </p>
                  <button
                    onClick={() => setSheetEncOpen(true)}
                    className="text-sm text-acs-coral font-semibold hover:underline"
                  >
                    Registrar primeiro encaminhamento &rarr;
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {encaminhamentos.map((enc) => {
                    const st        = ENC_STATUS[enc.status] ?? ENC_STATUS.pendente;
                    const tipoLabel = TIPO_ENCAMINHAMENTO_LABEL[enc.tipo];
                    const dataFmt   = new Date(enc.data_encaminhamento).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    });
                    return (
                      <div
                        key={enc.id}
                        className="bg-white rounded-2xl p-3.5 border border-acs-line"
                        style={{ boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-acs-azul-050 flex items-center justify-center flex-shrink-0">
                            <FileText size={16} className="text-acs-azul-700" strokeWidth={1.8} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-acs-ink text-sm">{tipoLabel}</p>
                              {enc.vencido === 1 && (
                                <EncaminhamentoVencidoBadge diasAtraso={enc.dias_atraso ?? null} />
                              )}
                            </div>
                            <p className="text-xs text-acs-ink-3 font-mono">{dataFmt}</p>
                            {enc.unidade_saude_nome && (
                              <p className="text-xs text-acs-ink-3 truncate">{enc.unidade_saude_nome}</p>
                            )}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${st.bg} ${st.fg}`}>
                            {st.label}
                          </span>
                        </div>

                        {enc.status === 'pendente' && (
                          <button
                            onClick={() => setEncDesfecho(enc)}
                            className="mt-3 w-full py-2 bg-acs-azul text-white rounded-xl text-xs font-semibold hover:bg-acs-azul-700 transition-colors"
                          >
                            Registrar Retorno
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── Right Column: Data Cards ─────────────────────────── */}
          <div className="space-y-4 mt-6 lg:mt-0">

            {/* Identificacao */}
            <div className="bg-white rounded-2xl p-4 border border-acs-line" style={{ boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}>
              <p className="eyebrow mb-3">{'Identifica\u00e7\u00e3o'}</p>
              <DataRow icon={CreditCard} label="CNS" value={formatarCNS(paciente.cns)} />
              <DataRow icon={Map} label={'Micro\u00e1rea'} value={paciente.microarea_nome ?? '\u2014'} />
              <DataRow icon={UserCheck} label={'ACS Respons\u00e1vel'} value={paciente.acs_nome ?? 'N\u00e3o atribu\u00eddo'} />
            </div>

            {/* Endereco */}
            {(endereco || paciente.bairro || paciente.cep || paciente.nome_referencia) && (
              <div className="bg-white rounded-2xl p-4 border border-acs-line" style={{ boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="eyebrow">Endereço</p>
                  {paciente.dom_latitude && paciente.dom_longitude && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${paciente.dom_latitude},${paciente.dom_longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-acs-azul hover:underline"
                    >
                      <Navigation size={12} strokeWidth={2} /> Rota
                    </a>
                  )}
                </div>
                <DataRow icon={Home} label="Logradouro" value={endereco || '\u2014'} />
                {paciente.complemento && (
                  <DataRow icon={Hash} label="Complemento" value={paciente.complemento} />
                )}
                {(paciente.bairro || paciente.cep) && (
                  <DataRow icon={MapPin} label="Bairro / CEP" value={[paciente.bairro, paciente.cep].filter(Boolean).join(' \u2014 ')} />
                )}
                {paciente.nome_referencia && (
                  <div className="mt-2 rounded-lg bg-acs-paper-2 px-3 py-2">
                    <p className="text-xs text-acs-ink-3 italic">Ref.: {paciente.nome_referencia}</p>
                  </div>
                )}
              </div>
            )}

            {/* Contexto social */}
            {bandeirasSociais.length > 0 && (
              <div className="bg-white rounded-2xl p-4 border border-acs-line" style={{ boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}>
                <p className="eyebrow mb-3">Contexto social</p>
                <div className="flex flex-wrap gap-2">
                  {bandeirasSociais.map((b) => (
                    <FlagBadge key={b.label} icon={b.icon} label={b.label} variant={b.variant} />
                  ))}
                </div>
              </div>
            )}

            {/* Comorbidades */}
            <div className="bg-white rounded-2xl p-4 border border-acs-line" style={{ boxShadow: '0 1px 2px rgba(10,20,40,.06)' }}>
              <p className="eyebrow mb-3">Comorbidades</p>
              {paciente.comorbidades && paciente.comorbidades.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {paciente.comorbidades.map((c) => (
                    <span
                      key={c}
                      className="px-3 py-1.5 bg-acs-azul-050 text-acs-azul rounded-full text-xs font-semibold"
                    >
                      {COMORBIDADE_LABEL[c] ?? c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-acs-ink-3">Nenhuma comorbidade registrada.</p>
              )}
            </div>
          </div>
        </div>

        {/* ── Mobile Footer (fixed) ──────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-acs-line p-4 max-w-[800px] mx-auto lg:hidden">
          <div className="flex gap-3">
            <button
              onClick={() => setSheetVisitaOpen(true)}
              className="flex-1 py-3 bg-acs-azul text-white rounded-xl font-semibold hover:bg-acs-azul-700 transition-colors flex items-center justify-center gap-2"
            >
              <Home size={18} strokeWidth={2} />
              Registrar Visita
            </button>
            {paciente.dom_latitude && paciente.dom_longitude && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${paciente.dom_latitude},${paciente.dom_longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-12 h-12 flex items-center justify-center rounded-xl border border-acs-azul text-acs-azul hover:bg-acs-azul-050 transition-colors"
                aria-label="Abrir rota no mapa"
              >
                <MapPin size={20} strokeWidth={1.8} />
              </a>
            )}
            <a
              href={`tel:`}
              className="w-12 h-12 flex items-center justify-center rounded-xl border border-acs-azul text-acs-azul hover:bg-acs-azul-050 transition-colors"
              aria-label="Ligar"
            >
              <Phone size={20} strokeWidth={1.8} />
            </a>
          </div>
        </div>

        {/* Sheet de visita */}
        <RegistrarVisitaSheet
          open={sheetVisitaOpen}
          pacienteId={paciente.id}
          pacienteNome={paciente.nome}
          onClose={() => setSheetVisitaOpen(false)}
          onSuccess={() => setVisitaRefreshKey((k) => k + 1)}
        />

        {/* Sheets de encaminhamento */}
        <RegistrarEncaminhamentoSheet
          open={sheetEncOpen}
          onClose={() => setSheetEncOpen(false)}
          pacienteId={paciente.id}
          pacienteNome={paciente.nome}
          onSuccess={() => recarregarEncaminhamentos(paciente.id)}
        />
        <RegistrarDesfechoSheet
          encaminhamento={encDesfecho}
          onClose={() => setEncDesfecho(null)}
          onSuccess={() => {
            setEncDesfecho(null);
            recarregarEncaminhamentos(paciente.id);
          }}
        />
      </div>
    </>
  );
}
