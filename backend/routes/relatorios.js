const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { auth, perfil } = require('../middlewares/auth');

router.use(auth);
router.use(perfil('gestor', 'coordenador'));

// ── GET /api/relatorios/producao ──────────────────────────────
// Produção dos ACS: triagens + encaminhamentos por agente no período
router.get('/producao', async (req, res) => {
  try {
    const { de, ate } = req.query;
    const municipio_id = req.usuario.municipio_id;

    const params = [municipio_id];
    let filtroData = '';
    if (de && ate) {
      filtroData = 'AND DATE(t.data_hora) BETWEEN ? AND ?';
      params.push(de, ate);
    }

    const [rows] = await db.query(`
      SELECT
        u.id          AS acs_id,
        u.nome        AS acs_nome,
        ma.nome       AS microarea,
        COUNT(DISTINCT t.id)  AS total_triagens,
        COUNT(DISTINCT e.id)  AS total_encaminhamentos,
        SUM(CASE WHEN e.status = 'realizado' THEN 1 ELSE 0 END) AS encaminhamentos_realizados,
        SUM(CASE WHEN e.status = 'pendente' AND e.data_prevista < CURDATE() THEN 1 ELSE 0 END) AS encaminhamentos_vencidos,
        COUNT(DISTINCT CASE WHEN t.nivel_risco = 'alto'     THEN t.paciente_id END) AS pacientes_alto_risco,
        COUNT(DISTINCT CASE WHEN t.nivel_risco = 'moderado' THEN t.paciente_id END) AS pacientes_moderado_risco,
        COUNT(DISTINCT CASE WHEN t.nivel_risco = 'baixo'    THEN t.paciente_id END) AS pacientes_baixo_risco
      FROM usuarios u
      LEFT JOIN triagens t
        ON t.acs_id = u.id ${filtroData}
      LEFT JOIN encaminhamentos e
        ON e.acs_id = u.id
      LEFT JOIN microareas ma ON u.microarea_id = ma.id
      WHERE u.municipio_id = ?
        AND u.perfil = 'acs'
        AND u.ativo = 1
      GROUP BY u.id, u.nome, ma.nome
      ORDER BY total_triagens DESC
    `, [...params, municipio_id]);

    // totais gerais
    const totais = {
      total_triagens:              rows.reduce((s, r) => s + Number(r.total_triagens), 0),
      total_encaminhamentos:       rows.reduce((s, r) => s + Number(r.total_encaminhamentos), 0),
      encaminhamentos_realizados:  rows.reduce((s, r) => s + Number(r.encaminhamentos_realizados), 0),
      encaminhamentos_vencidos:    rows.reduce((s, r) => s + Number(r.encaminhamentos_vencidos), 0),
    };

    res.json({ periodo: { de: de ?? null, ate: ate ?? null }, totais, acs: rows });
  } catch (err) {
    console.error('[RELATORIOS/producao]', err);
    res.status(500).json({ message: 'Erro ao gerar relatório.', error: err.message });
  }
});

// ── GET /api/relatorios/encaminhamentos ───────────────────────
// Encaminhamentos do município com filtro de período e status
router.get('/encaminhamentos', async (req, res) => {
  try {
    const { de, ate, status } = req.query;
    const municipio_id = req.usuario.municipio_id;

    const params = [municipio_id];
    const filtros = [];

    if (de && ate) {
      filtros.push('DATE(e.data_encaminhamento) BETWEEN ? AND ?');
      params.push(de, ate);
    }
    if (status) {
      filtros.push('e.status = ?');
      params.push(status);
    }

    const where = filtros.length ? 'AND ' + filtros.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT
        e.id,
        p.nome           AS paciente_nome,
        u.nome           AS acs_nome,
        ma.nome          AS microarea,
        e.tipo,
        e.motivo,
        us.nome          AS unidade_saude,
        e.data_encaminhamento,
        e.data_prevista,
        e.status,
        e.data_desfecho,
        DATEDIFF(CURDATE(), e.data_prevista) AS dias_atraso
      FROM encaminhamentos e
      JOIN pacientes p  ON p.id = e.paciente_id
      JOIN usuarios u   ON u.id = e.acs_id
      LEFT JOIN microareas ma    ON u.microarea_id = ma.id
      LEFT JOIN unidades_saude us ON us.id = e.unidade_saude_id
      WHERE u.municipio_id = ?
        ${where}
      ORDER BY e.data_encaminhamento DESC
      LIMIT 500
    `, params);

    // resumo por status
    const resumo = rows.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      periodo: { de: de ?? null, ate: ate ?? null },
      resumo,
      total: rows.length,
      encaminhamentos: rows,
    });
  } catch (err) {
    console.error('[RELATORIOS/encaminhamentos]', err);
    res.status(500).json({ message: 'Erro ao gerar relatório.', error: err.message });
  }
});

module.exports = router;
