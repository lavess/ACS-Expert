import {
  Home, Calendar, Users, ClipboardCheck, BadgeAlert,
  Settings, CircleHelp, Info, ShieldCheck,
} from 'lucide-react'
import type { AcsPerfil, NavItem } from './types'

// Itens de navegação principais (mostrados no topo).
// O badge de "Alertas" é mockado por enquanto — TODO: ligar com /api/alertas.
export const NAV_ITEMS: NavItem[] = [
  { id: 'inicio',    label: 'Início',    icon: Home,           to: '/dashboard' },
  { id: 'agenda',    label: 'Agenda',    icon: Calendar,       to: '/agenda' },
  { id: 'pacientes', label: 'Pacientes', icon: Users,          to: '/pacientes' },
  { id: 'triagens',  label: 'Encaminhamentos', icon: ClipboardCheck, to: '/encaminhamentos' },
  { id: 'alertas',   label: 'Alertas',   icon: BadgeAlert,     to: '/alertas', badge: 3, urgent: true },
]

// Itens secundários (rodapé / "Conta").
// `perfis` restringe a exibição — se ausente, o item aparece para todos.
export const SECONDARY_ITEMS: NavItem[] = [
  { id: 'config',   label: 'Configurações', icon: Settings,    to: '/perfil' },
  { id: 'usuarios', label: 'Usuários',      icon: ShieldCheck, to: '/usuarios', perfis: ['gestor'] },
  { id: 'ajuda',    label: 'Ajuda',         icon: CircleHelp },
  { id: 'sobre',    label: 'Sobre o app',   icon: Info },
]

/** Filtra itens conforme o perfil do usuário. */
export function filterItemsByPerfil(items: NavItem[], perfil: AcsPerfil): NavItem[] {
  return items.filter((it) => !it.perfis || it.perfis.includes(perfil))
}

// Mapa de id → path para que o shell decida a navegação a partir do id.
export const NAV_ID_TO_PATH: Partial<Record<NavItem['id'], string>> = {
  inicio:    '/dashboard',
  agenda:    '/agenda',
  pacientes: '/pacientes',
  triagens:  '/encaminhamentos',
  alertas:   '/alertas',
  config:    '/perfil',
  usuarios:  '/usuarios',
}

// Mapa inverso: pathname → NavId. Usado para destacar item ativo.
export function pathToNavId(pathname: string): NavItem['id'] | null {
  if (pathname.startsWith('/dashboard'))         return 'inicio'
  if (pathname.startsWith('/agenda'))            return 'agenda'
  if (pathname.startsWith('/paciente'))          return 'pacientes'  // /pacientes e /paciente/:id
  if (pathname.startsWith('/triagem'))           return 'triagens'
  if (pathname.startsWith('/encaminhamentos'))   return 'triagens'
  if (pathname.startsWith('/alertas'))           return 'alertas'
  if (pathname.startsWith('/usuarios'))          return 'usuarios'
  if (pathname.startsWith('/perfil'))            return 'config'
  return null
}
