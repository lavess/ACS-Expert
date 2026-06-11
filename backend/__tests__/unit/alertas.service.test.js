/**
 * Testes unitários — services/alertas
 *
 * O banco (db) é mockado inteiramente; nenhuma conexão real é aberta.
 */
'use strict'

// ── Mock do pool de banco ───────────────────────────────────────
const mockQuery = jest.fn()
jest.mock('../../config/db', () => ({ query: mockQuery }))

const alertasService = require('../../services/alertas')

// Helper: reseta todos os mocks antes de cada teste
beforeEach(() => mockQuery.mockReset())

// ─────────────────────────────────────────────────────────────────
// criarAlerta
// ─────────────────────────────────────────────────────────────────
describe('criarAlerta', () => {
  it('insere um novo alerta e retorna { id, jaExistia: false }', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])          // SELECT dedup → sem duplicata
      .mockResolvedValueOnce([{ insertId: 42 }]) // INSERT

    const result = await alertasService.criarAlerta({
      paciente_id: 1,
      acs_id: 10,
      tipo: 'encaminhamento_pendente',
      urgencia: 'atencao',
      titulo: 'Encaminhamento vencido',
    })

    expect(result).toEqual({ id: 42, jaExistia: false })
    expect(mockQuery).toHaveBeenCalledTimes(2)
    // Primeiro call deve ser o SELECT de dedup
    expect(mockQuery.mock.calls[0][0]).toMatch(/SELECT id FROM alertas/)
  })

  it('devolve o id existente sem inserir quando alerta já existe', async () => {
    mockQuery.mockResolvedValueOnce([[{ id: 7 }]]) // SELECT dedup → encontrou

    const result = await alertasService.criarAlerta({
      paciente_id: 1,
      acs_id: 10,
      tipo: 'encaminhamento_pendente',
      urgencia: 'atencao',
      titulo: 'Encaminhamento vencido',
    })

    expect(result).toEqual({ id: 7, jaExistia: true })
    expect(mockQuery).toHaveBeenCalledTimes(1) // só o SELECT, sem INSERT
  })

  it('lança erro quando acs_id não é fornecido', async () => {
    await expect(
      alertasService.criarAlerta({ tipo: 'encaminhamento_pendente', titulo: 'x' })
    ).rejects.toThrow('acs_id é obrigatório')
  })

  it('lança erro quando titulo não é fornecido', async () => {
    await expect(
      alertasService.criarAlerta({ acs_id: 1, tipo: 'encaminhamento_pendente' })
    ).rejects.toThrow('titulo é obrigatório')
  })

  it('lança erro para tipo inválido', async () => {
    await expect(
      alertasService.criarAlerta({ acs_id: 1, titulo: 'x', tipo: 'tipo_inexistente' })
    ).rejects.toThrow('tipo inválido')
  })

  it('lança erro para urgencia inválida', async () => {
    await expect(
      alertasService.criarAlerta({
        acs_id: 1,
        titulo: 'x',
        tipo: 'encaminhamento_pendente',
        urgencia: 'critico',
      })
    ).rejects.toThrow('urgencia inválida')
  })
})

// ─────────────────────────────────────────────────────────────────
// alertaPorNovoEncaminhamento
// ─────────────────────────────────────────────────────────────────
describe('alertaPorNovoEncaminhamento', () => {
  const encaminhamento = {
    id: 5,
    paciente_id: 2,
    acs_id: 11,
    tipo: 'consulta_medica',
    motivo: 'Dor abdominal persistente',
    data_prevista: '2026-07-01',
  }

  it('cria alertas para todos os gestores/coordenadores ativos', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ nome: 'Maria' }]])           // SELECT paciente
      .mockResolvedValueOnce([[{ nome: 'João ACS' }]])        // SELECT acs
      .mockResolvedValueOnce([[{ id: 20 }, { id: 21 }]])      // SELECT gestores
      // Para cada gestor: SELECT dedup + INSERT
      .mockResolvedValueOnce([[]])                             // dedup gestor 20
      .mockResolvedValueOnce([{ insertId: 100 }])             // INSERT gestor 20
      .mockResolvedValueOnce([[]])                             // dedup gestor 21
      .mockResolvedValueOnce([{ insertId: 101 }])             // INSERT gestor 21

    const resultados = await alertasService.alertaPorNovoEncaminhamento(encaminhamento)

    expect(resultados).toHaveLength(2)
    expect(resultados[0]).toEqual({ id: 100, jaExistia: false })
    expect(resultados[1]).toEqual({ id: 101, jaExistia: false })
  })

  it('não cria alertas quando não há gestores ativos', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ nome: 'Maria' }]])
      .mockResolvedValueOnce([[{ nome: 'João ACS' }]])
      .mockResolvedValueOnce([[]])  // nenhum gestor

    const resultados = await alertasService.alertaPorNovoEncaminhamento(encaminhamento)
    expect(resultados).toHaveLength(0)
    // Nenhum INSERT deve ter ocorrido além dos 3 SELECTs iniciais
    expect(mockQuery).toHaveBeenCalledTimes(3)
  })

  it('inclui o label correto do tipo no título e mensagem', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ nome: 'Ana' }]])
      .mockResolvedValueOnce([[{ nome: 'Carlos ACS' }]])
      .mockResolvedValueOnce([[{ id: 20 }]])  // 1 gestor
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 99 }])

    await alertasService.alertaPorNovoEncaminhamento(encaminhamento)

    // Último INSERT deve conter 'Consulta médica' no campo mensagem
    const insertCall = mockQuery.mock.calls[4]
    const mensagem = insertCall[1][5] // índice 5 = mensagem no INSERT
    expect(mensagem).toContain('Consulta médica')
    expect(mensagem).toContain('Carlos ACS')
    expect(mensagem).toContain('Dor abdominal persistente')
  })
})

// ─────────────────────────────────────────────────────────────────
// gerarAlertasEncaminhamentosVencidos
// ─────────────────────────────────────────────────────────────────
describe('gerarAlertasEncaminhamentosVencidos', () => {
  it('retorna { inseridos: 0 } quando acsId é falsy', async () => {
    const result = await alertasService.gerarAlertasEncaminhamentosVencidos(null)
    expect(result).toEqual({ inseridos: 0 })
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('executa INSERT com acsId e retorna contagem', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 3 }])

    const result = await alertasService.gerarAlertasEncaminhamentosVencidos(10)
    expect(result).toEqual({ inseridos: 3 })
    expect(mockQuery.mock.calls[0][1]).toContain(10) // acsId no parâmetro
  })
})

// ─────────────────────────────────────────────────────────────────
// alertaPorAusenciaEncaminhamento
// ─────────────────────────────────────────────────────────────────
describe('alertaPorAusenciaEncaminhamento', () => {
  it('cria alerta urgente de ausência com nome do paciente no título', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ nome: 'Beatriz Santos' }]])  // SELECT paciente
      .mockResolvedValueOnce([[]])                             // dedup
      .mockResolvedValueOnce([{ insertId: 55 }])              // INSERT

    const result = await alertasService.alertaPorAusenciaEncaminhamento({
      paciente_id: 3,
      acs_id: 12,
      tipo: 'vacinacao',
      data_desfecho: new Date('2026-06-01'),
    })

    expect(result).toEqual({ id: 55, jaExistia: false })

    // Verifica urgência = 'urgente' e nome no título
    const insertCall = mockQuery.mock.calls[2]
    const [, params] = insertCall
    expect(params[3]).toBe('urgente')
    expect(params[4]).toContain('Beatriz Santos')
  })
})
