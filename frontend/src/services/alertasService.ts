import api from './api'

export type UrgenciaAlerta = 'urgente' | 'atencao' | 'informativo'

export type TipoAlerta =
  | 'alto_risco_sem_visita'
  | 'encaminhamento_pendente'
  | 'encaminhamento_ausencia'
  | 'novo_encaminhamento'
  | 'cronico_sem_acompanhamento'
  | 'gestante_sem_prenatal'
  | 'vacina_atrasada'
  | 'familia_multiplo_risco'

export interface AlertaAPI {
  id: number
  paciente_id: number | null
  paciente_nome: string | null
  nivel_risco: string | null
  tipo: TipoAlerta
  urgencia: UrgenciaAlerta
  titulo: string
  mensagem: string
  resolvido: number
  data_resolucao: string | null
  created_at: string
  encaminhamento_id: number | null
}

export const alertasService = {
  listar:   (resolvido = false) =>
    api.get<AlertaAPI[]>('/alertas', { params: { resolvido: resolvido ? 1 : 0 } }),

  resolver: (id: number) =>
    api.patch(`/alertas/${id}/resolver`),
}
