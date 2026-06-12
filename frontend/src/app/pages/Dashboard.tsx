import { useEffect, useState } from 'react';
import {
  Bell, Stethoscope, Search, Calendar, ClipboardCheck,
  ClipboardX, UserX, AlertTriangle, Activity,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { RiskBadge } from '../components/RiskBadge';
import { useAuthStore } from '@/store/authStore';
import { usuariosService, type UsuarioAPI } from '@/services/usuariosService';
import { pacientesService, type PacienteListagem } from '@/services/pacientesService';
import { visitasService, type VisitasStats } from '@/services/visitasService';
import { alertasService } from '@/services/alertasService';
import { usePacientesFiltradosPorPerfil } from '@/hooks/usePacientesFiltradosPorPerfil';

function saudacao(nomeCompleto?: string) {
  const hora = new Date().getHours();
  const prefixo = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  const primeiroNome = nomeCompleto?.trim().split(' ')[0] ?? '';
  return primeiroNome ? `${prefixo}, ${primeiroNome}` : prefixo;
}

function iniciais(nome?: string) {
  if (!nome) return '?';
  return nome.split(' ').filter(Boolean).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

const PERFIL_LABEL: Record<string, string> = {
  acs:         'Agente Comunitário de Saúde',
  coordenador: 'Coordenador',
  gestor:      'Gestor',
};

interface KpiCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  sublabel?: string
  tone: 'vermelho' | 'amar' | 'verde' | 'azul'
  onClick?: () => void
}

function KpiCard({ icon: Icon, label, value, sublabel, tone, onClick }: KpiCardProps) {
  const tones = {
    vermelho: { bg: 'bg-acs-vermelho/10', icon: 'text-acs-vermelho', value: 'text-acs-vermelho' },
    amar:     { bg: 'bg-acs-amar/15',     icon: 'text-acs-amar',     value: 'text-acs-amar'     },
    verde:    { bg: 'bg-acs-verde/10',    icon: 'text-acs-verde',    value: 'text-acs-verde'    },
    azul:     { bg: 'bg-acs-azul-100',    icon: 'text-acs-azul',     value: 'text-acs-azul'     },
  }
  const t = tones[tone]

  return (
    <button
      onClick={onClick}
      className="card-acs p-4 flex flex-col gap-3 border border-acs-line hover:border-acs-azul hover:shadow-[0_4px_16px_rgba(10,20,40,.10)] transition-all text-left w-full"
    >
      <div className={`w-9 h-9 rounded-xl ${t.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={18} strokeWidth={1.8} className={t.icon} />
      </div>
      <div>
        <div className={`font-display font-bold text-2xl leading-none ${t.value}`}>
          {value}
        </div>
        <div className="text-xs font-semibold text-acs-ink mt-1 leading-tight">{label}</div>
        {sublabel && <div className="text-[11px] text-acs-ink-3 mt-0.5">{sublabel}</div>}
      </div>
    </button>
  )
}

export function Dashboard() {
  const navigate    = useNavigate();
  const usuarioAuth = useAuthStore((s) => s.usuario);
  const [usuario, setUsuario] = useState<UsuarioAPI | null>(null);

  useEffect(() => {
    if (!usuarioAuth?.id) return;
    let cancelado = false;
    usuariosService.buscarPorId(usuarioAuth.id)
      .then(({ data }) => { if (!cancelado) setUsuario(data); })
      .catch(() => {});
    return () => { cancelado = true; };
  }, [usuarioAuth?.id]);

  const nome      = usuario?.nome     ?? usuarioAuth?.nome;
  const perfil    = usuario?.perfil   ?? usuarioAuth?.perfil;
  const subtitulo = usuario?.microarea_nome
    ?? (usuario?.municipio_nome
      ? `${PERFIL_LABEL[perfil ?? ''] ?? perfil} — ${usuario.municipio_nome}`
      : PERFIL_LABEL[perfil ?? ''] ?? '');

  const [stats, setStats] = useState<VisitasStats | null>(null);

  useEffect(() => {
    visitasService.stats()
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, []);

  const [totalAlertas, setTotalAlertas] = useState(0);

  useEffect(() => {
    alertasService.listar(false)
      .then(({ data }) => setTotalAlertas(data.filter(a => !a.resolvido).length))
      .catch(() => {});
  }, []);

  const filtrosPerfil = usePacientesFiltradosPorPerfil();
  const [pacientesAlerta, setPacientesAlerta] = useState<PacienteListagem[]>([]);

  useEffect(() => {
    pacientesService.listar({ ...filtrosPerfil, ativo: 1, limit: 20 })
      .then(({ data: res }) => {
        const altos  = res.data.filter(p => p.nivel_risco === 'alto');
        const medios = res.data.filter(p => p.nivel_risco === 'moderado');
        setPacientesAlerta([...altos, ...medios].slice(0, 5));
      })
      .catch(() => {});
  }, []);

  const alerts = pacientesAlerta.map(p => ({
    id: p.id,
    patient: p.nome,
    message: p.total_encaminhamentos_vencidos && p.total_encaminhamentos_vencidos > 0
      ? 'Encaminhamento pendente'
      : p.nivel_risco === 'alto'
      ? 'Alto risco — requer visita prioritária'
      : 'Risco moderado',
    level: (p.nivel_risco === 'alto' ? 'urgent' : 'warning') as 'urgent' | 'warning',
  }));

  const quickActions = [
    { icon: Stethoscope,    label: 'Nova Triagem',      path: '/pacientes' },
    { icon: Search,         label: 'Buscar Paciente',   path: '/pacientes' },
    { icon: Calendar,       label: 'Minha Agenda',      path: '/agenda' },
    { icon: ClipboardCheck, label: 'Encaminhamentos',   path: '/encaminhamentos' },
  ];

  const fmt = (n: number | undefined) => n === undefined ? '—' : String(n);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-acs-line px-4 lg:px-8 py-4 lg:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 pl-12 lg:pl-0">
              <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-acs-azul flex items-center justify-center text-white font-semibold">
                {iniciais(nome)}
              </div>
              <div>
                <h2 className="font-display font-bold text-acs-ink text-lg lg:text-xl">{saudacao(nome)}</h2>
                {subtitulo && <p className="text-sm text-acs-ink-3">{subtitulo}</p>}
              </div>
            </div>
            <button className="relative lg:hidden" onClick={() => navigate('/alertas')}>
              <Bell size={24} className="text-acs-ink-3" />
              {totalAlertas > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-acs-vermelho text-white text-xs rounded-full flex items-center justify-center">
                  {totalAlertas > 99 ? '99+' : totalAlertas}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">

        {/* Grade principal: agenda + alertas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Agenda do dia */}
            <div className="bg-acs-azul rounded-2xl p-6 shadow-[0_1px_2px_rgba(10,20,40,.06)]">
              <h3 className="font-display font-semibold text-white mb-4 text-lg">Agenda de hoje</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-white">{fmt(stats?.total_pacientes)}</div>
                  <div className="text-sm text-white/80">No territorio</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-white">{fmt(stats?.hoje_realizadas)}</div>
                  <div className="text-sm text-white/80">Realizadas hoje</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-white">{fmt(stats?.urgentes)}</div>
                  <div className="text-sm text-white/80">Urgentes</div>
                </div>
              </div>
              <button
                onClick={() => navigate('/agenda')}
                className="w-full py-3 bg-white/20 backdrop-blur text-white rounded-xl font-medium hover:bg-white/30 transition-colors"
              >
                Ver agenda completa
              </button>
            </div>

            {/* Ações rápidas */}
            <div>
              <h3 className="font-display font-semibold text-acs-ink mb-4 text-lg">Ações rápidas</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="card-acs p-4 lg:p-6 flex flex-col items-center gap-3 border border-acs-line hover:border-acs-azul hover:shadow-[0_8px_20px_rgba(10,20,40,.18)] transition-all"
                    >
                      <Icon size={28} className="text-acs-azul" strokeWidth={1.8} />
                      <span className="text-sm font-medium text-acs-ink text-center">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Alertas */}
          <div className="lg:col-span-1">
            <div className="card-acs p-6 border border-acs-line">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-acs-ink text-lg">Alertas</h3>
                {totalAlertas > 0 && (
                  <span className="w-6 h-6 bg-acs-vermelho text-white text-xs rounded-full flex items-center justify-center font-semibold">
                    {totalAlertas > 99 ? '99+' : totalAlertas}
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <p className="text-sm text-acs-ink-3 text-center py-4">Sem pacientes em alerta</p>
                ) : alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`bg-white rounded-xl p-3.5 flex items-start gap-3 border-l-[3px] ${
                      alert.level === 'urgent' ? 'border-l-acs-vermelho' : 'border-l-acs-amar'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-acs-ink text-sm">{alert.patient}</p>
                        <RiskBadge level={alert.level} />
                      </div>
                      <p className="text-xs text-acs-ink-3">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="w-full text-sm text-acs-azul font-medium mt-4 py-2 hover:bg-acs-azul-050 rounded-xl transition-colors"
                onClick={() => navigate('/alertas')}
              >
                Ver todos os alertas →
              </button>
            </div>
          </div>
        </div>

        {/* KPIs — linha de cards de atenção */}
        <div>
          <h3 className="font-display font-semibold text-acs-ink mb-4 text-lg">Pontos de atenção</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <KpiCard
              icon={ClipboardX}
              label="Enc. vencidos"
              value={fmt(stats?.enc_vencidos)}
              sublabel="Pendentes com prazo expirado"
              tone="vermelho"
              onClick={() => navigate('/encaminhamentos')}
            />
            <KpiCard
              icon={UserX}
              label="Sem visita 30d+"
              value={fmt(stats?.sem_visita)}
              sublabel="Pacientes sem visita recente"
              tone="amar"
              onClick={() => navigate('/pacientes?filtro=sem-visita')}
            />
            <KpiCard
              icon={AlertTriangle}
              label="Alto risco"
              value={fmt(stats?.urgentes)}
              sublabel="Pacientes com risco elevado"
              tone="vermelho"
              onClick={() => navigate('/pacientes')}
            />
            <KpiCard
              icon={Activity}
              label="Visitas na semana"
              value={fmt(stats?.semana_realizadas)}
              sublabel={`${fmt(stats?.semana_triagens)} triagens realizadas`}
              tone="verde"
              onClick={() => navigate('/agenda')}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
