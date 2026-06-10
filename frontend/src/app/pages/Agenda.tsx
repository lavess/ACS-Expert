import { MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { MapaVisitas, type Visita } from '../components/MapaVisitas';
import { useState, useEffect } from 'react';
import { RiskBadge } from '../components/RiskBadge';
import { pacientesService, type PacienteListagem } from '@/services/pacientesService';
import { usePacientesFiltradosPorPerfil } from '@/hooks/usePacientesFiltradosPorPerfil';
import { geocodeCep } from '@/hooks/useGeocodeCep';

type Prioridade = 'urgent' | 'warning' | 'low';

async function pacienteParaVisita(p: PacienteListagem, ordem: number): Promise<Visita> {
  const prioridade: Prioridade =
    p.nivel_risco === 'alto' ? 'urgent' :
    p.nivel_risco === 'medio' ? 'warning' : 'low';

  const razao =
    p.total_encaminhamentos_vencidos && p.total_encaminhamentos_vencidos > 0
      ? 'Encaminhamento pendente'
      : p.alertas_pendentes && p.alertas_pendentes > 0
      ? 'Alerta pendente'
      : p.nivel_risco === 'alto'
      ? 'Alto risco'
      : 'Visita de rotina';

  const enderecoParts = [p.logradouro, p.numero].filter(Boolean);
  const bairroPart = p.bairro ? ` — ${p.bairro}` : '';
  const endereco = enderecoParts.length > 0 ? enderecoParts.join(', ') + bairroPart : 'Endereco nao informado';

  const coords = await geocodeCep(p.cep ?? '');

  return {
    id: p.id,
    ordem,
    prioridade,
    paciente: p.nome,
    endereco,
    distancia: '—',
    razao,
    status: 'pendente',
    lat: coords.lat,
    lng: coords.lng,
    distanciaMetros: 300 + Math.floor(Math.random() * 1200),
  };
}

export function Agenda() {
  const navigate = useNavigate();
  const [visualizacao, setVisualizacao] = useState<'lista' | 'mapa'>('lista');
  const [rotaOtimizada, setRotaOtimizada] = useState(false);
  const filtrosPerfil = usePacientesFiltradosPorPerfil();
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const { data } = await pacientesService.listar({ ...filtrosPerfil, ativo: 1 });
        const ordenados = [...data].sort((a, b) => {
          const ordem = { alto: 0, medio: 1, baixo: 2 };
          return (ordem[a.nivel_risco] ?? 2) - (ordem[b.nivel_risco] ?? 2);
        });
        const visitasGeocodificadas = await Promise.all(
          ordenados.map((p, i) => pacienteParaVisita(p, i + 1))
        );
        setVisitas(visitasGeocodificadas);
      } catch {
        setVisitas([]);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const [menuRotaAberto, setMenuRotaAberto] = useState(false);

  // Ordena pendentes por prioridade e distância
  const visitasOrdenadas = () => {
    const pendentes = [...visitas.filter(v => v.status === 'pendente')].sort((a, b) => {
      const ord = { urgent: 0, warning: 1, low: 2 };
      const d = ord[a.prioridade] - ord[b.prioridade];
      return d !== 0 ? d : a.distanciaMetros - b.distanciaMetros;
    });
    const realizadas = visitas.filter(v => v.status === 'realizada');
    return [
      ...pendentes.map((v, i) => ({ ...v, ordem: i + 1 })),
      ...realizadas.map((v, i) => ({ ...v, ordem: pendentes.length + i + 1 })),
    ];
  };

  const abrirNoMapa = (app: 'google' | 'waze') => {
    const pendentes = [...visitas.filter(v => v.status === 'pendente')].sort((a, b) => {
      const ord = { urgent: 0, warning: 1, low: 2 };
      const d = ord[a.prioridade] - ord[b.prioridade];
      return d !== 0 ? d : a.distanciaMetros - b.distanciaMetros;
    });

    if (!pendentes.length) return;

    if (app === 'google') {
      // Google Maps: origem = atual, destino = último, intermediários = waypoints
      const destino = pendentes[pendentes.length - 1];
      const waypoints = pendentes.slice(0, -1);
      const dest = `${destino.lat},${destino.lng}`;
      const wps = waypoints.map(v => `${v.lat},${v.lng}`).join('|');
      const url = `https://www.google.com/maps/dir/?api=1&destination=${dest}${wps ? `&waypoints=${wps}` : ''}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      // Waze suporta apenas um destino — abre o primeiro da lista (mais urgente)
      const primeiro = pendentes[0];
      const url = `https://waze.com/ul?ll=${primeiro.lat},${primeiro.lng}&navigate=yes`;
      window.open(url, '_blank');
    }

    // Atualiza ordem no mapa interno também
    setVisitas(visitasOrdenadas());
    setRotaOtimizada(true);
    setVisualizacao('mapa');
    setMenuRotaAberto(false);
    setTimeout(() => setRotaOtimizada(false), 5000);
  };

  const otimizarRota = () => setMenuRotaAberto(v => !v);

  const riskLevelMap: Record<string, 'urgent' | 'warning' | 'low'> = {
    urgent: 'urgent', warning: 'warning', low: 'low',
  };

  const getPrioridadeColorVar = (prioridade: string) => {
    switch (prioridade) {
      case 'urgent': return 'var(--acs-vermelho)';
      case 'warning': return 'var(--acs-amar)';
      case 'low': return 'var(--acs-verde)';
      default: return 'var(--acs-azul)';
    }
  };

  return (
    <div className="h-full flex flex-col pb-16 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-acs-line px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="pl-12 lg:pl-0">
            <h2 className="font-display font-bold text-acs-ink">Agenda do Dia</h2>
            <p className="text-sm text-acs-ink-3">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
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

        {/* Metricas */}
        <div className="flex gap-3">
          <div className="flex-1 bg-acs-azul-050 rounded-xl px-3 py-2 text-center">
            <div className="text-xl font-display font-bold text-acs-azul">{visitas.length}</div>
            <div className="text-xs text-acs-ink-3">Total</div>
          </div>
          <div className="flex-1 bg-acs-verde-100 rounded-xl px-3 py-2 text-center">
            <div className="text-xl font-display font-bold text-acs-verde">{visitas.filter(v => v.status === 'realizada').length}</div>
            <div className="text-xs text-[#1E6B48]">Realizadas</div>
          </div>
          <div className="flex-1 bg-acs-vermelho-100 rounded-xl px-3 py-2 text-center">
            <div className="text-xl font-display font-bold text-acs-vermelho">{visitas.filter(v => v.prioridade === 'urgent').length}</div>
            <div className="text-xs text-acs-vermelho">Urgentes</div>
          </div>
        </div>
      </div>

      {/* Lista de visitas */}
      {visualizacao === 'lista' && (
        <div className="flex-1 px-6 py-4 space-y-3">
          {carregando && (
            <div className="flex items-center justify-center py-16 gap-2 text-acs-ink-3">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Carregando pacientes...</span>
            </div>
          )}
          {!carregando && visitas.length === 0 && (
            <div className="text-center py-16 text-acs-ink-3 text-sm">Nenhum paciente encontrado.</div>
          )}
          {visitas.map((visita) => (
            <div
              key={visita.id}
              className={`bg-white rounded-2xl p-4 border-l-[3px] ${visita.status === 'realizada' ? 'opacity-60' : ''}`}
              style={{
                borderLeftColor: getPrioridadeColorVar(visita.prioridade),
                boxShadow: '0 1px 2px rgba(10,20,40,.06)'
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-display font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: getPrioridadeColorVar(visita.prioridade) }}
                >
                  {visita.ordem}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-acs-ink">{visita.paciente}</h3>
                    <RiskBadge level={riskLevelMap[visita.prioridade] ?? 'low'} />
                  </div>

                  <p className="text-sm text-acs-ink-3 mb-1">{visita.endereco}</p>

                  <div className="flex items-center gap-4 mb-3">
                    <span className="text-xs text-acs-ink-3 flex items-center gap-1">
                      <MapPin size={12} />
                      {visita.distancia}
                    </span>
                    <span className="text-xs text-acs-ink-3">{visita.razao}</span>
                  </div>

                  {visita.status === 'realizada' ? (
                    <div className="flex items-center gap-2 text-sm text-acs-verde">
                      <span>✓</span>
                      <span className="font-medium">Realizada</span>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/paciente/${visita.id}`)}
                        className="flex-1 py-2 bg-acs-azul text-white rounded-xl text-sm font-medium hover:bg-acs-azul-900 transition-colors"
                      >
                        Iniciar
                      </button>
                      <button className="px-4 py-2 bg-acs-amar-100 text-[#A3740A] rounded-xl text-sm font-medium hover:brightness-95 transition-colors">
                        Adiar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mapa de visitas */}
      {visualizacao === 'mapa' && (
        <div className="flex-1 px-6 py-4">
          <MapaVisitas visitas={visitas} mostrarRota={rotaOtimizada} />

          {/* Legenda do mapa */}
          <div className="mt-4 card-acs p-4 border border-acs-line">
            <h3 className="text-sm font-semibold text-acs-ink mb-3">Legenda</h3>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-acs-vermelho flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow">1</div>
                <span className="text-xs text-acs-ink-3">Urgente</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-acs-amar flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow">2</div>
                <span className="text-xs text-acs-ink-3">Atencao</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-acs-verde flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow">3</div>
                <span className="text-xs text-acs-ink-3">Rotina</span>
              </div>
              {rotaOtimizada && (
                <div className="flex items-center gap-2">
                  <div className="h-0.5 w-6 bg-acs-azul opacity-80" style={{ borderTop: '3px dashed var(--acs-azul)' }}></div>
                  <span className="text-xs text-acs-ink-3">Rota Otimizada</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu de app de navegação */}
      {menuRotaAberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuRotaAberto(false)} />
          <div className="fixed bottom-36 right-8 z-50 bg-white rounded-2xl shadow-[0_8px_32px_rgba(10,20,40,.18)] border border-acs-line overflow-hidden w-52">
            <div className="px-4 py-2.5 border-b border-acs-line">
              <p className="text-xs font-semibold text-acs-ink-3 uppercase tracking-wide">Abrir rota em</p>
            </div>
            <button
              onClick={() => abrirNoMapa('google')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-acs-paper transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-acs-line flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 48 48" width="20" height="20"><path fill="#4285F4" d="M24 4C13 4 4 13 4 24s9 20 20 20 20-9 20-20S35 4 24 4z"/><path fill="#fff" d="M24 12c-6.6 0-12 5.4-12 12 0 4.8 2.8 8.9 6.9 10.9L24 36l5.1-1.1C33.2 32.9 36 28.8 36 24c0-6.6-5.4-12-12-12z"/><path fill="#4285F4" d="M24 18a6 6 0 100 12A6 6 0 0024 18z"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-acs-ink">Google Maps</p>
                <p className="text-xs text-acs-ink-3">Rota com todos os pontos</p>
              </div>
            </button>
            <button
              onClick={() => abrirNoMapa('waze')}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-acs-paper transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-[#05C8F7] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 48 48" width="20" height="20"><circle cx="24" cy="22" r="16" fill="#fff"/><circle cx="19" cy="20" r="2.5" fill="#333"/><circle cx="29" cy="20" r="2.5" fill="#333"/><path d="M19 26c1.2 2 8.8 2 10 0" stroke="#333" strokeWidth="1.5" strokeLinecap="round" fill="none"/></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-acs-ink">Waze</p>
                <p className="text-xs text-acs-ink-3">Primeiro destino urgente</p>
              </div>
            </button>
          </div>
        </>
      )}

      {/* FAB */}
      <button
        className="fixed bottom-24 right-8 flex items-center gap-2 px-4 py-3 bg-acs-coral rounded-2xl shadow-[0_8px_20px_rgba(231,111,74,.45)] text-white font-semibold hover:brightness-95 transition-colors z-30"
        onClick={otimizarRota}
      >
        <MapPin size={20} />
        Otimizar Rota
      </button>

      {rotaOtimizada && (
        <div className="fixed bottom-36 right-8 px-4 py-2 bg-acs-verde text-white rounded-full shadow-lg font-semibold text-sm animate-slide-up flex items-center gap-2 z-30">
          <span>✓</span>
          Rota Otimizada!
        </div>
      )}
    </div>
  );
}
