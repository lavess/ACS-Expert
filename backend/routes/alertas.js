const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { auth } = require('../middlewares/auth');

router.use(auth);

// ── GET /api/alertas ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { resolvido = '0' } = req.query;
    const acs_id = req.usuario.id;

    const [rows] = await db.query(`
      SELECT a.id, a.paciente_id, a.tipo, a.urgencia, a.titulo, a.mensagem,
             a.resolvido, a.data_resolucao, a.created_at,
             p.nome AS paciente_nome, p.nivel_risco
        FROM alertas a
        LEFT JOIN pacientes p ON p.id = a.paciente_id
       WHERE a.acs_id = ?
         AND a.resolvido = ?
       ORDER BY
         FIELD(a.urgencia, 'urgente', 'atencao', 'informativo'),
         a.created_at DESC
       LIMIT 100
    `, [acs_id, resolvido === '1' ? 1 : 0]);

    res.json(rows);
  } catch (err) {
    console.error('[ALERTAS/listar]', err);
    res.status(500).json({ message: 'Erro ao listar alertas.', error: err.message });
  }
});

// ── PATCH /api/alertas/:id/resolver ──────────────────────────
router.patch('/:id/resolver', async (req, res) => {
  try {
    const { id } = req.params;
    const acs_id = req.usuario.id;

    const [result] = await db.query(
      `UPDATE alertas SET resolvido = 1, data_resolucao = NOW()
       WHERE id = ? AND acs_id = ? AND resolvido = 0`,
      [id, acs_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Alerta não encontrado ou já resolvido.' });
    }

    res.json({ message: 'Alerta resolvido.' });
  } catch (err) {
    console.error('[ALERTAS/resolver]', err);
    res.status(500).json({ message: 'Erro ao resolver alerta.', error: err.message });
  }
});

module.exports = router;
