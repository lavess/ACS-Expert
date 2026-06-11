const db = require('../../config/db');
const {
  calcularScorePaciente, agruparGeograficamente,
} = require('./prioritization');

// ============================================================
//  Geração da agenda do dia para um ACS
// ============================================================
//
//  1. Coleta UMA query agregada com todos os fatores.
//  2. Pontua cada paciente.
//  3. Filtra top N por score (default 12).
//  4. Aplica agrupamento geográfico (microárea > logradouro).
//  5. Substitui a agenda do dia (DELETE + INSERT) em transação.

const SQL_DADOS_PACIENTES = `
  SELECT
    p.id, p.nome, p.score_risco_atual, p.nivel_risco,
    p.idoso_mora_sozinho, p.vulnerabilidade_social,
    p.dificuldade_locomocao, p.beneficio_social,
    p.data_ultima_visita, p.data_ultima_triagem,
    d.id   AS domicilio_id,
    d.logradouro, d.numero, d.bairro,
    d.microarea_id,
    ma.nome AS microarea_nome,
    COALESCE(c.total_cronicos, 0)            AS total_cronicos,
    COALESCE(al.alertas_urgentes, 0)         AS alertas_urgentes,
    COALESCE(al.alertas_atencao,  0)         AS alertas_atencao,
    COALESCE(t.triagens_altas_recentes, 0)   AS triagens_altas_recentes
    FROM pacientes p
    LEFT JOIN domicilios d  ON d.id = p.domicilio_id
    LEFT JOIN microareas ma ON ma.id = d.microarea_id
    LEFT JOIN (
      SELECT paciente_id, COUNT(*) AS total_cronicos
        FROM paciente_comorbidades
       WHERE comorbidade IN
         ('hipertenso','diabetico','cardiopata','dpoc','asmatico','imunossuprimido')
       GROUP BY paciente_id
    ) c ON c.paciente_id = p.id
    LEFT JOIN (
      SELECT paciente_id,
             SUM(CASE WHEN urgencia = 'urgente' THEN 1 ELSE 0 END) AS alertas_urgentes,
             SUM(CASE WHEN urgencia = 'atencao' THEN 1 ELSE 0 END) AS alertas_atencao
        FROM alertas
       WHERE resolvido = 0 AND paciente_id IS NOT NULL
       GROUP BY paciente_id
    ) al ON al.paciente_id = p.id
    LEFT JOIN (
      SELECT paciente_id, COUNT(*) AS triagens_altas_recentes
        FROM triagens
       WHERE nivel_risco = 'alto'
         AND data_hora >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY paciente_id
    ) t ON t.paciente_id = p.id
   WHERE p.acs_responsavel_id = ? AND p.ativo = 1
`;

// ── carregarPacientesDoACS ──────────────────────────────────
async function carregarPacientesDoACS(acsId, conn = db) {
  const [rows] = await conn.query(SQL_DADOS_PACIENTES, [acsId]);
  return rows;
}

// ── gerarAgendaParaACS ──────────────────────────────────────
// dataAgenda: 'YYYY-MM-DD'. limite: máximo de visitas no dia.
async function gerarAgendaParaACS(acsId, dataAgenda, opts = {}) {
  if (!acsId) throw new Error('gerarAgendaParaACS: acsId é obrigatório.');
  const limite = Math.max(1, Math.min(opts.limite ?? 12, 50));

  const conn = await db.getConnection();
  try {
    const [pacientes] = await conn.query(SQL_DADOS_PACIENTES, [acsId]);

    // 1) Pontuação
    const scored = pacientes
      .map((p) => ({
        ...p,
        ...calcularScorePaciente(p),
        // mantemos campos geográficos no objeto pro agrupamento
        microarea_id: p.microarea_id,
        logradouro:   p.logradouro,
      }));

    // 2) Top N por score
    scored.sort((a, b) => b.score - a.score);
    const topN = scored.slice(0, limite);

    // 3) Agrupamento geográfico (microárea > rua)
    const ordenado = agruparGeograficamente(topN);

    // 4) Persistência transacional
    await conn.beginTransaction();

    // Limpa entradas pendentes do dia (mantém realizadas/canceladas)
    await conn.query(
      `DELETE FROM agenda_visitas
        WHERE acs_id = ? AND data_agenda = ? AND status = 'pendente'`,
      [acsId, dataAgenda]
    );

    if (ordenado.length > 0) {
      const linhas = ordenado.map((p, i) => [
        acsId,
        p.paciente_id,
        dataAgenda,
        i + 1,
        p.score,
        JSON.stringify({
          motivos:   p.motivos,
          breakdown: p.breakdown,
          flags:     p.flags,
        }),
        'pendente',
      ]);
      // INSERT IGNORE evita conflito com agendas pré-existentes (UNIQUE)
      await conn.query(
        `INSERT IGNORE INTO agenda_visitas
           (acs_id, paciente_id, data_agenda, ordem_prioridade,
            score_prioridade, motivo_prioridade, status)
         VALUES ?`,
        [linhas]
      );
    }

    await conn.commit();

    return {
      acs_id:    acsId,
      data:      dataAgenda,
      total:     ordenado.length,
      itens:     ordenado.map((p, i) => ({
        ordem:   i + 1,
        paciente_id: p.paciente_id,
        score:   p.score,
        motivos: p.motivos,
        flags:   p.flags,
      })),
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ── listarAgendaDoACS ────────────────────────────────────────
// Retorna agenda + dados de UI (paciente, domicílio, breakdown).
async function listarAgendaDoACS(acsId, dataAgenda) {
  const [rows] = await db.query(
    `
    SELECT
      a.id, a.acs_id, a.paciente_id, a.data_agenda,
      a.ordem_prioridade, a.score_prioridade, a.motivo_prioridade,
      a.status, a.visita_id, a.created_at,
      p.nome AS paciente_nome, p.nivel_risco AS paciente_nivel_risco,
      p.score_risco_atual,
      p.idoso_mora_sozinho, p.vulnerabilidade_social, p.dificuldade_locomocao,
      d.logradouro, d.numero, d.bairro, d.cep,
      d.microarea_id, ma.nome AS microarea_nome,
      d.latitude, d.longitude
    FROM agenda_visitas a
    LEFT JOIN pacientes  p  ON p.id  = a.paciente_id
    LEFT JOIN domicilios d  ON d.id  = p.domicilio_id
    LEFT JOIN microareas ma ON ma.id = d.microarea_id
    WHERE a.acs_id = ? AND a.data_agenda = ?
    ORDER BY a.ordem_prioridade ASC, a.id ASC
    `,
    [acsId, dataAgenda]
  );

  // Parse motivo_prioridade (JSON) — mysql2 pode devolver string ou objeto
  return rows.map((r) => {
    let motivo = r.motivo_prioridade;
    if (typeof motivo === 'string') {
      try { motivo = JSON.parse(motivo); } catch { motivo = null; }
    }
    return { ...r, motivo_prioridade: motivo };
  });
}

// ── atualizarStatusAgenda ───────────────────────────────────
const STATUS_VALIDOS = new Set(['pendente', 'realizada', 'adiada', 'cancelada']);
async function atualizarStatusAgenda(id, status, opts = {}) {
  if (!STATUS_VALIDOS.has(status)) {
    throw new Error(`status inválido: ${status}`);
  }
  await db.query(
    `UPDATE agenda_visitas
        SET status = ?,
            visita_id = COALESCE(?, visita_id)
      WHERE id = ?`,
    [status, opts.visitaId ?? null, id]
  );
}

// ── listarAcsAtivos ──────────────────────────────────────────
// Auxiliar para o cron: gera agenda apenas para ACS ativos com perfil 'acs'.
async function listarAcsAtivos() {
  const [rows] = await db.query(
    `SELECT id FROM usuarios WHERE ativo = 1 AND perfil = 'acs'`
  );
  return rows.map((r) => r.id);
}

module.exports = {
  carregarPacientesDoACS,
  gerarAgendaParaACS,
  listarAgendaDoACS,
  atualizarStatusAgenda,
  listarAcsAtivos,
};
