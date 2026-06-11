import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Search, ChevronRight, Plus, AlertTriangle, Loader2,
  Users, X, ChevronDown, MapPin, Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { RiskBadge } from '../components/RiskBadge';
import {
  pacientesService,
  calcularIdade,
  riscoToUI,
  type PacienteListagem,
  type ListarPacientesParams,
} from '@/services/pacientesService';
import { EncaminhamentoVencidoBadge } from '@/features/encaminhamentos';
import { usePacientesFiltradosPorPerfil } from '@/hooks/usePacientesFiltradosPorPerfil';

type FiltroId = 'todos' | 'alto' | 'cronicos' | 'gestantes' | 'sem-visita' | 'alertas';
type SortOption = 'risco' | 'sem-visita' | 'nome';

const SORT_LABELS: Record<SortOption, string> = {
  'risco':      'Risco',
  'sem-visita': 'Sem visita',
  'nome':       'Nome A-Z',
};

const PAGE_LIMIT = 20;

export function Pacientes() {
  const navigate      = useNavigate();
  const filtrosPerfil = usePacientesFiltradosPorPerfil();

  const [searchTerm,    setSearchTerm]    = useState('');
  const [debouncedBusca, setDebouncedBusca] = useState('');
  const [activeFilter,  setActiveFilter]  = useState<FiltroId>('todos');
  const [sort,          setSort]          = useState<SortOption>('risco');
  const [sortOpen,      setSortOpen]      = useState(false);

  // Estabiliza filtrosPerfil em ref para não recriar carregarPagina a cada render
  const filtrosPerfilRef = useRef(filtrosPerfil);
  filtrosPerfilRef.current = filtrosPerfil;

  // Paginação
  const [pacientes,  setPacientes]  = useState<PacienteListagem[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [hasMore,    setHasMore]    = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [erro,       setErro]       = useState<string | null>(null);

  // Sentinel para IntersectionObserver
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Debounce da busca
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusca(searchTerm.trim()), 350);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Reset ao mudar filtro ou busca
  useEffect(() => {
    setPacientes([]);
    setTotal(0);
    setPage(1);
    setHasMore(false);
  }, [debouncedBusca, activeFilter, sort]);

  // Carrega uma página — filtrosPerfil via ref para não recriar o callback
  const carregarPagina = useCallback(async (pageNum: number, append: boolean) => {
    if (pageNum === 1) setLoading(true); else setLoadingMore(true);
    setErro(null);

    try {
      const params: ListarPacientesParams = {
        ...filtrosPerfilRef.current,
        busca:       debouncedBusca || undefined,
        nivel_risco: activeFilter === 'alto' ? 'alto' : undefined,
        filtro:      (['cronicos', 'gestantes', 'sem-visita', 'alertas'] as FiltroId[]).includes(activeFilter)
          ? (activeFilter as ListarPacientesParams['filtro'])
          : undefined,
        page:  pageNum,
        limit: PAGE_LIMIT,
      };

      const { data: res } = await pacientesService.listar(params);
      setPacientes((prev) => append ? [...prev, ...res.data] : res.data);
      setTotal(res.total);
      setHasMore(res.hasMore);
      setPage(pageNum);
    } catch (err: any) {
      setErro(err?.response?.data?.message ?? 'Erro ao carregar pacientes.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedBusca, activeFilter]); // filtrosPerfil via ref — estável

  // Carrega página 1 quando filtros mudam (page volta a 1 via effect acima)
  useEffect(() => {
    carregarPagina(1, false);
  }, [carregarPagina]);

  // IntersectionObserver — dispara ao chegar no sentinel
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          carregarPagina(page + 1, true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, carregarPagina]);

  // Ordenação client-side sobre o que já está carregado
  const listaOrdenada = [...pacientes].sort((a, b) => {
    if (sort === 'nome') return a.nome.localeCompare(b.nome, 'pt-BR');
    if (sort === 'sem-visita') {
      const da = a.data_ultima_visita ? new Date(a.data_ultima_visita).getTime() : 0;
      const db = b.data_ultima_visita ? new Date(b.data_ultima_visita).getTime() : 0;
      return da - db;
    }
    // risco: backend já ordena, mas mantém consistência ao acumular páginas
    const RISK_ORDER: Record<string, number> = { alto: 0, moderado: 1, baixo: 2 };
    return (RISK_ORDER[a.nivel_risco] ?? 99) - (RISK_ORDER[b.nivel_risco] ?? 99);
  });

  const stats = {
    total,
    alto:    pacientes.filter((p) => p.nivel_risco === 'alto').length,
    alertas: pacientes.filter((p) => (p.alertas_pendentes ?? 0) > 0 || (p.total_encaminhamentos_vencidos ?? 0) > 0).length,
  };

  const filters: { id: FiltroId; label: string; count?: number }[] = [
    { id: 'todos',      label: 'Todos',           count: total },
    { id: 'alto',       label: 'Alto risco' },
    { id: 'cronicos',   label: 'Crônicos' },
    { id: 'gestantes',  label: 'Gestantes' },
    { id: 'sem-visita', label: 'Sem visita recente' },
    { id: 'alertas',    label: 'Alertas' },
  ];

  const iniciais = (nome: string) =>
    nome.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  const formatUltimaVisita = (iso?: string) => {
    if (!iso) return 'sem registro';
    const dias = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
    if (dias === 0) return 'hoje';
    if (dias === 1) return 'ontem';
    return `há ${dias} dias`;
  };

  const borderColorByRisk = (nivel: string) => {
    if (nivel === 'alto')     return 'border-l-acs-vermelho';
    if (nivel === 'moderado') return 'border-l-acs-amar';
    return 'border-l-acs-verde';
  };

  const avatarBgByRisk = (nivel: string) =>
    nivel === 'alto' ? 'bg-acs-vermelho-100' : 'bg-acs-paper-2';

  return (
    <div className="min-h-screen bg-background pb-32 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-acs-line px-4 lg:px-8 py-4 lg:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-acs-ink text-lg lg:text-xl pl-12 lg:pl-0">
              Meus Pacientes
            </h2>
            <button
              onClick={() => navigate('/novo-paciente')}
              className="hidden lg:inline-flex items-center gap-2 bg-acs-coral text-white rounded-xl px-5 py-3 font-semibold text-sm hover:brightness-95 transition-all"
            >
              <Plus size={18} strokeWidth={2.2} />
              Novo paciente
            </button>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-white rounded-xl border border-acs-line px-3 py-2.5 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3">Total</p>
              <p className="font-display font-bold text-acs-ink text-lg leading-tight">{total}</p>
            </div>
            <div className="bg-white rounded-xl border border-acs-line px-3 py-2.5 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3">Alto risco</p>
              <p className="font-display font-bold text-acs-vermelho text-lg leading-tight">{stats.alto}</p>
            </div>
            <div className="bg-white rounded-xl border border-acs-line px-3 py-2.5 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3">Alertas</p>
              <p className="font-display font-bold text-acs-coral text-lg leading-tight">{stats.alertas}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-acs-ink-3" />
            <input
              type="text"
              placeholder="Nome, CPF ou CNS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 lg:py-3 rounded-xl border border-acs-line bg-white text-acs-ink placeholder:text-acs-ink-4 focus:outline-none focus:ring-2 focus:ring-acs-azul"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-acs-ink-3 hover:text-acs-ink transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-acs-line px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-1.5 lg:py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 inline-flex items-center gap-1.5 ${
                  activeFilter === filter.id
                    ? 'bg-acs-ink text-white'
                    : 'bg-white text-acs-ink-3 border border-acs-line'
                }`}
              >
                {filter.label}
                {filter.count !== undefined && (
                  <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeFilter === filter.id
                      ? 'bg-white/20 text-white'
                      : 'bg-acs-paper-2 text-acs-ink-3'
                  }`}>
                    {filter.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort dropdown */}
          <div className="relative mt-3 inline-block">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="inline-flex items-center gap-1.5 text-sm text-acs-ink-2 hover:text-acs-ink transition-colors"
            >
              <span className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3">Ordenar:</span>
              <span className="font-medium">{SORT_LABELS[sort]}</span>
              <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                <div className="absolute left-0 top-full mt-1 bg-white rounded-xl border border-acs-line shadow-[0_8px_20px_rgba(10,20,40,.12)] z-50 min-w-[160px]">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => { setSort(key); setSortOpen(false); }}
                      className={`block w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                        sort === key
                          ? 'bg-acs-azul-100 text-acs-azul font-medium'
                          : 'text-acs-ink-2 hover:bg-acs-paper'
                      }`}
                    >
                      {SORT_LABELS[key]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        {/* Loading inicial */}
        {loading && (
          <div className="flex items-center justify-center py-20 text-acs-ink-3">
            <Loader2 size={24} className="animate-spin mr-2" />
            Carregando pacientes...
          </div>
        )}

        {!loading && erro && (
          <div className="bg-acs-vermelho-100 border border-acs-vermelho/20 text-acs-vermelho rounded-xl p-4 mb-4">
            {erro}
          </div>
        )}

        {!loading && !erro && listaOrdenada.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-acs-ink-3">
            <Users size={48} strokeWidth={1.4} className="mb-4 text-acs-ink-4" />
            <p className="text-base font-medium text-acs-ink-2 mb-1">Nenhum paciente encontrado</p>
            <p className="text-sm text-acs-ink-3">Tente ajustar os filtros ou o termo de busca.</p>
          </div>
        )}

        {!loading && !erro && listaOrdenada.length > 0 && (
          <>
            <p className="font-mono text-[11px] uppercase tracking-[.14em] text-acs-ink-3 mb-4">
              {listaOrdenada.length} de {total} paciente{total !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {listaOrdenada.map((paciente) => {
                const risco            = riscoToUI(paciente.nivel_risco);
                const idade            = calcularIdade(paciente.data_nascimento);
                const endereco         = [paciente.logradouro, paciente.numero].filter(Boolean).join(', ');
                const alertasPendentes = paciente.alertas_pendentes ?? 0;
                const totalVencidos    = paciente.total_encaminhamentos_vencidos ?? 0;
                const scoreRisco       = paciente.score_risco_atual ?? 0;

                return (
                  <button
                    key={paciente.id}
                    onClick={() => navigate(`/paciente/${paciente.id}`)}
                    className={`w-full bg-white rounded-2xl shadow-[0_1px_2px_rgba(10,20,40,.06)] border border-acs-line border-l-4 ${borderColorByRisk(paciente.nivel_risco)} hover:shadow-[0_8px_20px_rgba(10,20,40,.12)] transition-all text-left p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-full ${avatarBgByRisk(paciente.nivel_risco)} flex items-center justify-center text-acs-ink-2 font-semibold text-sm flex-shrink-0`}>
                        {iniciais(paciente.nome)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-acs-ink text-sm leading-tight truncate">{paciente.nome}</h3>
                            <p className="text-xs text-acs-ink-3 mt-0.5">
                              {idade} anos · {paciente.sexo === 'm' ? 'M' : 'F'}
                              {paciente.microarea_nome && (
                                <span className="ml-1.5 text-acs-ink-4">· MA {paciente.microarea_nome}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <RiskBadge level={risco} />
                            {scoreRisco > 0 && (
                              <span className="font-mono text-[10px] text-acs-ink-3 font-semibold">{scoreRisco}</span>
                            )}
                          </div>
                        </div>

                        {(alertasPendentes > 0 || totalVencidos > 0) && (
                          <div className="flex flex-wrap gap-1.5 mb-1.5">
                            {alertasPendentes > 0 && (
                              <div className="inline-flex items-center gap-1 bg-acs-coral/10 text-acs-coral rounded-md px-2 py-0.5">
                                <AlertTriangle size={12} strokeWidth={2} />
                                <span className="font-mono text-[10px] font-semibold uppercase tracking-[.1em]">
                                  {alertasPendentes} alerta{alertasPendentes !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                            <EncaminhamentoVencidoBadge count={totalVencidos} />
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-xs text-acs-ink-3 mt-1">
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin size={12} className="flex-shrink-0" />
                            {endereco || 'Endereço não informado'}
                          </span>
                          <span className="inline-flex items-center gap-1 flex-shrink-0">
                            <Clock size={12} />
                            {formatUltimaVisita(paciente.data_ultima_visita)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-acs-ink-4 flex-shrink-0 mt-2.5" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Sentinel + loading more */}
            <div ref={sentinelRef} className="h-1" />
            {loadingMore && (
              <div className="flex items-center justify-center py-6 gap-2 text-acs-ink-3">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-sm">Carregando mais...</span>
              </div>
            )}
            {!hasMore && listaOrdenada.length > 0 && (
              <p className="text-center font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-4 py-6">
                {total} paciente{total !== 1 ? 's' : ''} no total
              </p>
            )}
          </>
        )}
      </div>

      {/* FAB mobile */}
      <button
        onClick={() => navigate('/novo-paciente')}
        className="fixed bottom-20 right-4 lg:hidden w-14 h-14 rounded-2xl bg-acs-coral text-white shadow-[0_8px_20px_rgba(231,111,74,.45)] flex items-center justify-center hover:brightness-95 hover:scale-110 transition-all z-50"
      >
        <Plus size={24} strokeWidth={2.2} />
      </button>
    </div>
  );
}
