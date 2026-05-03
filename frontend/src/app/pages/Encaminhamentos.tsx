import { useEffect, useMemo, useState } from 'react';
import {
  Clock, CheckCircle2, XCircle, Loader2, AlertCircle,
  Stethoscope, Syringe, FlaskConical, Activity, UserPlus, Hospital,
  ChevronRight, FileText, MapPin,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from '../components/BottomNav';
import {
  encaminhamentosService,
  TIPO_ENCAMINHAMENTO_LABEL,
  diasDesde,
  type EncaminhamentoAPI,
} from '@/services/encaminhamentosService';
import { RegistrarDesfechoSheet } from '@/features/encaminhamentos/RegistrarDesfechoSheet';
import { EncaminhamentoVencidoBadge } from '@/features/encaminhamentos';
import type { TipoEncaminhamento, StatusEncaminhamento } from '@/types';

/* ── Visual map dos tipos ────────────────────────────────── */
const TIPO_META: Record<TipoEncaminhamento, { icon: React.ElementType; color: string }> = {
  consulta_medica: { icon: Stethoscope, color: 'var(--acs-azul)'     },
  enfermagem:      { icon: Activity,    color: '#8B5CF6'             },
  vacinacao:       { icon: Syringe,     color: 'var(--acs-verde)'    },
  exame:           { icon: FlaskConical, color: 'var(--acs-amar)'    },
  urgencia:        { icon: Hospital,    color: 'var(--acs-vermelho)' },
  especialista:    { icon: UserPlus,    color: 'var(--acs-coral)'    },
};

type TabId = 'todos' | 'pendentes' | 'vencidos' | 'realizados' | 'ausencia';

const TABS: { id: TabId; label: string; status?: StatusEncaminhamento[]; vencido?: boolean }[] = [
  { id: 'todos',      label: 'Todos' },
  { id: 'pendentes',  label: 'Pendentes',  status: ['pendente'] },
  { id: 'vencidos',   label: 'Vencidos',   vencido: true },
  { id: 'realizados', label: 'Realizados', status: ['realizado'] },
  { id: 'ausencia',   label: 'Ausência',   status: ['ausencia'] },
];

function formatarData(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function StatusInfo({ enc }: { enc: EncaminhamentoAPI }) {
  if (enc.status === 'pendente') {
    const dias = diasDesde(enc.data_encaminhamento);
    return (
      <div className="flex items-center gap-2">
        <Clock size={16} className="text-acs-amar" />
        <span className="text-sm text-acs-amar">
          Pendente {dias != null ? `— há ${dias} dia${dias === 1 ? '' : 's'}` : ''}
        </span>
      </div>
    );
  }
  if (enc.status === 'realizado') {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle2 size={16} className="text-acs-verde" />
        <span className="text-sm text-acs-verde">
          Realizado em {formatarData(enc.data_desfecho)}
        </span>
      </div>
    );
  }
  if (enc.status === 'ausencia') {
    return (
      <div className="flex items-center gap-2">
        <XCircle size={16} className="text-acs-vermelho" />
        <span className="text-sm text-acs-vermelho">Paciente não compareceu</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <XCircle size={16} className="text-acs-ink-3" />
      <span className="text-sm text-acs-ink-3">Cancelado</span>
    </div>
  );
}

function CardEncaminhamento({
  enc,
  onAcao,
  onAbrirPaciente,
}: {
  enc: EncaminhamentoAPI;
  onAcao: (enc: EncaminhamentoAPI) => void;
  onAbrirPaciente: (id: number) => void;
}) {
  const meta = TIPO_META[enc.tipo];
  const Icon = meta.icon;

  // Botão contextual conforme spec:
  // - pendente → Registrar Retorno (abrir desfecho)
  // - ausencia → Agendar Nova Visita (idem — registrar nova ação)
  const acaoLabel =
    enc.status === 'pendente' ? 'Registrar Retorno' :
    enc.status === 'ausencia' ? 'Agendar Nova Visita' :
    null;

  return (
    <div className="card-acs p-4 border border-acs-line">
      {/* Cabeçalho: paciente + chevron */}
      <button
        onClick={() => onAbrirPaciente(enc.paciente_id)}
        className="w-full flex items-start gap-3 text-left mb-3"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: meta.color + '1A' }}
        >
          <Icon size={18} style={{ color: meta.color }} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-acs-ink truncate">
            {enc.paciente_nome ?? `Paciente #${enc.paciente_id}`}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              className="px-2 py-0.5 rounded-md font-mono text-[10px] font-semibold uppercase tracking-[.1em]"
              style={{ backgroundColor: meta.color + '1A', color: meta.color }}
            >
              {TIPO_ENCAMINHAMENTO_LABEL[enc.tipo]}
            </span>
            {enc.vencido === 1 && (
              <EncaminhamentoVencidoBadge diasAtraso={enc.dias_atraso ?? null} />
            )}
            <span className="text-xs text-acs-ink-3 font-mono">
              {formatarData(enc.data_encaminhamento)}
            </span>
          </div>
        </div>
        <ChevronRight size={16} className="text-acs-ink-4 flex-shrink-0 mt-1" />
      </button>

      {/* Motivo */}
      <p className="text-sm text-acs-ink-2 mb-2 line-clamp-2">{enc.motivo}</p>

      {/* Unidade */}
      {enc.unidade_saude_nome && (
        <div className="flex items-center gap-1.5 mb-3 text-xs text-acs-ink-3">
          <MapPin size={12} strokeWidth={1.8} />
          <span className="truncate">{enc.unidade_saude_nome}</span>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <StatusInfo enc={enc} />
        {enc.alerta_gerado === 1 && enc.status === 'ausencia' && (
          <span className="font-mono text-[10px] uppercase tracking-[.1em] text-acs-vermelho">
            Alerta gerado
          </span>
        )}
      </div>

      {/* Botão contextual */}
      {acaoLabel && (
        <button
          onClick={() => onAcao(enc)}
          className="w-full py-2 bg-acs-azul text-white rounded-xl text-sm font-medium hover:bg-acs-azul-700 transition-colors"
        >
          {acaoLabel}
        </button>
      )}
    </div>
  );
}

export function Encaminhamentos() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>('pendentes');
  const [data, setData]           = useState<EncaminhamentoAPI[]>([]);
  const [loading, setLoading]     = useState(true);
  const [erro, setErro]           = useState<string | null>(null);

  // Sheet de desfecho
  const [encDesfecho, setEncDesfecho] = useState<EncaminhamentoAPI | null>(null);

  const carregar = useMemo(
    () => async () => {
      setLoading(true);
      setErro(null);
      try {
        const tab = TABS.find((t) => t.id === activeTab);
        const params: Parameters<typeof encaminhamentosService.listar>[0] = {};
        if (tab?.status)  params.status  = tab.status.join(',');
        if (tab?.vencido) params.vencido = 1;
        const { data } = await encaminhamentosService.listar(
          Object.keys(params).length ? params : undefined
        );
        setData(data);
      } catch (err: any) {
        setErro(err?.response?.data?.message ?? 'Erro ao carregar encaminhamentos.');
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    carregar();
  }, [carregar]);

  function handleAcao(enc: EncaminhamentoAPI) {
    if (enc.status === 'pendente') {
      // Abre o sheet de desfecho — o usuário escolhe realizado / ausência / cancelado
      setEncDesfecho(enc);
    } else if (enc.status === 'ausencia') {
      // Agendar nova visita — no escopo atual leva ao perfil do paciente
      // (a tela de agendamento é tema de outra história).
      navigate(`/paciente/${enc.paciente_id}`);
    }
  }

  return (
    <div className="h-full flex flex-col pb-16 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-acs-line px-6 py-4">
        <h2 className="font-display font-bold text-acs-ink mb-4 pl-12 lg:pl-0">Encaminhamentos</h2>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-acs-ink text-acs-paper'
                  : 'bg-acs-paper-2 text-acs-ink-3 border border-acs-line'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 px-6 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-acs-ink-3">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Carregando…</span>
          </div>
        ) : erro ? (
          <div className="flex items-start gap-3 bg-acs-vermelho-100 border border-acs-vermelho/30 rounded-xl p-4">
            <AlertCircle size={18} className="text-acs-vermelho flex-shrink-0 mt-0.5" />
            <p className="text-sm text-acs-vermelho">{erro}</p>
          </div>
        ) : data.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-acs-ink-4/30 text-center">
            <FileText size={32} className="text-acs-ink-4 mx-auto mb-3" strokeWidth={1.8} />
            <p className="text-sm text-acs-ink-3">
              Nenhum encaminhamento{' '}
              {activeTab !== 'todos' ? `na aba "${TABS.find((t) => t.id === activeTab)!.label}"` : ''}.
            </p>
          </div>
        ) : (
          data.map((enc) => (
            <CardEncaminhamento
              key={enc.id}
              enc={enc}
              onAcao={handleAcao}
              onAbrirPaciente={(id) => navigate(`/paciente/${id}`)}
            />
          ))
        )}
      </div>

      <BottomNav />

      {/* Sheet de desfecho */}
      <RegistrarDesfechoSheet
        encaminhamento={encDesfecho}
        onClose={() => setEncDesfecho(null)}
        onSuccess={() => {
          setEncDesfecho(null);
          carregar();
        }}
      />
    </div>
  );
}
