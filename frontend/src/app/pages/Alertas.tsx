import { useEffect, useState } from 'react';
import {
  AlertCircle, Clock, Info, CheckCircle2,
  Loader2, BellOff, ChevronRight, RefreshCw, ClipboardCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { BottomNav } from '../components/BottomNav';
import { alertasService, type AlertaAPI, type UrgenciaAlerta } from '@/services/alertasService';

/* ── Configuração visual por urgência ─────────────────────── */
const URGENCIA_CFG: Record<UrgenciaAlerta, {
  label: string
  icon: React.ElementType
  cor: string
  bg: string
  border: string
}> = {
  urgente:     { label: 'Urgente',     icon: AlertCircle,   cor: 'var(--acs-vermelho)', bg: 'bg-red-50',       border: 'border-l-acs-vermelho' },
  atencao:     { label: 'Atenção',     icon: Clock,         cor: 'var(--acs-amar)',     bg: 'bg-yellow-50',    border: 'border-l-acs-amar' },
  informativo: { label: 'Informativo', icon: Info,          cor: 'var(--acs-azul)',     bg: 'bg-blue-50',      border: 'border-l-acs-azul' },
};

function tempoRelativo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  const h    = Math.floor(min / 60);
  const d    = Math.floor(h / 24);
  if (d > 0)  return `há ${d} dia${d > 1 ? 's' : ''}`;
  if (h > 0)  return `há ${h}h`;
  if (min > 0) return `há ${min}min`;
  return 'agora';
}

function CardAlerta({
  alerta,
  onResolver,
  onVerPaciente,
  onVerEncaminhamento,
  resolvendo,
}: {
  alerta: AlertaAPI
  onResolver: () => void
  onVerPaciente: () => void
  onVerEncaminhamento: () => void
  resolvendo: boolean
}) {
  const cfg = URGENCIA_CFG[alerta.urgencia];
  const Icon = cfg.icon;

  return (
    <div className={`bg-white rounded-2xl border border-acs-line border-l-4 ${cfg.border} shadow-[0_1px_2px_rgba(10,20,40,.06)] p-4`}>
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cfg.cor + '18' }}
        >
          <Icon size={18} style={{ color: cfg.cor }} strokeWidth={2} />
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <h4 className="font-semibold text-acs-ink text-sm leading-tight">{alerta.titulo}</h4>
            <span className="font-mono text-[10px] text-acs-ink-3 flex-shrink-0">
              {tempoRelativo(alerta.created_at)}
            </span>
          </div>

          {alerta.paciente_nome && (
            <button
              onClick={onVerPaciente}
              className="inline-flex items-center gap-1 text-xs text-acs-azul font-medium hover:underline mb-1"
            >
              {alerta.paciente_nome}
              <ChevronRight size={11} strokeWidth={2.2} />
            </button>
          )}

          <p className="text-xs text-acs-ink-3 leading-relaxed mb-3">{alerta.mensagem}</p>

          {/* Ações */}
          <div className="flex items-center gap-4 flex-wrap">
            {alerta.encaminhamento_id && (
              <button
                onClick={onVerEncaminhamento}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-acs-azul hover:underline"
              >
                <ClipboardCheck size={13} strokeWidth={2.2} />
                Ver encaminhamento
              </button>
            )}
            <button
              onClick={onResolver}
              disabled={resolvendo}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-acs-verde hover:underline disabled:opacity-40 transition-opacity"
            >
              {resolvendo
                ? <Loader2 size={13} className="animate-spin" />
                : <CheckCircle2 size={13} strokeWidth={2.2} />
              }
              Marcar como resolvido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Alertas() {
  const navigate = useNavigate();
  const [alertas, setAlertas]     = useState<AlertaAPI[]>([]);
  const [loading, setLoading]     = useState(true);
  const [erro, setErro]           = useState<string | null>(null);
  const [resolvendo, setResolvendo] = useState<number | null>(null);
  const [abaResolvidos, setAbaResolvidos] = useState(false);

  async function carregar(resolvidos = false) {
    setLoading(true);
    setErro(null);
    try {
      const { data } = await alertasService.listar(resolvidos);
      setAlertas(data);
    } catch (e: any) {
      setErro(e?.response?.data?.message ?? 'Erro ao carregar alertas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(abaResolvidos); }, [abaResolvidos]);

  async function resolver(id: number) {
    setResolvendo(id);
    try {
      await alertasService.resolver(id);
      setAlertas((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // ignora — alerta permanece na lista
    } finally {
      setResolvendo(null);
    }
  }

  // Agrupa por urgência mantendo a ordem urgente → atencao → informativo
  const grupos: UrgenciaAlerta[] = ['urgente', 'atencao', 'informativo'];
  const porUrgencia = grupos.reduce<Record<UrgenciaAlerta, AlertaAPI[]>>((acc, u) => {
    acc[u] = alertas.filter((a) => a.urgencia === u);
    return acc;
  }, { urgente: [], atencao: [], informativo: [] });

  const totalPendentes = alertas.length;

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-acs-line px-4 lg:px-8 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3 pl-12 lg:pl-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-acs-ink">Alertas</h2>
              {!abaResolvidos && totalPendentes > 0 && (
                <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-acs-coral text-white font-mono text-[11px] font-bold">
                  {totalPendentes}
                </span>
              )}
            </div>
            <button
              onClick={() => carregar(abaResolvidos)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-acs-ink-3 hover:text-acs-ink hover:bg-acs-paper transition-colors"
              aria-label="Recarregar"
            >
              <RefreshCw size={15} strokeWidth={2} />
            </button>
          </div>

          {/* Abas */}
          <div className="flex gap-2">
            {[
              { id: false, label: 'Pendentes' },
              { id: true,  label: 'Resolvidos' },
            ].map(({ id, label }) => (
              <button
                key={String(id)}
                onClick={() => setAbaResolvidos(id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  abaResolvidos === id
                    ? 'bg-acs-ink text-white'
                    : 'bg-white border border-acs-line text-acs-ink-3 hover:bg-acs-paper'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-2xl mx-auto px-4 lg:px-8 py-5 space-y-6">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-2 text-acs-ink-3">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Carregando alertas…</span>
          </div>
        )}

        {!loading && erro && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-acs-vermelho">
            {erro}
          </div>
        )}

        {!loading && !erro && alertas.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BellOff size={40} strokeWidth={1.4} className="text-acs-ink-4 mb-3" />
            <p className="font-medium text-acs-ink-2 mb-1">
              {abaResolvidos ? 'Nenhum alerta resolvido.' : 'Nenhum alerta pendente.'}
            </p>
            {!abaResolvidos && (
              <p className="text-sm text-acs-ink-3">Todos os pacientes estão em dia.</p>
            )}
          </div>
        )}

        {!loading && !erro && grupos.map((urgencia) => {
          const lista = porUrgencia[urgencia];
          if (lista.length === 0) return null;
          const cfg = URGENCIA_CFG[urgencia];
          return (
            <div key={urgencia}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cfg.cor }}
                />
                <h3 className="font-mono text-[11px] uppercase tracking-[.14em] text-acs-ink-2 font-semibold">
                  {cfg.label}
                  <span className="ml-1.5 font-bold" style={{ color: cfg.cor }}>
                    {lista.length}
                  </span>
                </h3>
              </div>
              <div className="space-y-3">
                {lista.map((alerta) => (
                  <CardAlerta
                    key={alerta.id}
                    alerta={alerta}
                    resolvendo={resolvendo === alerta.id}
                    onResolver={() => resolver(alerta.id)}
                    onVerPaciente={() =>
                      alerta.paciente_id && navigate(`/paciente/${alerta.paciente_id}`)
                    }
                    onVerEncaminhamento={() =>
                      navigate(`/encaminhamentos?destaque=${alerta.encaminhamento_id}`)
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
}
