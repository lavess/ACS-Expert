import { ReactNode, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Menu } from 'lucide-react'
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

  const acsUser = useCurrentAcs()
  const sync    = useSyncStatus()

  // Swipe da borda esquerda abre o drawer (só mobile, com nav habilitada)
  useEdgeSwipe({
    enabled: !isLoginPage && showNav && !isDesktop && !drawerOpen,
    onOpen:  () => setDrawerOpen(true),
  })

  const current = pathToNavId(location.pathname) ?? undefined

  const handleNavigate = (id: NavId) => {
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
