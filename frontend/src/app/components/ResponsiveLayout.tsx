import { ReactNode, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Menu, X, Heart, MapPin, Users, ClipboardList, ShieldCheck } from 'lucide-react'
import { TourAjuda } from './TourAjuda'
import { BottomNav } from './BottomNav'
import {
  SideNav,
  MobileDrawer,
  pathToNavId,
  NAV_ID_TO_PATH,
  useMediaQuery,
  useEdgeSwipe,
  type NavId,
} from './SideNav'
import { useCurrentAcs } from '@/hooks/useCurrentAcs'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import { useAuth }       from '@/hooks/useAuth'

interface ResponsiveLayoutProps {
  children: ReactNode
  showNav?: boolean
}

export function ResponsiveLayout({ children, showNav = true }: ResponsiveLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const isLoginPage = location.pathname === '/'

  const isDesktop = useMediaQuery('(min-width: 1024px)')

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sobreOpen, setSobreOpen]   = useState(false)
  const [tourOpen, setTourOpen]     = useState(false)

  const acsUser = useCurrentAcs()
  const sync    = useSyncStatus()

  // Swipe da borda esquerda abre o drawer (só mobile, com nav habilitada)
  useEdgeSwipe({
    enabled: !isLoginPage && showNav && !isDesktop && !drawerOpen,
    onOpen:  () => setDrawerOpen(true),
  })

  const current = pathToNavId(location.pathname) ?? undefined

  const handleNavigate = (id: NavId) => {
    if (id === 'sobre') { setSobreOpen(true); return }
    if (id === 'ajuda') { setTourOpen(true);  return }
    const path = NAV_ID_TO_PATH[id]
    if (path) navigate(path)
  }

  const handleShortcut = (a: 'triagem' | 'cadastro') => {
    if (a === 'cadastro') navigate('/novo-paciente')
    if (a === 'triagem')  navigate('/pacientes')   // pacientes → escolher paciente → triagem
  }

  const handleMicroareaChange = (_ma: string) => {
    // TODO: ligar com API — atualizar microárea ativa do ACS no contexto.
  }

  const showSideNav = !isLoginPage && showNav && !!acsUser

  // Hambúrguer aparece apenas nas rotas "primárias". Detalhes/wizards
  // têm seu próprio "Voltar"; /alertas mantém seu back btn nativo.
  const PRIMARY_PATHS = new Set([
    '/dashboard', '/agenda', '/pacientes',
    '/encaminhamentos', '/perfil', '/usuarios',
  ])
  const isPrimaryRoute = PRIMARY_PATHS.has(location.pathname)
  const showHamburger  = showSideNav && isPrimaryRoute

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop: sidebar persistente */}
        {showSideNav && (
          <SideNav
            user={acsUser!}
            sync={sync}
            current={current as NavId}
            onNavigate={handleNavigate}
            onMicroareaChange={handleMicroareaChange}
            onShortcut={handleShortcut}
            onLogout={logout}
            layout="desktop"
          />
        )}

        {/* Conteúdo principal */}
        <main className={`flex-1 overflow-y-auto ${!isLoginPage ? 'pb-16 lg:pb-0' : ''}`}>
          {/* Hambúrguer flutuante mobile (rotas primárias) */}
          {showHamburger && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={drawerOpen}
              aria-controls="side-drawer"
              className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-xl bg-white border border-acs-line text-acs-ink-2 shadow-[0_2px_8px_rgba(10,20,40,.10)] flex items-center justify-center active:scale-95 transition-transform"
            >
              <Menu size={20} strokeWidth={2} />
            </button>
          )}
          {children}
        </main>
      </div>

      {/* Bottom nav mobile (coexiste com o drawer) */}
      {!isLoginPage && showNav && (
        <div className="lg:hidden">
          <BottomNav />
        </div>
      )}

      {/* Tour de ajuda */}
      {tourOpen && <TourAjuda onClose={() => setTourOpen(false)} />}

      {/* Modal Sobre o app */}
      {sobreOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Sobre o ACS Expert"
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setSobreOpen(false)} />
          <div className="relative z-10 bg-white w-full max-w-md rounded-t-3xl lg:rounded-2xl shadow-[0_20px_60px_rgba(10,20,40,.25)] overflow-hidden">
            {/* Header */}
            <div className="bg-acs-azul px-6 pt-6 pb-8">
              <button
                onClick={() => setSobreOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Fechar"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-[14px] bg-white/15 flex items-center justify-center">
                  <Heart size={24} className="text-white" strokeWidth={1.8} />
                </div>
                <div>
                  <h2 className="font-display font-bold text-white text-lg leading-tight">ACS Expert</h2>
                  <p className="font-mono text-[11px] text-white/70 uppercase tracking-[.14em]">Versão 1.0</p>
                </div>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">
                Ferramenta digital para Agentes Comunitários de Saúde do SUS, desenvolvida para apoiar o trabalho de campo no território.
              </p>
            </div>

            {/* Features */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-acs-azul-100 flex items-center justify-center flex-shrink-0">
                  <Users size={18} className="text-acs-azul" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-semibold text-acs-ink text-sm">Gestão de pacientes</p>
                  <p className="text-xs text-acs-ink-3 leading-relaxed">Cadastro completo de famílias e indivíduos com histórico de saúde, comorbidades e acompanhamento longitudinal.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-acs-verde/15 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-acs-verde" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-semibold text-acs-ink text-sm">Agenda e rotas de visita</p>
                  <p className="text-xs text-acs-ink-3 leading-relaxed">Planejamento diário de visitas domiciliares com mapa interativo, priorização por risco e integração com Google Maps e Waze.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-acs-amar/20 flex items-center justify-center flex-shrink-0">
                  <ClipboardList size={18} className="text-acs-amar" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-semibold text-acs-ink text-sm">Triagens e encaminhamentos</p>
                  <p className="text-xs text-acs-ink-3 leading-relaxed">Registro de triagens com cálculo automático de risco, controle de encaminhamentos a serviços de saúde e alertas por SLA vencido.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-acs-coral/15 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={18} className="text-acs-coral" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="font-semibold text-acs-ink text-sm">Controle por perfil de acesso</p>
                  <p className="text-xs text-acs-ink-3 leading-relaxed">Perfis distintos para ACS, Coordenador e Gestor, com visibilidade e permissões adequadas a cada função na equipe de saúde.</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-1 border-t border-acs-line">
              <p className="text-[11px] text-acs-ink-3 text-center">
                Desenvolvido para apoiar o SUS · Joinville – SC
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {showSideNav && !isDesktop && (
        <MobileDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          user={acsUser!}
          sync={sync}
          current={current as NavId}
          onNavigate={handleNavigate}
          onMicroareaChange={handleMicroareaChange}
          onShortcut={handleShortcut}
          onLogout={logout}
          layout="mobile"
        />
      )}
    </div>
  )
}
