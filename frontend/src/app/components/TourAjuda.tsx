import { useState } from 'react'
import {
  X, ChevronLeft, ChevronRight,
  Home, Calendar, Users, ClipboardCheck,
  BadgeAlert, Settings, MapPin, Syringe,
  AlertTriangle, BarChart3,
} from 'lucide-react'

interface Props {
  onClose: () => void
}

interface Passo {
  id: string
  icon: React.ElementType
  cor: string
  corBg: string
  titulo: string
  descricao: string
  dicas: string[]
}

const PASSOS: Passo[] = [
  {
    id: 'inicio',
    icon: Home,
    cor: 'var(--acs-azul)',
    corBg: 'var(--acs-azul-100)',
    titulo: 'Início — Dashboard',
    descricao: 'Visão geral do seu dia de trabalho. Aqui você vê os números da sua microárea, alertas urgentes e a agenda do dia.',
    dicas: [
      'O contador de urgentes fica vermelho quando há pacientes em risco alto.',
      'Os alertas mostram encaminhamentos vencidos e casos críticos.',
      'A agenda resume as visitas previstas para hoje.',
    ],
  },
  {
    id: 'agenda',
    icon: Calendar,
    cor: 'var(--acs-verde)',
    corBg: 'rgba(47,158,110,.12)',
    titulo: 'Agenda do Dia',
    descricao: 'Lista de visitas domiciliares do dia ordenadas por prioridade, com mapa interativo mostrando a localização de cada paciente.',
    dicas: [
      'Pacientes em vermelho são urgentes e aparecem primeiro.',
      'O botão "Otimizar Rota" abre o Google Maps ou Waze com todos os endereços.',
      'Clique em um marcador no mapa para ver o nome e o risco do paciente.',
    ],
  },
  {
    id: 'pacientes',
    icon: Users,
    cor: 'var(--acs-azul)',
    corBg: 'var(--acs-azul-100)',
    titulo: 'Meus Pacientes',
    descricao: 'Cadastro completo de todos os pacientes da sua microárea. Use os filtros para encontrar gestantes, crônicos ou pacientes sem visita recente.',
    dicas: [
      'O filtro "Alto risco" mostra pacientes que precisam de atenção imediata.',
      'O filtro "Sem visita recente" ajuda a identificar quem há mais de 30 dias sem registro.',
      'Ao cadastrar, preencha o CEP para o endereço ser completado automaticamente.',
    ],
  },
  {
    id: 'triagem',
    icon: Syringe,
    cor: '#8B5CF6',
    corBg: 'rgba(139,92,246,.12)',
    titulo: 'Triagens',
    descricao: 'Registro de avaliações de saúde. O sistema calcula automaticamente o nível de risco com base nos dados informados e no histórico do paciente.',
    dicas: [
      'O score de risco é calculado ao salvar a triagem.',
      'Triagens anteriores ficam no histórico longitudinal do paciente.',
      'Parâmetros fora do normal ficam destacados em vermelho ou amarelo.',
    ],
  },
  {
    id: 'encaminhamentos',
    icon: ClipboardCheck,
    cor: 'var(--acs-azul)',
    corBg: 'var(--acs-azul-100)',
    titulo: 'Encaminhamentos',
    descricao: 'Controle de encaminhamentos a serviços de saúde — consultas, exames, urgências e especialistas. Acompanhe o status de cada caso.',
    dicas: [
      'Encaminhamentos vencidos ficam na aba "Vencidos" em destaque.',
      'Clique em "Registrar Retorno" quando o paciente confirmar que compareceu.',
      'Ausências geram um alerta automático para acompanhamento.',
    ],
  },
  {
    id: 'alertas',
    icon: BadgeAlert,
    cor: 'var(--acs-coral)',
    corBg: 'rgba(231,111,74,.12)',
    titulo: 'Alertas',
    descricao: 'Central de notificações do sistema. Alertas são gerados automaticamente por encaminhamentos vencidos, pacientes sem visita e casos de alto risco.',
    dicas: [
      'O número vermelho no menu indica alertas pendentes não resolvidos.',
      'Resolva um alerta ao registrar a visita ou o desfecho do encaminhamento.',
      'Alertas de urgência piscam em vermelho e devem ser priorizados.',
    ],
  },
  {
    id: 'mapa',
    icon: MapPin,
    cor: 'var(--acs-verde)',
    corBg: 'rgba(47,158,110,.12)',
    titulo: 'Mapa de Visitas',
    descricao: 'O mapa na Agenda do Dia usa os CEPs cadastrados para posicionar os pacientes no mapa de Joinville e gerar rotas otimizadas.',
    dicas: [
      'Pinos vermelhos = urgente, amarelos = atenção, verdes = baixo risco.',
      'Clique em "Otimizar Rota" para abrir a navegação no Waze ou Google Maps.',
      'Quanto mais completo o endereço, mais preciso o posicionamento no mapa.',
    ],
  },
  {
    id: 'perfil',
    icon: Settings,
    cor: 'var(--acs-ink-2)',
    corBg: 'rgba(58,70,86,.10)',
    titulo: 'Configurações e Perfil',
    descricao: 'Gerencie seus dados, microárea de atuação e preferências. Gestores também acessam o cadastro de usuários pelo menu Conta.',
    dicas: [
      'Seu perfil define quais pacientes você vê: ACS vê apenas sua microárea.',
      'Coordenadores e gestores visualizam toda a unidade de saúde.',
      'Use "Sair" para encerrar a sessão com segurança.',
    ],
  },
]

export function TourAjuda({ onClose }: Props) {
  const [passo, setPasso] = useState(0)
  const total = PASSOS.length
  const atual = PASSOS[passo]
  const Icon = atual.icon

  const anterior = () => setPasso((p) => Math.max(0, p - 1))
  const proximo  = () => {
    if (passo === total - 1) { onClose(); return }
    setPasso((p) => p + 1)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Tour de ajuda"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative z-10 bg-white w-full max-w-md rounded-t-3xl lg:rounded-2xl shadow-[0_20px_60px_rgba(10,20,40,.25)] overflow-hidden flex flex-col">
        {/* Barra de progresso */}
        <div className="h-1 bg-acs-paper-2 flex-shrink-0">
          <div
            className="h-full bg-acs-azul transition-all duration-300"
            style={{ width: `${((passo + 1) / total) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-acs-line flex-shrink-0">
          <span className="font-mono text-[11px] uppercase tracking-[.14em] text-acs-ink-3">
            Passo {passo + 1} de {total}
          </span>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-acs-paper flex items-center justify-center text-acs-ink-3 hover:text-acs-ink transition-colors"
            aria-label="Fechar ajuda"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="px-6 py-6 flex-1 overflow-y-auto">
          {/* Ícone + título */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: atual.corBg }}
            >
              <Icon size={28} strokeWidth={1.8} style={{ color: atual.cor }} />
            </div>
            <h2 className="font-display font-bold text-acs-ink text-lg leading-tight">
              {atual.titulo}
            </h2>
          </div>

          {/* Descrição */}
          <p className="text-sm text-acs-ink-2 leading-relaxed mb-5">
            {atual.descricao}
          </p>

          {/* Dicas */}
          <div className="space-y-2.5">
            <p className="font-mono text-[10px] uppercase tracking-[.14em] text-acs-ink-3 mb-1">
              Dicas
            </p>
            {atual.dicas.map((dica, i) => (
              <div key={i} className="flex gap-2.5 items-start">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-[10px] font-bold mt-0.5"
                  style={{ backgroundColor: atual.corBg, color: atual.cor }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-acs-ink-2 leading-relaxed">{dica}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dots de navegação */}
        <div className="flex items-center justify-center gap-1.5 py-3 border-t border-acs-line flex-shrink-0">
          {PASSOS.map((_, i) => (
            <button
              key={i}
              onClick={() => setPasso(i)}
              aria-label={`Ir para passo ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${
                i === passo
                  ? 'w-5 h-2 bg-acs-azul'
                  : 'w-2 h-2 bg-acs-paper-2 hover:bg-acs-ink-3'
              }`}
            />
          ))}
        </div>

        {/* Navegação */}
        <div className="flex gap-3 px-5 pb-6 flex-shrink-0">
          <button
            onClick={anterior}
            disabled={passo === 0}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-acs-line text-acs-ink-2 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-acs-paper transition-colors"
          >
            <ChevronLeft size={16} strokeWidth={2.2} />
            Anterior
          </button>
          <button
            onClick={proximo}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-acs-azul text-white text-sm font-semibold hover:bg-acs-azul-700 transition-colors"
          >
            {passo === total - 1 ? 'Concluir' : 'Próximo'}
            {passo < total - 1 && <ChevronRight size={16} strokeWidth={2.2} />}
          </button>
        </div>
      </div>
    </div>
  )
}
