import api from './api'

export interface RelatorioProducaoAcs {
  acs_id: number
  acs_nome: string
  microarea: string | null
  total_triagens: number
  total_encaminhamentos: number
  encaminhamentos_realizados: number
  encaminhamentos_vencidos: number
  pacientes_alto_risco: number
  pacientes_moderado_risco: number
  pacientes_baixo_risco: number
}

export interface RelatorioProducao {
  periodo: { de: string | null; ate: string | null }
  totais: {
    total_triagens: number
    total_encaminhamentos: number
    encaminhamentos_realizados: number
    encaminhamentos_vencidos: number
  }
  acs: RelatorioProducaoAcs[]
}

export interface RelatorioEncaminhamentoItem {
  id: number
  paciente_nome: string
  acs_nome: string
  microarea: string | null
  tipo: string
  motivo: string
  unidade_saude: string | null
  data_encaminhamento: string
  data_prevista: string | null
  status: string
  data_desfecho: string | null
  dias_atraso: number | null
}

export interface RelatorioEncaminhamentos {
  periodo: { de: string | null; ate: string | null }
  resumo: Record<string, number>
  total: number
  encaminhamentos: RelatorioEncaminhamentoItem[]
}

export const relatoriosService = {
  producao: (params?: { de?: string; ate?: string }) =>
    api.get<RelatorioProducao>('/relatorios/producao', { params }),

  encaminhamentos: (params?: { de?: string; ate?: string; status?: string }) =>
    api.get<RelatorioEncaminhamentos>('/relatorios/encaminhamentos', { params }),
}
