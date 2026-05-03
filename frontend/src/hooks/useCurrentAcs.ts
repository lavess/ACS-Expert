import { useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { AcsUser } from '@/app/components/SideNav'

function iniciaisDe(nome: string): string {
  const partes = (nome || '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

/**
 * Devolve os dados do ACS logado já moldados no formato `AcsUser` que o
 * SideNav consome. Hoje deriva do usuário no auth store e usa mocks para
 * UBS, microáreas e estatísticas da semana.
 *
 * TODO: substituir os campos mockados por chamadas reais quando os
 * endpoints `/api/usuarios/me/contexto` e `/api/usuarios/me/semana`
 * estiverem disponíveis.
 */
export function useCurrentAcs(): AcsUser | null {
  const usuario = useAuthStore((s) => s.usuario)

  return useMemo<AcsUser | null>(() => {
    if (!usuario) return null
    return {
      id:        String(usuario.id),
      nome:      usuario.nome,
      iniciais:  iniciaisDe(usuario.nome),
      matricula: usuario.matricula,
      perfil:    usuario.perfil,
      // TODO: ligar com API — UBS real vem de /api/unidades-saude por usuario.
      ubs: {
        id:   '0',
        nome: 'UBS Joinville (mock)',
      },
      microareaAtual:      `MA-${String(usuario.microareaId ?? 0).padStart(2, '0')}`,
      microareasPossiveis: [
        `MA-${String(usuario.microareaId ?? 0).padStart(2, '0')}`,
      ],
      // TODO: ligar com API — métricas semanais reais.
      semana: {
        visitas:  12,
        triagens: 8,
        alertas:  3,
      },
    }
  }, [usuario])
}
