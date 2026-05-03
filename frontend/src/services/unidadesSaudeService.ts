import api from './api'
import type { UnidadeSaude } from '@/types'

export interface UnidadeSaudeAPI {
  id:           number
  nome:         string
  tipo:         UnidadeSaude['tipo']
  endereco?:    string
  municipio_id: number
  latitude?:    number
  longitude?:   number
}

export const unidadesSaudeService = {
  listar: (params?: { municipio_id?: number; tipo?: UnidadeSaude['tipo'] }) =>
    api.get<UnidadeSaudeAPI[]>('/unidades-saude', { params }),
}

export const TIPO_UNIDADE_LABEL: Record<UnidadeSaudeAPI['tipo'], string> = {
  ubs:          'UBS',
  caps:         'CAPS',
  hospital:     'Hospital',
  laboratorio:  'Laboratório',
  outro:        'Outro',
}
