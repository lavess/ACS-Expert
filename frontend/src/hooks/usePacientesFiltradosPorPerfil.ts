import { useAuthStore } from '@/store/authStore'
import type { ListarPacientesParams } from '@/services/pacientesService'

/**
 * Retorna os parâmetros extras de filtragem da listagem de pacientes
 * de acordo com o perfil do usuário logado:
 *
 * - acs         → filtra pela microárea do ACS (se cadastrada); caso contrário
 *                 filtra por acs_responsavel_id para não retornar tudo
 * - coordenador → vê todos do município (backend restringe pelo token)
 * - gestor      → vê tudo do município (idem)
 */
export function usePacientesFiltradosPorPerfil(): Partial<ListarPacientesParams> {
  const usuario = useAuthStore((s) => s.usuario)

  if (!usuario) return {}

  if (usuario.perfil === 'acs') {
    if (usuario.microareaId) {
      return { microarea_id: usuario.microareaId }
    }
    return { acs_responsavel_id: usuario.id }
  }

  return {}
}
