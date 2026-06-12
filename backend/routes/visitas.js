const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { auth } = require('../middlewares/auth');

router.use(auth);

// ── GET /api/visitas/stats ────────────────────────────────────
// Retorna contagens de visitas/triagens para o usuário logado,
// com escopo automático por perfil (ACS → próprio, gestor/coord → municipio).
router.get('/stats', async (req, res) => {
  try {
    const { id: userId, perfil } = req.usuario;
    const isAcs = perfil === 'acs';

    // Gestor/coordenador vê todos os pacientes (sem filtro de municipio —
    // a tabela pacientes não tem municipio_id direto).
    const acsFilter    = isAcs ? 'AND v.acs_id = ?'               : '';
    const acsParams    = isAcs ? [userId]                          : [];
    const pacFilter    = isAcs ? 'AND acs_responsavel_id = ?'      : '';
    const pacParams    = isAcs ? [userId]                          : [];
    const triagemFilter = isAcs ? 'AND t.acs_id = ?'              : '';
    const triagemParams = isAcs ? [userId]                         : [];

    const [[{ hoje_realizadas }]] = await db.query(
      `SELECT COUNT(*) AS hoje_realizadas
         FROM visitas v
        WHERE DATE(v.data_hora) = CURDATE() ${acsFilter}`,
      acsParams
    );

    const [[{ semana_realizadas }]] = await db.query(
      `SELECT COUNT(*) AS semana_realizadas
         FROM visitas v
        WHERE YEARWEEK(v.data_hora, 1) = YEARWEEK(CURDATE(), 1) ${acsFilter}`,
      acsParams
    );

    const [[{ semana_triagens }]] = await db.query(
      `SELECT COUNT(*) AS semana_triagens
         FROM triagens t
        WHERE YEARWEEK(t.created_at, 1) = YEARWEEK(CURDATE(), 1) ${triagemFilter}`,
      triagemParams
    );

    const [[{ total_pacientes }]] = await db.query(
      `SELECT COUNT(*) AS total_pacientes FROM pacientes WHERE ativo = 1 ${pacFilter}`,
      pacParams
    );

    const [[{ urgentes }]] = await db.query(
      `SELECT COUNT(*) AS urgentes FROM pacientes WHERE ativo = 1 AND nivel_risco = 'alto' ${pacFilter}`,
      pacParams
    );

    const [[{ sem_visita }]] = await db.query(
      `SELECT COUNT(*) AS sem_visita FROM pacientes
        WHERE ativo = 1
          AND (data_ultima_visita IS NULL OR data_ultima_visita < DATE_SUB(CURDATE(), INTERVAL 30 DAY))
          ${pacFilter}`,
      pacParams
    );

    const [[{ enc_vencidos }]] = await db.query(
      `SELECT COUNT(*) AS enc_vencidos FROM encaminhamentos e
        WHERE e.status = 'pendente'
          AND e.data_prevista IS NOT NULL
          AND e.data_prevista < CURDATE()
          ${isAcs ? 'AND e.acs_id = ?' : ''}`,
      isAcs ? [userId] : []
    );

    res.json({
      hoje_realizadas:   Number(hoje_realizadas),
      semana_realizadas: Number(semana_realizadas),
      semana_triagens:   Number(semana_triagens),
      total_pacientes:   Number(total_pacientes),
      urgentes:          Number(urgentes),
      sem_visita:        Number(sem_visita),
      enc_vencidos:      Number(enc_vencidos),
    });
  } catch (err) {
    console.error('[VISITAS/stats]', err);
    res.status(500).json({ message: 'Erro ao buscar estatísticas.', error: err.message });
  }
});

// ── GET /api/visitas?paciente_id=X ───────────────────────────
router.get('/', async (req, res) => {
  try {
    const { paciente_id } = req.query;
    if (!paciente_id) return res.status(400).json({ message: 'paciente_id obrigatório.' });

    const [rows] = await db.query(`
      SELECT v.id, v.paciente_id, v.acs_id, v.data_hora,
             v.tipo_visita, v.status, v.observacao, v.flags, v.created_at,
             u.nome AS acs_nome,
             t.id AS triagem_id
        FROM visitas v
        JOIN usuarios u ON u.id = v.acs_id
        LEFT JOIN triagens t ON t.visita_id = v.id
       WHERE v.paciente_id = ?
       ORDER BY v.data_hora DESC
       LIMIT 50
    `, [paciente_id]);

    // mysql2 pode retornar JSON como string — garantir array
    const resultado = rows.map((r) => ({
      ...r,
      flags: r.flags
        ? (typeof r.flags === 'string' ? JSON.parse(r.flags) : r.flags)
        : [],
    }));

    res.json(resultado);
  } catch (err) {
    console.error('[VISITAS/listar]', err);
    res.status(500).json({ message: 'Erro ao listar visitas.', error: err.message });
  }
});

// ── POST /api/visitas ─────────────────────────────────────────
router.post('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const { paciente_id, data_hora, tipo_visita, observacao, flags } = req.body;
    const acs_id = req.usuario.id;

    if (!paciente_id || !data_hora || !tipo_visita) {
      return res.status(400).json({ message: 'paciente_id, data_hora e tipo_visita são obrigatórios.' });
    }

    const TIPOS_VALIDOS = ['rotina', 'busca_ativa', 'retorno', 'urgencia'];
    if (!TIPOS_VALIDOS.includes(tipo_visita)) {
      return res.status(400).json({ message: 'tipo_visita inválido.' });
    }

    const flagsJson = Array.isArray(flags) && flags.length > 0 ? JSON.stringify(flags) : null;

    const [result] = await conn.query(
      `INSERT INTO visitas (paciente_id, acs_id, data_hora, tipo_visita, status, observacao, flags, created_at)
       VALUES (?, ?, ?, ?, 'realizada', ?, ?, NOW())`,
      [paciente_id, acs_id, data_hora, tipo_visita, observacao ?? null, flagsJson]
    );

    // Atualiza data_ultima_visita no paciente
    await conn.query(
      `UPDATE pacientes SET data_ultima_visita = ?, updated_at = NOW()
       WHERE id = ? AND (data_ultima_visita IS NULL OR data_ultima_visita < ?)`,
      [data_hora, paciente_id, data_hora]
    );

    await conn.commit();

    const [[visita]] = await conn.query(
      `SELECT v.*, u.nome AS acs_nome FROM visitas v JOIN usuarios u ON u.id = v.acs_id WHERE v.id = ?`,
      [result.insertId]
    );

    res.status(201).json(visita);
  } catch (err) {
    await conn.rollback();
    console.error('[VISITAS/criar]', err);
    res.status(500).json({ message: 'Erro ao registrar visita.', error: err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
