import api from './api'
import { cachedGet, queuedMutation } from './offlineMiddleware'
import { cacheInvalidatePrefix } from './offlineCache'

export interface VisitaAPI {
  id: number
  paciente_id: number
  acs_id: number
  acs_nome: string
  data_hora: string
  tipo_visita: TipoVisita
  status: 'planejada' | 'realizada' | 'cancelada' | 'remarcada'
  observacao: string | null
  flags: VisitaFlag[] | null
  triagem_id: number | null
  created_at: string
}

export type VisitaFlag =
  | 'agua_parada'
  | 'familia_vulneravel'
  | 'animal_sem_vacina'
  | 'crianca_fora_escola'
  | 'idoso_sozinho'
  | 'condicao_moradia_precaria'
  | 'violencia_suspeita'
  | 'ausente'

export interface VisitaFlagConfig {
  id: VisitaFlag
  label: string
  descricao: string
  cor: string
  urgente: boolean
}

export const VISITA_FLAGS: VisitaFlagConfig[] = [
  {
    id: 'agua_parada',
    label: 'Água parada',
    descricao: 'Ponto de água parada — risco de dengue/mosquitos',
    cor: '#F2B134',
    urgente: true,
  },
  {
    id: 'familia_vulneravel',
    label: 'Família vulnerável',
    descricao: 'Família em situação de vulnerabilidade social',
    cor: '#E76F4A',
    urgente: true,
  },
  {
    id: 'animal_sem_vacina',
    label: 'Animal sem vacinação',
    descricao: 'Cães ou gatos sem vacinação/castração com acesso à rua',
    cor: '#8B5CF6',
    urgente: false,
  },
  {
    id: 'crianca_fora_escola',
    label: 'Criança fora da escola',
    descricao: 'Criança em idade escolar sem frequência',
    cor: '#E76F4A',
    urgente: true,
  },
  {
    id: 'idoso_sozinho',
    label: 'Idoso mora sozinho',
    descricao: 'Idoso sem suporte familiar ou cuidador',
    cor: '#F2B134',
    urgente: false,
  },
  {
    id: 'condicao_moradia_precaria',
    label: 'Moradia precária',
    descricao: 'Condição inadequada de habitação',
    cor: '#C8364A',
    urgente: false,
  },
  {
    id: 'violencia_suspeita',
    label: 'Suspeita de violência',
    descricao: 'Indícios de violência doméstica ou maus-tratos',
    cor: '#C8364A',
    urgente: true,
  },
  {
    id: 'ausente',
    label: 'Morador ausente',
    descricao: 'Ninguém encontrado no domicílio',
    cor: '#6C7788',
    urgente: false,
  },
]

export type TipoVisita = 'rotina' | 'busca_ativa' | 'retorno' | 'urgencia'

export const TIPO_VISITA_LABEL: Record<TipoVisita, string> = {
  rotina:      'Visita de rotina',
  busca_ativa: 'Busca ativa',
  retorno:     'Retorno',
  urgencia:    'Urgência',
}

export interface VisitasStats {
  hoje_realizadas:   number
  semana_realizadas: number
  semana_triagens:   number
  total_pacientes:   number
  urgentes:          number
  sem_visita:        number
  enc_vencidos:      number
}

export const visitasService = {
  stats: () =>
    cachedGet<VisitasStats>('/visitas/stats').then((data) => ({ data })),

  listar: (paciente_id: number) =>
    cachedGet<VisitaAPI[]>('/visitas', { paciente_id }).then((data) => ({ data })),

  registrar: async (payload: {
    paciente_id: number
    data_hora: string
    tipo_visita: TipoVisita
    observacao?: string
    flags?: VisitaFlag[]
  }) => {
    const result = await queuedMutation<VisitaAPI>(
      'POST', '/visitas',
      payload as unknown as Record<string, unknown>,
      { paciente_id: payload.paciente_id, tipo_visita: payload.tipo_visita, data_hora: payload.data_hora }
    )
    // Invalida cache do histórico desse paciente ao registrar online
    if (!result.queued) {
      await cacheInvalidatePrefix(`/visitas?paciente_id=${payload.paciente_id}`)
    }
    return result
  },
}
