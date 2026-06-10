import api from './api'
import type { Comorbidade, NivelRisco, Sexo } from '@/types'

// ── Payloads (snake_case — espelham o backend) ─────────────────

export interface EnderecoPayload {
  nome_referencia?: string
  logradouro: string
  numero?: string
  complemento?: string
  bairro?: string
  cep?: string
  microarea_id?: number
  latitude?: number
  longitude?: number
}

export interface CriarPacientePayload {
  nome: string
  cpf?: string
  cns?: string
  identificador_municipal?: string
  data_nascimento: string       // 'YYYY-MM-DD'
  sexo: Sexo
  responsavel_domicilio?: boolean
  acs_responsavel_id?: number
  idoso_mora_sozinho?: boolean
  vulnerabilidade_social?: boolean
  dificuldade_locomocao?: boolean
  beneficio_social?: boolean
  endereco?: EnderecoPayload
  comorbidades?: Comorbidade[]
}

export type AtualizarPacientePayload = Partial<CriarPacientePayload> & {
  ativo?: boolean
}

// ── Respostas ──────────────────────────────────────────────────

export interface PacienteListagem {
  id: number
  nome: string
  cpf?: string
  cns?: string
  data_nascimento: string
  sexo: Sexo
  nivel_risco: NivelRisco
  score_risco_atual: number
  data_ultima_triagem?: string
  data_ultima_visita?: string
  ativo: number
  acs_responsavel_id?: number
  idoso_mora_sozinho: number
  vulnerabilidade_social: number
  dificuldade_locomocao: number
  beneficio_social: number
  domicilio_id?: number
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cep?: string
  microarea_id?: number
  microarea_nome?: string
  /** Encaminhamentos pendentes com data_prevista < hoje. */
  total_encaminhamentos_vencidos?: number
  /** Alertas não-resolvidos vinculados ao paciente. */
  alertas_pendentes?: number
  is_gestante?: number
  tem_comorbidade?: number
}

export interface PacienteDetalhe extends PacienteListagem {
  identificador_municipal?: string
  responsavel_domicilio: number
  nome_referencia?: string
  dom_latitude?: number
  dom_longitude?: number
  acs_nome?: string
  comorbidades: Comorbidade[]
}

// ── Service ────────────────────────────────────────────────────

export interface ListarPacientesParams {
  busca?: string
  nivel_risco?: NivelRisco
  microarea_id?: number
  acs_responsavel_id?: number
  ativo?: boolean
  comorbidade?: string
}

export const pacientesService = {
  listar: (params?: ListarPacientesParams) =>
    api.get<PacienteListagem[]>('/pacientes', { params }),

  buscarPorId: (id: number) =>
    api.get<PacienteDetalhe>(`/pacientes/${id}`),

  criar: (payload: CriarPacientePayload) =>
    api.post<PacienteListagem>('/pacientes', payload),

  atualizar: (id: number, payload: AtualizarPacientePayload) =>
    api.put<PacienteListagem>(`/pacientes/${id}`, payload),

  desativar: (id: number) =>
    api.delete(`/pacientes/${id}`),

  atualizarComorbidades: (id: number, comorbidades: Comorbidade[]) =>
    api.put(`/pacientes/${id}/comorbidades`, { comorbidades }),
}

// ── Helpers ────────────────────────────────────────────────────

export function calcularIdade(dataNascimento: string): number {
  if (!dataNascimento) return 0
  const nasc = new Date(dataNascimento)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const m = hoje.getMonth() - nasc.getMonth()
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
  return idade
}

export function riscoToUI(nivel: NivelRisco): 'urgent' | 'warning' | 'low' {
  if (nivel === 'alto') return 'urgent'
  if (nivel === 'moderado') return 'warning'
  return 'low'
}
