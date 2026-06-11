/**
 * Testes unitários — alertasService
 *
 * Verifica que as chamadas HTTP são feitas com os parâmetros corretos.
 * O axios é mockado via vi.mock.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock do módulo api (Axios instance)
vi.mock('@/services/api', () => ({
  default: {
    get:   vi.fn(),
    patch: vi.fn(),
  },
}))

import api from '@/services/api'
import { alertasService } from '@/services/alertasService'

const mockGet   = api.get   as ReturnType<typeof vi.fn>
const mockPatch = api.patch as ReturnType<typeof vi.fn>

beforeEach(() => {
  mockGet.mockReset()
  mockPatch.mockReset()
})

describe('alertasService.listar', () => {
  it('chama GET /alertas com resolvido=0 por padrão', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await alertasService.listar()
    expect(mockGet).toHaveBeenCalledWith('/alertas', { params: { resolvido: 0 } })
  })

  it('chama GET /alertas com resolvido=1 quando true é passado', async () => {
    mockGet.mockResolvedValue({ data: [] })
    await alertasService.listar(true)
    expect(mockGet).toHaveBeenCalledWith('/alertas', { params: { resolvido: 1 } })
  })

  it('repassa os dados retornados pela API', async () => {
    const alertas = [{ id: 1, titulo: 'Teste', urgencia: 'atencao' }]
    mockGet.mockResolvedValue({ data: alertas })
    const result = await alertasService.listar(false)
    expect(result.data).toEqual(alertas)
  })
})

describe('alertasService.resolver', () => {
  it('chama PATCH /alertas/:id/resolver', async () => {
    mockPatch.mockResolvedValue({ data: { message: 'Alerta resolvido.' } })
    await alertasService.resolver(42)
    expect(mockPatch).toHaveBeenCalledWith('/alertas/42/resolver')
  })
})
