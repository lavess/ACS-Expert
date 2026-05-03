import { Logo } from '@/app/components/brand/Logo'
import type { SideNavProps } from './types'
import { NAV_ITEMS, SECONDARY_ITEMS, filterItemsByPerfil } from './nav-config'
import { AgenteHero }        from './parts/AgenteHero'
import { MicroareaSwitcher } from './parts/MicroareaSwitcher'
import { Atalhos }           from './parts/Atalhos'
import { NavList }           from './parts/NavList'
import { StatsBlock }        from './parts/StatsBlock'
import { SyncStatus }        from './parts/SyncStatus'
import { LogoutButton }      from './parts/LogoutButton'

interface Props extends SideNavProps {
  /** id usado pelo aria-labelledby do drawer (apenas mobile). */
  titleId?: string
}

/**
 * Componente raiz do menu lateral. Renderiza dois layouts:
 *  - mobile: para uso dentro de <MobileDrawer />
 *  - desktop: <aside> persistente de 252px à esquerda do shell
 *
 * Não monta overlay/animação (responsabilidade do MobileDrawer).
 */
export function SideNav(props: Props) {
  const {
    user, sync, current,
    onNavigate, onMicroareaChange, onShortcut, onLogout,
    layout, showStats = true, titleId,
  } = props

  const temSemana = !!user.semana
  const secondaryItems = filterItemsByPerfil(SECONDARY_ITEMS, user.perfil)

  if (layout === 'desktop') {
    return (
      <aside
        role="navigation"
        aria-label="Navegação principal"
        className="hidden lg:flex flex-col w-[252px] flex-shrink-0 bg-white border-r border-acs-line h-screen sticky top-0"
      >
        {/* Brand bar */}
        <div className="px-4 py-3.5 border-b border-acs-line flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[9px] bg-acs-azul flex items-center justify-center flex-shrink-0"
            aria-hidden="true"
          >
            <Logo variant="mark" size={20} color="#FFFFFF" />
          </div>
          <span
            className="font-display font-bold text-acs-ink"
            style={{ fontSize: 14, letterSpacing: '-0.01em' }}
          >
            ACS Expert
          </span>
        </div>

        <AgenteHero user={user} layout="desktop" />
        <MicroareaSwitcher user={user} layout="desktop" onChange={onMicroareaChange} />

        <div className="flex-1 overflow-y-auto min-h-0">
          <NavList items={NAV_ITEMS} layout="desktop" current={current} onPick={onNavigate} />
          <Atalhos layout="desktop" onAction={onShortcut} />
          {showStats && temSemana && (
            <StatsBlock layout="desktop" data={user.semana!} />
          )}
          <NavList items={secondaryItems} layout="desktop" current={current} onPick={onNavigate} heading="Conta" />
        </div>

        <SyncStatus sync={sync} layout="desktop" />
        <LogoutButton layout="desktop" onLogout={onLogout} />
      </aside>
    )
  }

  // Mobile (renderizado dentro do MobileDrawer)
  return (
    <div className="flex flex-col h-full bg-acs-paper">
      <AgenteHero user={user} layout="mobile" titleId={titleId} />

      <div className="flex-1 overflow-y-auto min-h-0">
        <MicroareaSwitcher user={user} layout="mobile" onChange={onMicroareaChange} />
        <Atalhos layout="mobile" onAction={onShortcut} />
        <NavList
          items={NAV_ITEMS}
          layout="mobile"
          current={current}
          onPick={onNavigate}
          heading="Navegar"
        />
        {showStats && temSemana && (
          <StatsBlock layout="mobile" data={user.semana!} />
        )}
        <NavList
          items={secondaryItems}
          layout="mobile"
          current={current}
          onPick={onNavigate}
          heading="Conta"
        />
      </div>

      <SyncStatus sync={sync} layout="mobile" />
      <LogoutButton layout="mobile" onLogout={onLogout} />
    </div>
  )
}
