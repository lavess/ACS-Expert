import type { LucideIcon } from 'lucide-react'

export type Layout = 'mobile' | 'desktop'

export type NavId =
  | 'inicio' | 'agenda' | 'pacientes' | 'triagens' | 'alertas'
  | 'config' | 'ajuda' | 'sobre' | 'usuarios' | 'relatorios'

export type AcsPerfil = 'acs' | 'coordenador' | 'gestor'

export interface NavItem {
  id:      NavId
  label:   string
  icon:    LucideIcon
  /** Caminho de navegação. Quando ausente, item é apenas decorativo. */
  to?:     string
  /** Texto ou número exibido como pílula à direita. */
  badge?:  number | string
  /** Quando true, pinta o badge em coral (urgência). */
  urgent?: boolean
  /** Restringe a exibição do item a determinados perfis. */
  perfis?: AcsPerfil[]
}

export interface AcsUser {
  id:                  string
  nome:                string
  /** 2 chars derivados do nome em runtime. */
  iniciais:            string
  matricula:           string
  perfil:              AcsPerfil
  ubs:                 { id: string; nome: string }
  microareaAtual:      string
  microareasPossiveis: string[]
  semana?: {
    visitas:  number
    triagens: number
    alertas:  number
  }
}

export interface SyncState {
  online:      boolean
  pendingSync: number    // 0 = sincronizado
  lastSyncAt:  string    // ISO; UI formata relativo
}

export interface SideNavProps {
  user:               AcsUser
  sync:               SyncState
  current:            NavId
  onNavigate:         (id: NavId) => void
  onMicroareaChange:  (ma: string) => void
  onShortcut:         (action: 'triagem' | 'cadastro') => void
  onLogout:           () => void
  layout:             Layout
  showStats?:         boolean
}

export interface MobileDrawerProps extends SideNavProps {
  open:     boolean
  onClose:  () => void
  /** '85' = 86% da viewport com cantos arredondados; 'full' = 100%. */
  variant?: '85' | 'full'
}
