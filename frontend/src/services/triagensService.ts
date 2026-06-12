import api from './api'
import type { Comorbidade, Sexo } from '@/types'

// ── Tipos do catálogo servido pelo backend ───────────────────

export interface SintomaCatalogo {
  id: string
  label: string
  group?: string
  sexFilter?: Sexo
}

export interface QualificadorCatalogo {
  id: string
  label: string
  sex?: Sexo
}

export interface DoencaCatalogo {
  id: string
  nome: string
  descricao?: string
  genderPref?: Sexo
}

export interface CatalogoTriagem {
  sintomas:       SintomaCatalogo[]
  qualificadores: Record<string, QualificadorCatalogo[]>
  doencas:        DoencaCatalogo[]
  faixas_etarias: string[]
}

// ── Payloads ─────────────────────────────────────────────────

export type FaixaEtariaStr =
  | '0-18' | '19-23' | '24-28' | '29-33' | '34-38'
  | '39-43' | '44-48' | '49-53' | '54-58' | '59+'

export interface TriagemPayload {
  faixa_etaria: FaixaEtariaStr
  sexo:         Sexo
  sintomas:     Record<string, { intensity: number }>
  riskFactors:  Comorbidade[]
  qualifiers:   Record<string, Record<string, boolean>>
}

export type NivelRiscoAPI       = 'baixo' | 'moderado' | 'alto'
export type NivelPrioridadeAPI  = 'muito_baixa' | 'baixa' | 'media' | 'alta'
export type AcaoRecomendadaAPI  = 'acompanhamento' | 'encaminhar_ubs' | 'urgencia'

export interface DoencaComputada {
  id:          string
  nome:        string
  descricao?:  string
  score:       number
  label:       'Alta' | 'Média' | 'Baixa'
  painWeight?: number
  sintomas?:   string[]
  genderPref?: Sexo
}

export interface TriagemResultadoAPI {
  top_doenca:       DoencaComputada | null
  score_final:      number
  nivel_risco:      NivelRiscoAPI
  nivel_prioridade: NivelPrioridadeAPI
  acao_recomendada: AcaoRecomendadaAPI
  computed:         DoencaComputada[]
  logs?:            unknown[]
}

export interface CriarTriagemPayload {
  paciente_id:   number
  visita_id?:    number
  payload:       Partial<TriagemPayload>
  offline_uuid?: string
}

export interface TriagemResumo {
  id:                 number
  visita_id:          number | null
  paciente_id:        number
  paciente_nome?:     string
  acs_id:             number
  acs_nome?:          string
  data_hora:          string
  faixa_etaria:       string
  sexo:               Sexo
  score_final:        number
  nivel_risco:        NivelRiscoAPI
  nivel_prioridade:   NivelPrioridadeAPI
  acao_recomendada:   AcaoRecomendadaAPI
  top_doenca_id?:     string
  top_doenca_nome?:   string
  top_doenca_score?:  number
  created_at:         string
}

// ── Service ──────────────────────────────────────────────────

export const triagensService = {
  catalogo: () =>
    api.get<CatalogoTriagem>('/triagens/catalogo'),

  avaliar: (payload: TriagemPayload) =>
    api.post<TriagemResultadoAPI>('/triagens/avaliar', payload),

  criar: (data: CriarTriagemPayload) =>
    api.post<{ id: number } & TriagemResultadoAPI>('/triagens', data),

  listar: (params?: {
    paciente_id?: number
    acs_id?: number
    nivel_risco?: NivelRiscoAPI
    desde?: string
    ate?: string
    limit?: number
  }) => api.get<TriagemResumo[]>('/triagens', { params }),

  buscarPorId: (id: number) =>
    api.get(`/triagens/${id}`),
}

// ── Helpers ──────────────────────────────────────────────────

export function idadeParaFaixaEtaria(idade: number): FaixaEtariaStr {
  if (idade <= 18) return '0-18'
  if (idade <= 23) return '19-23'
  if (idade <= 28) return '24-28'
  if (idade <= 33) return '29-33'
  if (idade <= 38) return '34-38'
  if (idade <= 43) return '39-43'
  if (idade <= 48) return '44-48'
  if (idade <= 53) return '49-53'
  if (idade <= 58) return '54-58'
  return '59+'
}

export function labelPrioridade(p: NivelPrioridadeAPI): string {
  switch (p) {
    case 'alta':        return 'ALTA PRIORIDADE'
    case 'media':       return 'PRIORIDADE MÉDIA'
    case 'baixa':       return 'BAIXA PRIORIDADE'
    case 'muito_baixa': return 'PRIORIDADE MUITO BAIXA'
  }
}

export function labelAcao(a: AcaoRecomendadaAPI): string {
  switch (a) {
    case 'urgencia':       return 'Encaminhar para UBS com urgência'
    case 'encaminhar_ubs': return 'Encaminhar para consulta médica na UBS'
    case 'acompanhamento': return 'Orientação domiciliar / acompanhamento'
  }
}

export function corPrioridade(p: NivelPrioridadeAPI): 'danger' | 'warning' | 'info' {
  if (p === 'alta')        return 'danger'
  if (p === 'media')       return 'warning'
  return 'info'
}
