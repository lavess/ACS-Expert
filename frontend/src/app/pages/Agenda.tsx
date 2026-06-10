import { MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { MapaVisitas } from '../components/MapaVisitas';
import { useState, useEffect } from 'react';
import { RiskBadge } from '../components/RiskBadge';
import { pacientesService, type PacienteListagem } from '@/services/pacientesService';

type Prioridade = 'urgent' | 'warning' | 'low';

interface Visita {
  id: number;
  ordem: number;
  prioridade: Prioridade;
  paciente: string;
  endereco: string;
  distancia: string;
  razao: string;
  status: string;
  lat: number;
  lng: number;
  distanciaMetros: number;
}

function pacienteParaVisita(p: PacienteListagem, ordem: number): Visita {
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
  const endereco = enderecoParts.length > 0 ? enderecoParts.join(', ') : 'Endereco nao informado';

  return {
    id: p.id,
    ordem,
    prioridade,
    paciente: p.nome,
    endereco,
    distancia: '—',
    razao,
    status: 'pendente',
    lat: -23.5505 + (Math.random() - 0.5) * 0.02,
    lng: -46.6333 + (Math.random() - 0.5) * 0.02,
    distanciaMetros: 300 + Math.floor(Math.random() * 1200),
  };
}

export function Agenda() {
  const navigate = useNavigate();
  const [visualizacao, setVisualizacao] = useState<'lista' | 'mapa'>('lista');
  const [rotaOtimizada, setRotaOtimizada] = useState(false);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const { data } = await pacientesService.listar({ ativo: 1 });
        const ordenados = [...data].sort((a, b) => {
          const ordem = { alto: 0, medio: 1, baixo: 2 };
          return (ordem[a.nivel_risco] ?? 2) - (ordem[b.nivel_risco] ?? 2);
        });
        setVisitas(ordenados.map((p, i) => pacienteParaVisita(p, i + 1)));
      } catch {
        setVisitas([]);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, []);

  const otimizarRota = () => {
    const visitasPendentes = visitas.filter(v => v.status === 'pendente');
    const visitasRealizadas = visitas.filter(v => v.status === 'realizada');

    const visitasOrdenadas = visitasPendentes.sort((a, b) => {
      const prioridadeOrder = { urgent: 0, warning: 1, low: 2 };
      const diffPrioridade = prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
      if (diffPrioridade !== 0) return diffPrioridade;
      return a.distanciaMetros - b.distanciaMetros;
    });

    const visitasComNovaOrdem = [
      ...visitasOrdenadas.map((v, idx) => ({ ...v, ordem: idx + 1 })),
      ...visitasRealizadas.map((v, idx) => ({ ...v, ordem: visitasOrdenadas.length + idx + 1 }))
    ];

    setVisitas(visitasComNovaOrdem);
    setRotaOtimizada(true);
    setVisualizacao('mapa');
    setTimeout(() => setRotaOtimizada(false), 5000);
  };

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
            <p className="text-sm text-acs-ink-3">19 de marco de 2026</p>
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

      {/* FAB */}
      <button
        className="fixed bottom-24 right-8 flex items-center gap-2 px-4 py-3 bg-acs-coral rounded-2xl shadow-[0_8px_20px_rgba(231,111,74,.45)] text-white font-semibold hover:brightness-95 transition-colors"
        onClick={otimizarRota}
      >
        <MapPin size={20} />
        Otimizar Rota
      </button>

      {rotaOtimizada && (
        <div className="fixed bottom-36 right-8 px-4 py-2 bg-acs-verde text-white rounded-full shadow-lg font-semibold text-sm animate-slide-up flex items-center gap-2">
          <span>✓</span>
          Rota Otimizada!
        </div>
      )}
    </div>
  );
}
