import api from './api'
import { cachedGet, queuedMutation } from './offlineMiddleware'
import { cacheInvalidatePrefix } from './offlineCache'
import type {
  StatusEncaminhamento,
  TipoEncaminhamento,
  NivelRisco,
} from '@/types'

// ── Payloads (snake_case — espelham o backend) ──────────────

export interface CriarEncaminhamentoPayload {
  paciente_id:           number
  triagem_id?:           number
  tipo:                  TipoEncaminhamento
  motivo:                string
  unidade_saude_id?:     number | null
  data_encaminhamento?:  string   // ISO; default = agora no backend
  data_prevista?:        string   // 'YYYY-MM-DD'
  notificar_ausencia?:   boolean
  offline_uuid?:         string
}

export type StatusDesfecho = 'realizado' | 'ausencia' | 'cancelado'

export interface RegistrarDesfechoPayload {
  status:               StatusDesfecho
  observacao_desfecho?: string
  data_desfecho?:       string
}

// ── Resposta (achatada do backend) ──────────────────────────

export interface EncaminhamentoAPI {
  id:                       number
  triagem_id?:              number
  paciente_id:              number
  paciente_nome?:           string
  paciente_nivel_risco?:    NivelRisco
  acs_id:                   number
  acs_nome?:                string
  tipo:                     TipoEncaminhamento
  motivo:                   string
  unidade_saude_id?:        number
  unidade_saude_nome?:      string
  unidade_saude_tipo?:      'ubs' | 'caps' | 'hospital' | 'laboratorio' | 'outro'
  unidade_saude_endereco?:  string
  data_encaminhamento:      string
  data_prevista?:           string
  status:                   StatusEncaminhamento
  data_desfecho?:           string
  observacao_desfecho?:     string
  notificar_ausencia:       number
  alerta_gerado:            number
  /** 1 quando status='pendente' e data_prevista < hoje. Computado no SQL. */
  vencido:                  number
  /** Dias entre data_prevista e hoje (apenas para pendentes com data_prevista). */
  dias_atraso?:             number
  created_at:               string
  updated_at:               string
}

export interface ListarEncaminhamentosParams {
  status?:      StatusEncaminhamento | string  // permite "pendente,realizado"
  paciente_id?: number
  acs_id?:      number
  desde?:       string
  ate?:         string
  limit?:       number
  /** 1 → apenas encaminhamentos com SLA vencido (pendente + data_prevista < hoje). */
  vencido?:     1 | 0 | boolean
}

// ── Service ─────────────────────────────────────────────────

export const encaminhamentosService = {
  listar: (params?: ListarEncaminhamentosParams) =>
    cachedGet<EncaminhamentoAPI[]>('/encaminhamentos', params as Record<string, unknown>)
      .then((data) => ({ data })),

  buscarPorId: (id: number) =>
    cachedGet<EncaminhamentoAPI>(`/encaminhamentos/${id}`)
      .then((data) => ({ data })),

  criar: async (payload: CriarEncaminhamentoPayload) => {
    const result = await queuedMutation<EncaminhamentoAPI>(
      'POST', '/encaminhamentos',
      payload as unknown as Record<string, unknown>,
      { paciente_id: payload.paciente_id, tipo: payload.tipo, motivo: payload.motivo, status: 'pendente' }
    )
    if (!result.queued) await cacheInvalidatePrefix('/encaminhamentos')
    return result
  },

  registrarDesfecho: async (id: number, payload: RegistrarDesfechoPayload) => {
    const result = await queuedMutation<EncaminhamentoAPI & { alerta?: unknown }>(
      'PUT', `/encaminhamentos/${id}/desfecho`,
      payload as unknown as Record<string, unknown>
    )
    if (!result.queued) await cacheInvalidatePrefix('/encaminhamentos')
    return result
  },
}

// ── Helpers de UI ───────────────────────────────────────────

export const TIPO_ENCAMINHAMENTO_LABEL: Record<TipoEncaminhamento, string> = {
  consulta_medica: 'Consulta médica',
  enfermagem:      'Enfermagem',
  vacinacao:       'Vacinação',
  exame:           'Exame',
  urgencia:        'Urgência',
  especialista:    'Especialista',
}

export const STATUS_ENCAMINHAMENTO_LABEL: Record<StatusEncaminhamento, string> = {
  pendente:  'Pendente',
  realizado: 'Realizado',
  ausencia:  'Ausência',
  cancelado: 'Cancelado',
}

export function diasDesde(iso?: string): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms)) return null
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}
