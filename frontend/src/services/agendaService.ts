import api from './api'
import type { NivelRisco } from '@/types'

export type StatusAgenda = 'pendente' | 'realizada' | 'adiada' | 'cancelada'

// Breakdown que o backend devolve em motivo_prioridade.
export interface AgendaMotivo {
  motivos:   string[]
  breakdown: {
    score_clinico:           number
    dias_sem_visita:         number | null
    peso_dias_sem_visita:    number
    peso_cronico:            number
    peso_evento_recente:     number
    peso_vulnerabilidade:    number
    total_cronicos:          number
    alertas_urgentes:        number
    alertas_atencao:         number
    triagens_altas_recentes: number
  }
  flags: {
    familia_multiplo_risco?:    boolean
    cronico_sem_acompanhamento?: boolean
  }
}

export interface AgendaItemAPI {
  id:                   number
  acs_id:               number
  paciente_id:          number
  data_agenda:          string
  ordem_prioridade:     number
  score_prioridade:     number
  motivo_prioridade:    AgendaMotivo | null
  status:               StatusAgenda
  visita_id?:           number
  created_at:           string
  // Joins:
  paciente_nome?:       string
  paciente_nivel_risco?: NivelRisco
  score_risco_atual?:   number
  idoso_mora_sozinho?:  number
  vulnerabilidade_social?: number
  dificuldade_locomocao?: number
  logradouro?:          string
  numero?:              string
  bairro?:              string
  cep?:                 string
  microarea_id?:        number
  microarea_nome?:      string
  latitude?:            number
  longitude?:           number
}

export interface AgendaResposta {
  data:        string
  total:       number
  realizadas:  number
  urgentes:    number
  itens:       AgendaItemAPI[]
}

export const agendaService = {
  hoje: (data?: string) =>
    api.get<AgendaResposta>('/agenda/hoje', { params: data ? { data } : undefined }),

  gerar: (payload?: { data?: string; limite?: number }) =>
    api.post<AgendaResposta>('/agenda/gerar', payload ?? {}),

  atualizarStatus: (id: number, status: StatusAgenda, visita_id?: number) =>
    api.put<{ id: number; status: StatusAgenda; visita_id: number | null }>(
      `/agenda/${id}/status`,
      { status, visita_id }
    ),
}

// ── Helpers de UI ───────────────────────────────────────────

export function corPrioridadePorRisco(
  nivel?: NivelRisco
): 'urgent' | 'warning' | 'low' {
  if (nivel === 'alto')     return 'urgent'
  if (nivel === 'moderado') return 'warning'
  return 'low'
}
