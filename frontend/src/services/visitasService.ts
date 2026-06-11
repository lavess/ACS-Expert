import api from './api'

export interface VisitaAPI {
  id: number
  paciente_id: number
  acs_id: number
  acs_nome: string
  data_hora: string
  tipo_visita: TipoVisita
  status: 'planejada' | 'realizada' | 'cancelada' | 'remarcada'
  observacao: string | null
  created_at: string
}

export type TipoVisita = 'rotina' | 'busca_ativa' | 'retorno' | 'urgencia'

export const TIPO_VISITA_LABEL: Record<TipoVisita, string> = {
  rotina:      'Visita de rotina',
  busca_ativa: 'Busca ativa',
  retorno:     'Retorno',
  urgencia:    'Urgência',
}

export const visitasService = {
  listar: (paciente_id: number) =>
    api.get<VisitaAPI[]>('/visitas', { params: { paciente_id } }),

  registrar: (payload: {
    paciente_id: number
    data_hora: string
    tipo_visita: TipoVisita
    observacao?: string
  }) => api.post<VisitaAPI>('/visitas', payload),
}
