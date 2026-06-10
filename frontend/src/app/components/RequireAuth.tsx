import { Navigate, useLocation } from 'react-router'
import { useAuthStore } from '@/store/authStore'
import type { AcsPerfil } from './SideNav/types'

interface Props {
  children: React.ReactNode
  /** Se informado, apenas esses perfis podem acessar — demais são redirecionados. */
  perfis?: AcsPerfil[]
}

/**
 * Protege rotas: redireciona para /login se não autenticado,
 * ou para /dashboard se o perfil não tem permissão.
 */
export function RequireAuth({ children, perfis }: Props) {
  const { isAuthenticated, usuario } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (perfis && usuario && !perfis.includes(usuario.perfil as AcsPerfil)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
