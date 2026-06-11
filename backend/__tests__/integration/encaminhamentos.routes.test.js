/**
 * Testes de integração — POST /api/encaminhamentos
 *
 * O banco (db) e o service de alertas são mockados; a app Express
 * real é usada via supertest, garantindo validações, middlewares e
 * rotas corretos sem precisar de um banco de dados real.
 */
'use strict'

process.env.JWT_SECRET = 'test-secret'

const request = require('supertest')
const jwt     = require('jsonwebtoken')

// ── Mocks ────────────────────────────────────────────────────────
// Valor padrão resolvido para queries que rodam no boot dos módulos (ALTER TABLE, etc.)
const mockQuery = jest.fn().mockResolvedValue([[]])
jest.mock('../../config/db', () => ({
  query:         mockQuery,
  getConnection: jest.fn(),
}))

// Evita que o backfill/ALTER TABLE do alertas.js falhe no boot
jest.mock('../../services/alertas', () => ({
  alertaPorNovoEncaminhamento:              jest.fn().mockResolvedValue([]),
  backfillAlertasEncaminhamentosParaGestores: jest.fn().mockResolvedValue({ inseridos: 0 }),
  gerarAlertasEncaminhamentosVencidos:       jest.fn().mockResolvedValue({ inseridos: 0 }),
}))

const app = require('../../app')

// Token JWT válido de um ACS fictício
const TOKEN_ACS = jwt.sign(
  { id: 99, perfil: 'acs', municipio_id: 1 },
  'test-secret',
  { expiresIn: '1h' }
)

const AUTH = { Authorization: `Bearer ${TOKEN_ACS}` }

// Payload mínimo válido para criar encaminhamento
const PAYLOAD_VALIDO = {
  paciente_id:         1,
  tipo:                'consulta_medica',
  motivo:              'Dor abdominal persistente',
  data_encaminhamento: '2026-06-11',
  data_prevista:       '2026-06-20',
}

// Linha que o SELECT retorna após o INSERT
const ENC_ROW = {
  id: 10, paciente_id: 1, acs_id: 99, tipo: 'consulta_medica',
  motivo: 'Dor abdominal persistente', status: 'pendente',
  data_encaminhamento: '2026-06-11', data_prevista: '2026-06-20',
  paciente_nome: 'João Silva', paciente_nivel_risco: 'medio',
  acs_nome: 'Ana ACS', unidade_saude_nome: null,
  vencido: 0, dias_atraso: null,
}

beforeEach(() => mockQuery.mockReset())

// ─────────────────────────────────────────────────────────────────
// POST /api/encaminhamentos
// ─────────────────────────────────────────────────────────────────
describe('POST /api/encaminhamentos', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).post('/api/encaminhamentos').send(PAYLOAD_VALIDO)
    expect(res.status).toBe(401)
  })

  it('retorna 400 quando paciente_id não é fornecido', async () => {
    const res = await request(app)
      .post('/api/encaminhamentos')
      .set(AUTH)
      .send({ tipo: 'consulta_medica', motivo: 'x' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/paciente_id/)
  })

  it('retorna 400 quando motivo não é fornecido', async () => {
    const res = await request(app)
      .post('/api/encaminhamentos')
      .set(AUTH)
      .send({ paciente_id: 1, tipo: 'consulta_medica' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/motivo/)
  })

  it('retorna 400 para tipo inválido', async () => {
    const res = await request(app)
      .post('/api/encaminhamentos')
      .set(AUTH)
      .send({ paciente_id: 1, motivo: 'x', tipo: 'tipo_errado' })
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/tipo/)
  })

  it('retorna 404 quando paciente não existe', async () => {
    mockQuery.mockResolvedValueOnce([[]])  // SELECT paciente → vazio

    const res = await request(app)
      .post('/api/encaminhamentos')
      .set(AUTH)
      .send(PAYLOAD_VALIDO)
    expect(res.status).toBe(404)
    expect(res.body.message).toMatch(/Paciente não encontrado/)
  })

  it('cria encaminhamento e retorna 201 com dados completos', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 1 }]])           // SELECT paciente existe
      .mockResolvedValueOnce([{ insertId: 10 }])       // INSERT encaminhamento
      .mockResolvedValueOnce([[ENC_ROW]])               // SELECT após INSERT

    const res = await request(app)
      .post('/api/encaminhamentos')
      .set(AUTH)
      .send(PAYLOAD_VALIDO)

    expect(res.status).toBe(201)
    expect(res.body.id).toBe(10)
    expect(res.body.status).toBe('pendente')
    expect(res.body.paciente_nome).toBe('João Silva')
  })

  it('status default é pendente mesmo sem passar status no body', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ id: 1 }]])
      .mockResolvedValueOnce([{ insertId: 11 }])
      .mockResolvedValueOnce([[{ ...ENC_ROW, id: 11 }]])

    const { data_prevista: _, ...semDataPrevista } = PAYLOAD_VALIDO
    const res = await request(app)
      .post('/api/encaminhamentos')
      .set(AUTH)
      .send(semDataPrevista)

    expect(res.status).toBe(201)
    expect(res.body.status).toBe('pendente')
  })
})

// ─────────────────────────────────────────────────────────────────
// GET /api/encaminhamentos
// ─────────────────────────────────────────────────────────────────
describe('GET /api/encaminhamentos', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/api/encaminhamentos')
    expect(res.status).toBe(401)
  })

  it('retorna 200 com lista de encaminhamentos', async () => {
    mockQuery.mockResolvedValue([[ENC_ROW]])

    const res = await request(app)
      .get('/api/encaminhamentos')
      .set(AUTH)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })

  it('retorna 400 para status inválido no filtro', async () => {
    const res = await request(app)
      .get('/api/encaminhamentos?status=invalido')
      .set(AUTH)
    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/status inválido/)
  })
})
