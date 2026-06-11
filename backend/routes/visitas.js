const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { auth } = require('../middlewares/auth');

router.use(auth);

// ── GET /api/visitas?paciente_id=X ───────────────────────────
router.get('/', async (req, res) => {
  try {
    const { paciente_id } = req.query;
    if (!paciente_id) return res.status(400).json({ message: 'paciente_id obrigatório.' });

    const [rows] = await db.query(`
      SELECT v.id, v.paciente_id, v.acs_id, v.data_hora,
             v.tipo_visita, v.status, v.observacao, v.created_at,
             u.nome AS acs_nome
        FROM visitas v
        JOIN usuarios u ON u.id = v.acs_id
       WHERE v.paciente_id = ?
       ORDER BY v.data_hora DESC
       LIMIT 50
    `, [paciente_id]);

    res.json(rows);
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

    const { paciente_id, data_hora, tipo_visita, observacao } = req.body;
    const acs_id = req.usuario.id;

    if (!paciente_id || !data_hora || !tipo_visita) {
      return res.status(400).json({ message: 'paciente_id, data_hora e tipo_visita são obrigatórios.' });
    }

    const TIPOS_VALIDOS = ['rotina', 'busca_ativa', 'retorno', 'urgencia'];
    if (!TIPOS_VALIDOS.includes(tipo_visita)) {
      return res.status(400).json({ message: 'tipo_visita inválido.' });
    }

    const [result] = await conn.query(
      `INSERT INTO visitas (paciente_id, acs_id, data_hora, tipo_visita, status, observacao, created_at)
       VALUES (?, ?, ?, ?, 'realizada', ?, NOW())`,
      [paciente_id, acs_id, data_hora, tipo_visita, observacao ?? null]
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
