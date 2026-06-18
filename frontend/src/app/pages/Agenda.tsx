import { useEffect, useMemo, useState } from 'react';
import {
  MapPin, Loader2, AlertCircle, RefreshCw, AlertTriangle, Activity,
  CheckCircle2, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { MapaVisitas } from '../components/MapaVisitas';
import { RiskBadge } from '../components/RiskBadge';
import {
  agendaService,
  corPrioridadePorRisco,
  type AgendaItemAPI,
  type StatusAgenda,
} from '@/services/agendaService';

function corPrioridadeVar(p: 'urgent' | 'warning' | 'low' | string): string {
  if (p === 'urgent')  return 'var(--acs-vermelho)';
  if (p === 'warning') return 'var(--acs-amar)';
  if (p === 'low')     return 'var(--acs-verde)';
  return 'var(--acs-azul)';
}

function formatarDataPorExtenso(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function enderecoCurto(it: AgendaItemAPI): string {
  return [it.logradouro, it.numero].filter(Boolean).join(', ') || 'Endereço não informado';
}

export function Agenda() {
  const navigate = useNavigate();
  const [visualizacao, setVisualizacao] = useState<'lista' | 'mapa'>('lista');
  const [itens, setItens]               = useState<AgendaItemAPI[]>([]);
  const [data, setData]                 = useState<string>('');
  const [loading, setLoading]           = useState(true);
  const [gerando, setGerando]           = useState(false);
  const [erro, setErro]                 = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    setErro(null);
    try {
      const { data: r } = await agendaService.hoje();
      setItens(r.itens);
      setData(r.data);
    } catch (err: any) {
      setErro(err?.response?.data?.message ?? 'Erro ao carregar agenda.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function regerar() {
    setGerando(true);
    setErro(null);
    try {
      const { data: r } = await agendaService.gerar();
      setItens(r.itens);
      setData(r.data);
    } catch (err: any) {
      setErro(err?.response?.data?.message ?? 'Erro ao gerar agenda.');
    } finally {
      setGerando(false);
    }
  }

  async function mudarStatus(id: number, status: StatusAgenda) {
    // optimistic UI
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
    try {
      await agendaService.atualizarStatus(id, status);
    } catch (err: any) {
      setErro(err?.response?.data?.message ?? 'Erro ao atualizar visita.');
      carregar(); // rollback via reload
    }
  }

  const stats = useMemo(() => ({
    total:      itens.length,
    realizadas: itens.filter((i) => i.status === 'realizada').length,
    urgentes:   itens.filter((i) => i.paciente_nivel_risco === 'alto').length,
  }), [itens]);

  const visitasParaMapa = useMemo(() => itens.map((i) => ({
    id:         i.id,
    ordem:      i.ordem_prioridade,
    prioridade: corPrioridadePorRisco(i.paciente_nivel_risco),
    paciente:   i.paciente_nome ?? `Paciente #${i.paciente_id}`,
    endereco:   enderecoCurto(i),
    distancia:  i.microarea_nome ? `MA ${i.microarea_nome}` : '—',
    razao:      i.motivo_prioridade?.motivos?.[0] ?? 'Visita programada',
    status:     i.status === 'realizada' ? 'realizada' : 'pendente',
    lat:        Number(i.latitude  ?? -26.3044),
    lng:        Number(i.longitude ?? -48.8487),
    distanciaMetros: 0,
  })), [itens]);

  return (
    <div className="h-full flex flex-col pb-16 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-acs-line px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="pl-12 lg:pl-0">
            <h2 className="font-display font-bold text-acs-ink">Agenda do Dia</h2>
            <p className="text-sm text-acs-ink-3">
              {data ? formatarDataPorExtenso(data) : 'Carregando…'}
            </p>
          </div>

          <div className="flex gap-1 bg-acs-paper-2 rounded-xl p-1">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visualizacao === 'lista'
                  ? 'bg-white text-acs-ink shadow-[0_1px_2px_rgba(10,20,40,.06)]'
                  : 'text-acs-ink-3'
              }`}
              onClick={() => setVisualizacao('lista')}
            >
              Lista
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                visualizacao === 'mapa'
                  ? 'bg-white text-acs-ink shadow-[0_1px_2px_rgba(10,20,40,.06)]'
                  : 'text-acs-ink-3'
              }`}
              onClick={() => setVisualizacao('mapa')}
            >
              Mapa
            </button>
          </div>
        </div>

        {/* Métricas */}
        <div className="flex gap-3">
          <div className="flex-1 bg-acs-azul-050 rounded-xl px-3 py-2 text-center">
            <div className="text-xl font-display font-bold text-acs-azul">{stats.total}</div>
            <div className="text-xs text-acs-ink-3">Total</div>
          </div>
          <div className="flex-1 bg-acs-verde-100 rounded-xl px-3 py-2 text-center">
            <div className="text-xl font-display font-bold text-acs-verde">{stats.realizadas}</div>
            <div className="text-xs text-acs-verde-700">Realizadas</div>
          </div>
          <div className="flex-1 bg-acs-vermelho-100 rounded-xl px-3 py-2 text-center">
            <div className="text-xl font-display font-bold text-acs-vermelho">{stats.urgentes}</div>
            <div className="text-xs text-acs-vermelho">Urgentes</div>
          </div>
        </div>
      </div>

      {/* Estados de carregamento/erro */}
      {loading && (
        <div className="flex-1 flex items-center justify-center gap-2 text-acs-ink-3">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Carregando agenda…</span>
        </div>
      )}

      {!loading && erro && (
        <div className="px-6 pt-4">
          <div className="flex items-start gap-3 bg-acs-vermelho-100 border border-acs-vermelho/30 rounded-xl p-4">
            <AlertCircle size={18} className="text-acs-vermelho flex-shrink-0 mt-0.5" />
            <p className="text-sm text-acs-vermelho">{erro}</p>
          </div>
        </div>
      )}

      {!loading && !erro && itens.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
          <Activity size={36} className="text-acs-ink-4" strokeWidth={1.6} />
          <p className="text-sm text-acs-ink-3 max-w-xs">
            Nenhuma visita sugerida para hoje. Toque em <strong>Gerar agenda</strong> para
            calcular a partir dos pacientes da sua microárea.
          </p>
          <button
            onClick={regerar}
            disabled={gerando}
            className="mt-1 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-acs-coral text-white font-semibold text-sm disabled:opacity-70"
          >
            {gerando ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Gerar agenda
          </button>
        </div>
      )}

      {/* Lista */}
      {!loading && itens.length > 0 && visualizacao === 'lista' && (
        <div className="flex-1 px-6 py-4 space-y-3">
          {itens.map((it) => {
            const prio = corPrioridadePorRisco(it.paciente_nivel_risco);
            const motivos = it.motivo_prioridade?.motivos ?? [];
            const flags = it.motivo_prioridade?.flags ?? {};
            const opaco = it.status !== 'pendente';

            return (
              <div
                key={it.id}
                className={`bg-white rounded-2xl p-4 border-l-[3px] ${opaco ? 'opacity-60' : ''}`}
                style={{
                  borderLeftColor: corPrioridadeVar(prio),
                  boxShadow: '0 1px 2px rgba(10,20,40,.06)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: corPrioridadeVar(prio) }}
                  >
                    {it.ordem_prioridade}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-acs-ink truncate">
                        {it.paciente_nome ?? `Paciente #${it.paciente_id}`}
                      </h3>
                      <RiskBadge level={prio} />
                    </div>

                    <p className="text-sm text-acs-ink-3 mb-1 truncate">{enderecoCurto(it)}</p>

                    <div className="flex items-center gap-2 flex-wrap mb-2 text-xs text-acs-ink-3">
                      {it.microarea_nome && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={12} />
                          {it.microarea_nome}
                        </span>
                      )}
                      <span className="font-mono">score {it.score_prioridade}</span>
                    </div>

                    {motivos.length > 0 && (
                      <ul className="mb-2 space-y-0.5">
                        {motivos.map((m, idx) => (
                          <li key={idx} className="text-xs text-acs-ink-2 flex items-start gap-1.5">
                            <span className="mt-1 w-1 h-1 rounded-full bg-acs-ink-3 flex-shrink-0" />
                            {m}
                          </li>
                        ))}
                      </ul>
                    )}

                    {(flags.familia_multiplo_risco || flags.cronico_sem_acompanhamento) && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {flags.familia_multiplo_risco && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-acs-coral-100 text-acs-coral-700 font-mono text-[10px] font-semibold uppercase tracking-[.1em]">
                            <AlertTriangle size={11} strokeWidth={2.2} />
                            {'Múltiplos riscos'}
                          </span>
                        )}
                        {flags.cronico_sem_acompanhamento && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-acs-amar-100 text-acs-amar-700 font-mono text-[10px] font-semibold uppercase tracking-[.1em]">
                            <Clock size={11} strokeWidth={2.2} />
                            {'Crônico sem acompanhamento'}
                          </span>
                        )}
                      </div>
                    )}

                    {it.status === 'pendente' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/paciente/${it.paciente_id}`)}
                          className="flex-1 py-2 bg-acs-azul text-white rounded-xl text-sm font-medium hover:bg-acs-azul-700 transition-colors"
                        >
                          Iniciar
                        </button>
                        <button
                          onClick={() => mudarStatus(it.id, 'realizada')}
                          className="px-3 py-2 bg-acs-verde-100 text-acs-verde-700 rounded-xl text-sm font-medium"
                        >
                          Concluir
                        </button>
                        <button
                          onClick={() => mudarStatus(it.id, 'adiada')}
                          className="px-3 py-2 bg-acs-amar-100 text-acs-amar-700 rounded-xl text-sm font-medium"
                        >
                          Adiar
                        </button>
                      </div>
                    ) : it.status === 'realizada' ? (
                      <div className="flex items-center gap-2 text-sm text-acs-verde">
                        <CheckCircle2 size={16} strokeWidth={2.2} />
                        <span className="font-medium">Realizada</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-acs-ink-3">
                        <Clock size={16} strokeWidth={2.2} />
                        <span className="font-medium capitalize">{it.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mapa */}
      {!loading && itens.length > 0 && visualizacao === 'mapa' && (
        <div className="flex-1 px-6 py-4">
          <MapaVisitas visitas={visitasParaMapa} />
        </div>
      )}

      {/* FAB regerar */}
      {!loading && itens.length > 0 && (
        <button
          className="fixed bottom-24 right-6 flex items-center gap-2 px-4 py-3 bg-acs-coral rounded-2xl shadow-[0_8px_20px_rgba(231,111,74,.45)] text-white font-semibold hover:brightness-95 transition-colors disabled:opacity-70"
          onClick={regerar}
          disabled={gerando}
        >
          {gerando
            ? <Loader2 size={18} className="animate-spin" />
            : <RefreshCw size={18} />}
          {gerando ? 'Gerando…' : 'Recalcular'}
        </button>
      )}
    </div>
  );
}
