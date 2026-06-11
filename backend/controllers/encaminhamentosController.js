const db = require('../config/db');
const alertasService = require('../services/alertas');

// ── Constantes ─────────────────────────────────────────────────

const TIPOS_VALIDOS = new Set([
  'consulta_medica',
  'enfermagem',
  'vacinacao',
  'exame',
  'urgencia',
  'especialista',
]);

const STATUS_VALIDOS   = new Set(['pendente', 'realizado', 'ausencia', 'cancelado']);
const STATUS_DESFECHOS = new Set(['realizado', 'ausencia', 'cancelado']);

// ── Helpers ────────────────────────────────────────────────────

function selectBase() {
  return `
    SELECT
      e.id, e.triagem_id, e.paciente_id, e.acs_id,
      e.tipo, e.motivo, e.unidade_saude_id,
      e.data_encaminhamento, e.data_prevista,
      e.status, e.data_desfecho, e.observacao_desfecho,
      e.notificar_ausencia, e.alerta_gerado,
      e.created_at, e.updated_at,
      p.nome AS paciente_nome,
      p.nivel_risco AS paciente_nivel_risco,
      u.nome AS acs_nome,
      us.nome AS unidade_saude_nome,
      us.tipo AS unidade_saude_tipo,
      us.endereco AS unidade_saude_endereco,
      CASE
        WHEN e.status = 'pendente'
         AND e.data_prevista IS NOT NULL
         AND e.data_prevista < CURDATE()
        THEN 1 ELSE 0
      END AS vencido,
      CASE
        WHEN e.status = 'pendente' AND e.data_prevista IS NOT NULL
        THEN DATEDIFF(CURDATE(), e.data_prevista)
        ELSE NULL
      END AS dias_atraso
    FROM encaminhamentos e
    LEFT JOIN pacientes      p  ON e.paciente_id      = p.id
    LEFT JOIN usuarios       u  ON e.acs_id           = u.id
    LEFT JOIN unidades_saude us ON e.unidade_saude_id = us.id
  `;
}

// ── POST /api/encaminhamentos ─────────────────────────────────
async function criar(req, res) {
  try {
    const {
      paciente_id,
      triagem_id,
      tipo,
      motivo,
      unidade_saude_id,
      data_encaminhamento,
      data_prevista,
      notificar_ausencia,
      offline_uuid,
    } = req.body ?? {};

    if (!paciente_id) {
      return res.status(400).json({ message: 'paciente_id é obrigatório.' });
    }
    if (!motivo || !motivo.trim()) {
      return res.status(400).json({ message: 'motivo é obrigatório.' });
    }
    if (!tipo || !TIPOS_VALIDOS.has(tipo)) {
      return res.status(400).json({
        message: `tipo inválido. Use: ${[...TIPOS_VALIDOS].join(', ')}.`,
      });
    }

    // Confere se o paciente existe (e está ativo)
    const [pacientes] = await db.query(
      'SELECT id FROM pacientes WHERE id = ? AND ativo = 1',
      [paciente_id]
    );
    if (pacientes.length === 0) {
      return res.status(404).json({ message: 'Paciente não encontrado.' });
    }

    const dataEnc = data_encaminhamento ? new Date(data_encaminhamento) : new Date();

    const [result] = await db.query(
      `INSERT INTO encaminhamentos
         (triagem_id, paciente_id, acs_id, tipo, motivo,
          unidade_saude_id, data_encaminhamento, data_prevista,
          status, notificar_ausencia,
          offline_uuid, synced_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?)`,
      [
        triagem_id || null,
        paciente_id,
        req.usuario.id,
        tipo,
        motivo,
        unidade_saude_id || null,
        dataEnc,
        data_prevista || null,
        notificar_ausencia === false ? 0 : 1,
        offline_uuid || null,
        offline_uuid ? new Date() : null,
      ]
    );

    const [rows] = await db.query(`${selectBase()} WHERE e.id = ?`, [result.insertId]);
    const enc = rows[0];

    // Gera alertas para gestores/coordenadores (erro não bloqueia resposta)
    try {
      await alertasService.alertaPorNovoEncaminhamento({
        id:           result.insertId,
        paciente_id:  enc.paciente_id,
        acs_id:       enc.acs_id,
        tipo:         enc.tipo,
        motivo:       enc.motivo,
        data_prevista: enc.data_prevista,
      });
    } catch (err) {
      console.warn('[ENCAMINHAMENTOS/criar] gerar alertas falhou:', err.message);
    }

    res.status(201).json(enc);
  } catch (err) {
    console.error('[ENCAMINHAMENTOS/criar] Erro:', err);
    res.status(500).json({ message: 'Erro ao criar encaminhamento.', error: err.message });
  }
}

// ── GET /api/encaminhamentos ──────────────────────────────────
// Filtros: status, paciente_id, acs_id, desde, ate, limit, vencido
// Antes de listar, oportunisticamente roda a regra automática que cria
// alertas para encaminhamentos com SLA vencido do ACS logado.
async function listar(req, res) {
  try {
    // Regra automática (idempotente). Falha não bloqueia a listagem.
    try {
      await alertasService.gerarAlertasEncaminhamentosVencidos(req.usuario.id);
    } catch (err) {
      console.warn('[ENCAMINHAMENTOS/listar] gerar alertas vencidos falhou:', err.message);
    }

    const { status, paciente_id, acs_id, desde, ate, vencido } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

    let sql = selectBase() + ' WHERE 1=1';
    const params = [];

    if (status) {
      // aceita lista CSV (ex.: ?status=pendente,realizado) p/ a UI de tabs
      const lista = String(status).split(',').map((s) => s.trim()).filter(Boolean);
      const invalidos = lista.filter((s) => !STATUS_VALIDOS.has(s));
      if (invalidos.length) {
        return res.status(400).json({
          message: `status inválido(s): ${invalidos.join(', ')}.`,
        });
      }
      sql += ` AND e.status IN (${lista.map(() => '?').join(',')})`;
      params.push(...lista);
    }
    if (paciente_id) { sql += ' AND e.paciente_id = ?';                 params.push(paciente_id); }
    if (acs_id)      { sql += ' AND e.acs_id = ?';                      params.push(acs_id); }
    if (desde)       { sql += ' AND e.data_encaminhamento >= ?';        params.push(desde); }
    if (ate)         { sql += ' AND e.data_encaminhamento <= ?';        params.push(ate); }
    if (vencido === '1' || vencido === 'true') {
      sql += " AND e.status = 'pendente' AND e.data_prevista IS NOT NULL AND e.data_prevista < CURDATE()";
    }

    sql += ' ORDER BY e.data_encaminhamento DESC, e.id DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[ENCAMINHAMENTOS/listar] Erro:', err);
    res.status(500).json({ message: 'Erro ao listar encaminhamentos.', error: err.message });
  }
}

// ── GET /api/encaminhamentos/:id ──────────────────────────────
async function buscarPorId(req, res) {
  try {
    const [rows] = await db.query(`${selectBase()} WHERE e.id = ?`, [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Encaminhamento não encontrado.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('[ENCAMINHAMENTOS/buscarPorId] Erro:', err);
    res.status(500).json({ message: 'Erro ao buscar encaminhamento.', error: err.message });
  }
}

// ── PUT /api/encaminhamentos/:id/desfecho ─────────────────────
// Body: { status: 'realizado'|'ausencia'|'cancelado', observacao_desfecho?, data_desfecho? }
// Quando status='ausencia' (e notificar_ausencia=1), gera um alerta automático.
async function registrarDesfecho(req, res) {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { status, observacao_desfecho, data_desfecho } = req.body ?? {};

    if (!status || !STATUS_DESFECHOS.has(status)) {
      return res.status(400).json({
        message: `status de desfecho inválido. Use: ${[...STATUS_DESFECHOS].join(', ')}.`,
      });
    }

    const [rows] = await conn.query(
      `SELECT id, paciente_id, acs_id, tipo, status, notificar_ausencia, alerta_gerado
         FROM encaminhamentos WHERE id = ?`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Encaminhamento não encontrado.' });
    }
    const enc = rows[0];

    if (enc.status !== 'pendente') {
      return res.status(409).json({
        message: `Encaminhamento já finalizado (status atual: ${enc.status}).`,
      });
    }

    const dataDesf = data_desfecho ? new Date(data_desfecho) : new Date();

    await conn.beginTransaction();

    await conn.query(
      `UPDATE encaminhamentos
          SET status = ?, data_desfecho = ?, observacao_desfecho = ?
        WHERE id = ?`,
      [status, dataDesf, observacao_desfecho ?? null, id]
    );

    let alertaGerado = null;
    if (status === 'ausencia' && enc.notificar_ausencia === 1 && enc.alerta_gerado === 0) {
      const r = await alertasService.alertaPorAusenciaEncaminhamento(
        { ...enc, data_desfecho: dataDesf },
        conn
      );
      if (r && !r.jaExistia) {
        await conn.query(
          'UPDATE encaminhamentos SET alerta_gerado = 1 WHERE id = ?',
          [id]
        );
      }
      alertaGerado = r;
    }

    await conn.commit();

    const [final] = await conn.query(`${selectBase()} WHERE e.id = ?`, [id]);
    res.json({ ...final[0], alerta: alertaGerado });
  } catch (err) {
    await conn.rollback();
    console.error('[ENCAMINHAMENTOS/desfecho] Erro:', err);
    res.status(500).json({ message: 'Erro ao registrar desfecho.', error: err.message });
  } finally {
    conn.release();
  }
}

module.exports = {
  criar,
  listar,
  buscarPorId,
  registrarDesfecho,
};
