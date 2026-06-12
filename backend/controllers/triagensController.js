const db = require('../config/db');
const { evaluate } = require('../services/inference/engine');

const SYMPTOMS           = require('../services/inference/symptoms.json');
const DISEASES           = require('../services/inference/diseases.json');
const SYMPTOM_QUALIFIERS = require('../services/inference/symptom_qualifiers.json');

// ── Constantes de mapeamento ────────────────────────────────
const SEXOS_VALIDOS       = ['m', 'f'];
const FAIXAS_ETARIAS      = ['0-18','19-23','24-28','29-33','34-38','39-43','44-48','49-53','54-58','59+'];
const NIVEIS_PRIORIDADE   = ['muito_baixa','baixa','media','alta'];
const ACOES_RECOMENDADAS  = ['acompanhamento','encaminhar_ubs','urgencia'];

// Doenças que disparam urgência quando em risco moderado/alto
const DOENCAS_CRITICAS = new Set([
  'infarto', 'sepsis', 'meningite', 'apendicite', 'acidente_vascular',
]);

// ── Helpers ─────────────────────────────────────────────────

function ageToFaixaEtaria(dataNascimento) {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  if (Number.isNaN(nasc.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;

  if (idade <= 18) return '0-18';
  if (idade <= 23) return '19-23';
  if (idade <= 28) return '24-28';
  if (idade <= 33) return '29-33';
  if (idade <= 38) return '34-38';
  if (idade <= 43) return '39-43';
  if (idade <= 48) return '44-48';
  if (idade <= 53) return '49-53';
  if (idade <= 58) return '54-58';
  return '59+';
}

// Label do engine (com acento) → ENUM do BD (sem acento)
function labelParaBD(label) {
  if (label === 'Média') return 'Media';
  return label; // 'Alta' ou 'Baixa'
}

// Label do engine → nivel_risco do paciente/triagem
function labelParaNivelRisco(label) {
  if (label === 'Alta')  return 'alto';
  if (label === 'Média') return 'moderado';
  return 'baixo';
}

// Porta fiel da função setPriorityCard do app.js
function calcularPrioridade({ topScore, maxIntensity, topDoencaId }) {
  if (topScore >= 75 && maxIntensity >= 7) return 'alta';
  if (topDoencaId === 'infarto' && topScore >= 50) return 'alta';
  if (topScore >= 60 || maxIntensity >= 8) return 'media';
  if (topScore < 30) return 'muito_baixa';
  return 'baixa';
}

function calcularAcaoRecomendada({ prioridade, topDoencaId }) {
  if (DOENCAS_CRITICAS.has(topDoencaId) && prioridade !== 'muito_baixa') {
    return 'urgencia';
  }
  if (prioridade === 'alta' || prioridade === 'media') {
    return 'encaminhar_ubs';
  }
  return 'acompanhamento';
}

function maxIntensidade(sintomas) {
  const ints = Object.values(sintomas || {}).map((s) => s?.intensity ?? 0);
  return ints.length ? Math.max(...ints) : 0;
}

// Monta um resumo (payload persistido + campos derivados) a partir do resultado do engine
function derivarCamposTriagem(payload, resultado) {
  const computedTopN = resultado.computed.slice(0, 10);
  const top = computedTopN[0] ?? null;

  const scoreFinal = top?.score ?? 0;
  const nivelRisco = top ? labelParaNivelRisco(top.label) : 'baixo';
  const maxInt     = maxIntensidade(payload.sintomas);

  const prioridade = calcularPrioridade({
    topScore: scoreFinal,
    maxIntensity: maxInt,
    topDoencaId: top?.id,
  });

  const acao = calcularAcaoRecomendada({
    prioridade,
    topDoencaId: top?.id,
  });

  return {
    top,
    computedTopN,
    scoreFinal,
    nivelRisco,
    prioridade,
    acao,
  };
}

function validarPayload(payload) {
  const erros = [];
  if (!payload || typeof payload !== 'object') {
    return ['Payload ausente ou inválido.'];
  }
  const { faixa_etaria, sexo, sintomas } = payload;

  if (!sexo || !SEXOS_VALIDOS.includes(sexo)) {
    erros.push(`Sexo inválido. Use: ${SEXOS_VALIDOS.join(', ')}.`);
  }
  if (!faixa_etaria || !FAIXAS_ETARIAS.includes(faixa_etaria)) {
    erros.push(`Faixa etária inválida. Use: ${FAIXAS_ETARIAS.join(', ')}.`);
  }
  if (!sintomas || typeof sintomas !== 'object') {
    erros.push('sintomas é obrigatório.');
  } else {
    for (const [id, dado] of Object.entries(sintomas)) {
      if (!dado || typeof dado.intensity !== 'number') {
        erros.push(`Sintoma "${id}" deve ter { intensity: number }.`);
      } else if (dado.intensity < 0 || dado.intensity > 10) {
        erros.push(`Intensidade de "${id}" fora do intervalo 0-10.`);
      }
    }
  }
  return erros;
}

// ============================================================
//                          ENDPOINTS
// ============================================================

// ── GET /api/triagens/catalogo ──────────────────────────────
// Retorna listas de sintomas, qualificadores e doenças para a UI
function catalogo(req, res) {
  res.json({
    sintomas:       SYMPTOMS,
    qualificadores: SYMPTOM_QUALIFIERS,
    doencas:        DISEASES.map(({ id, nome, descricao, genderPref }) => ({
      id, nome, descricao, genderPref,
    })),
    faixas_etarias: FAIXAS_ETARIAS,
  });
}

// ── POST /api/triagens/avaliar ──────────────────────────────
// Roda o motor SEM persistir (preview)
function avaliar(req, res) {
  try {
    const payload = req.body ?? {};
    const erros = validarPayload(payload);
    if (erros.length) {
      return res.status(400).json({ message: 'Payload inválido.', erros });
    }

    const resultado = evaluate(payload);
    const derivados = derivarCamposTriagem(payload, resultado);

    res.json({
      top_doenca:        derivados.top,
      score_final:       derivados.scoreFinal,
      nivel_risco:       derivados.nivelRisco,
      nivel_prioridade:  derivados.prioridade,
      acao_recomendada:  derivados.acao,
      computed:          resultado.computed,
      logs:              resultado.logs,
    });
  } catch (err) {
    console.error('[TRIAGENS/avaliar] Erro:', err);
    res.status(500).json({ message: 'Erro ao avaliar triagem.', error: err.message });
  }
}

// ── POST /api/triagens ──────────────────────────────────────
// Roda o motor E persiste (triagem + sintomas + resultados + atualiza paciente)
async function criar(req, res) {
  const conn = await db.getConnection();
  try {
    const { paciente_id, visita_id, payload, offline_uuid } = req.body ?? {};

    if (!paciente_id) {
      return res.status(400).json({ message: 'paciente_id é obrigatório.' });
    }
    if (!visita_id) {
      return res.status(400).json({ message: 'visita_id é obrigatório. Crie uma visita antes de iniciar a triagem.' });
    }

    // Carrega paciente — usado para preencher/validar sexo e faixa_etaria
    const [pacientes] = await conn.query(
      'SELECT id, sexo, data_nascimento FROM pacientes WHERE id = ? AND ativo = 1',
      [paciente_id]
    );
    if (pacientes.length === 0) {
      return res.status(404).json({ message: 'Paciente não encontrado.' });
    }
    const paciente = pacientes[0];

    // Permite sobrescrever; se não vier, deriva do paciente
    const sexo         = payload?.sexo         ?? paciente.sexo;
    const faixaEtaria  = payload?.faixa_etaria ?? ageToFaixaEtaria(paciente.data_nascimento);

    const payloadFinal = {
      faixa_etaria: faixaEtaria,
      sexo,
      sintomas:     payload?.sintomas     ?? {},
      riskFactors:  payload?.riskFactors  ?? [],
      qualifiers:   payload?.qualifiers   ?? {},
    };

    const erros = validarPayload(payloadFinal);
    if (erros.length) {
      return res.status(400).json({ message: 'Payload inválido.', erros });
    }

    // Roda o motor (server-authoritative — nunca confia em scores do cliente)
    const resultado = evaluate(payloadFinal);
    const derivados = derivarCamposTriagem(payloadFinal, resultado);

    // ── Persistência em transação ─────────────────────────
    await conn.beginTransaction();

    const acsId = req.usuario.id;
    const dataHora = new Date();

    const [trResult] = await conn.query(
      `INSERT INTO triagens
         (visita_id, paciente_id, acs_id, data_hora, faixa_etaria, sexo,
          score_final, nivel_risco, nivel_prioridade, acao_recomendada,
          top_doenca_id, top_doenca_nome, top_doenca_score,
          payload_sintomas, payload_resultado,
          offline_uuid, synced_at)
       VALUES (?, ?, ?, ?, ?, ?,
               ?, ?, ?, ?,
               ?, ?, ?,
               ?, ?,
               ?, ?)`,
      [
        visita_id || null,
        paciente_id,
        acsId,
        dataHora,
        payloadFinal.faixa_etaria,
        payloadFinal.sexo,
        derivados.scoreFinal,
        derivados.nivelRisco,
        derivados.prioridade,
        derivados.acao,
        derivados.top?.id   ?? null,
        derivados.top?.nome ?? null,
        derivados.top?.score ?? null,
        JSON.stringify(payloadFinal),
        JSON.stringify({ computed: derivados.computedTopN, logs: resultado.logs }),
        offline_uuid || null,
        offline_uuid ? dataHora : null,
      ]
    );
    const triagemId = trResult.insertId;

    // triagem_sintomas — um insert batched
    const sintomasEntries = Object.entries(payloadFinal.sintomas);
    if (sintomasEntries.length > 0) {
      const linhas = sintomasEntries.map(([sintomaId, dado]) => [
        triagemId,
        sintomaId,
        dado.intensity,
        JSON.stringify(payloadFinal.qualifiers[sintomaId] ?? {}),
      ]);
      await conn.query(
        'INSERT INTO triagem_sintomas (triagem_id, sintoma_id, intensidade, qualificadores) VALUES ?',
        [linhas]
      );
    }

    // triagem_resultados — TOP-N
    if (derivados.computedTopN.length > 0) {
      const linhas = derivados.computedTopN.map((c, i) => [
        triagemId,
        c.id,
        c.nome,
        c.score,
        labelParaBD(c.label),
        i + 1,
      ]);
      await conn.query(
        'INSERT INTO triagem_resultados (triagem_id, doenca_id, doenca_nome, score, label, rank_posicao) VALUES ?',
        [linhas]
      );
    }

    // Atualiza o paciente com o nível de risco atual
    await conn.query(
      `UPDATE pacientes
         SET nivel_risco       = ?,
             score_risco_atual = ?,
             data_ultima_triagem = ?
       WHERE id = ?`,
      [derivados.nivelRisco, derivados.scoreFinal, dataHora, paciente_id]
    );

    await conn.commit();

    res.status(201).json({
      id:                triagemId,
      paciente_id,
      acs_id:            acsId,
      data_hora:         dataHora,
      faixa_etaria:      payloadFinal.faixa_etaria,
      sexo:              payloadFinal.sexo,
      score_final:       derivados.scoreFinal,
      nivel_risco:       derivados.nivelRisco,
      nivel_prioridade:  derivados.prioridade,
      acao_recomendada:  derivados.acao,
      top_doenca:        derivados.top,
      computed:          derivados.computedTopN,
    });
  } catch (err) {
    await conn.rollback();
    console.error('[TRIAGENS/criar] Erro:', err);
    res.status(500).json({ message: 'Erro ao criar triagem.', error: err.message });
  } finally {
    conn.release();
  }
}

// ── GET /api/triagens ───────────────────────────────────────
// Filtros: paciente_id, acs_id, nivel_risco, desde (ISO), ate (ISO), limit
async function listar(req, res) {
  try {
    const { paciente_id, acs_id, nivel_risco, desde, ate } = req.query;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

    let sql = `
      SELECT
        t.id, t.visita_id, t.paciente_id, t.acs_id, t.data_hora,
        t.faixa_etaria, t.sexo, t.score_final,
        t.nivel_risco, t.nivel_prioridade, t.acao_recomendada,
        t.top_doenca_id, t.top_doenca_nome, t.top_doenca_score,
        t.created_at,
        p.nome AS paciente_nome,
        u.nome AS acs_nome
      FROM triagens t
      LEFT JOIN pacientes p ON t.paciente_id = p.id
      LEFT JOIN usuarios  u ON t.acs_id      = u.id
      WHERE 1=1
    `;
    const params = [];

    if (paciente_id) { sql += ' AND t.paciente_id = ?';      params.push(paciente_id); }
    if (acs_id)      { sql += ' AND t.acs_id = ?';           params.push(acs_id); }
    if (nivel_risco) { sql += ' AND t.nivel_risco = ?';      params.push(nivel_risco); }
    if (desde)       { sql += ' AND t.data_hora >= ?';       params.push(desde); }
    if (ate)         { sql += ' AND t.data_hora <= ?';       params.push(ate); }

    sql += ' ORDER BY t.data_hora DESC LIMIT ?';
    params.push(limit);

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[TRIAGENS/listar] Erro:', err);
    res.status(500).json({ message: 'Erro ao listar triagens.', error: err.message });
  }
}

// ── GET /api/triagens/:id ───────────────────────────────────
// Retorna a triagem completa + sintomas + resultados
async function buscarPorId(req, res) {
  try {
    const [triagens] = await db.query(
      `SELECT t.*,
              p.nome AS paciente_nome,
              u.nome AS acs_nome
         FROM triagens t
         LEFT JOIN pacientes p ON t.paciente_id = p.id
         LEFT JOIN usuarios  u ON t.acs_id      = u.id
        WHERE t.id = ?`,
      [req.params.id]
    );

    if (triagens.length === 0) {
      return res.status(404).json({ message: 'Triagem não encontrada.' });
    }

    const triagem = triagens[0];

    const [sintomas] = await db.query(
      'SELECT sintoma_id, intensidade, qualificadores FROM triagem_sintomas WHERE triagem_id = ?',
      [triagem.id]
    );

    const [resultados] = await db.query(
      `SELECT doenca_id, doenca_nome, score, label, rank_posicao
         FROM triagem_resultados
        WHERE triagem_id = ?
        ORDER BY rank_posicao ASC`,
      [triagem.id]
    );

    triagem.sintomas   = sintomas;
    triagem.resultados = resultados;

    res.json(triagem);
  } catch (err) {
    console.error('[TRIAGENS/buscarPorId] Erro:', err);
    res.status(500).json({ message: 'Erro ao buscar triagem.', error: err.message });
  }
}

module.exports = {
  catalogo,
  avaliar,
  criar,
  listar,
  buscarPorId,
  // expostos para testes
  _ageToFaixaEtaria:  ageToFaixaEtaria,
  _calcularPrioridade: calcularPrioridade,
  _calcularAcao:      calcularAcaoRecomendada,
};
