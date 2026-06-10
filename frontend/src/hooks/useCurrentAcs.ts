import { useMemo, useEffect, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import type { AcsUser } from '@/app/components/SideNav'
import { pacientesService } from '@/services/pacientesService'

function iniciaisDe(nome: string): string {
  const partes = (nome || '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

export function useCurrentAcs(): AcsUser | null {
  const usuario = useAuthStore((s) => s.usuario)
  const [semana, setSemana] = useState({ visitas: 0, triagens: 0, alertas: 0 })

  useEffect(() => {
    if (!usuario) return
    pacientesService.listar({ ativo: 1 })
      .then(({ data }) => {
        const alertas = data.filter(p => p.nivel_risco === 'alto' || (p.alertas_pendentes ?? 0) > 0).length
        setSemana({ visitas: data.length, triagens: data.length, alertas })
      })
      .catch(() => {})
  }, [usuario])

  return useMemo<AcsUser | null>(() => {
    if (!usuario) return null
    return {
      id:        String(usuario.id),
      nome:      usuario.nome,
      iniciais:  iniciaisDe(usuario.nome),
      matricula: usuario.matricula,
      perfil:    usuario.perfil,
      ubs: {
        id:   '0',
        nome: 'UBS Joinville (mock)',
      },
      microareaAtual:      `MA-${String(usuario.microareaId ?? 0).padStart(2, '0')}`,
      microareasPossiveis: [
        `MA-${String(usuario.microareaId ?? 0).padStart(2, '0')}`,
      ],
      semana,
    }
  }, [usuario, semana])
}
