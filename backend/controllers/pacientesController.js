const db = require('../config/db');
const alertasService = require('../services/alertas');

const COMORBIDADES_VALIDAS = [
  'fumante', 'hipertenso', 'diabetico', 'obeso',
  'asmatico', 'gestante', 'cardiopata', 'dpoc', 'imunossuprimido',
];

// ── Helpers ─────────────────────────────────────────────────────
function limparDigitos(str) {
  return (str || '').toString().replace(/\D/g, '');
}

async function upsertDomicilio(conn, endereco) {
  if (!endereco) return null;
  const {
    nome_referencia, logradouro, numero, complemento,
    bairro, cep, microarea_id, latitude, longitude,
  } = endereco;

  if (!logradouro) return null;

  const [result] = await conn.query(
    `INSERT INTO domicilios
       (nome_referencia, logradouro, numero, complemento, bairro, cep,
        microarea_id, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      nome_referencia || null,
      logradouro,
      numero || null,
      complemento || null,
      bairro || null,
      limparDigitos(cep) || null,
      microarea_id || null,
      latitude || null,
      longitude || null,
    ]
  );
  return result.insertId;
}

async function substituirComorbidades(conn, pacienteId, comorbidades) {
  await conn.query('DELETE FROM paciente_comorbidades WHERE paciente_id = ?', [pacienteId]);
  if (!comorbidades || comorbidades.length === 0) return;

  const validas = comorbidades.filter((c) => COMORBIDADES_VALIDAS.includes(c));
  if (validas.length === 0) return;

  const valores = validas.map((c) => [pacienteId, c, new Date()]);
  await conn.query(
    'INSERT INTO paciente_comorbidades (paciente_id, comorbidade, data_registro) VALUES ?',
    [valores]
  );
}

// ── GET /api/pacientes ─────────────────────────────────────────
// Query params: busca, nivel_risco, microarea_id, acs_responsavel_id, ativo
async function listar(req, res) {
  try {
    // Roda a regra automática de alertas SLA vencido do ACS logado
    // antes de listar, p/ que `alertas_pendentes` reflita o estado atual.
    if (req.usuario?.id) {
      try {
        await alertasService.gerarAlertasEncaminhamentosVencidos(req.usuario.id);
      } catch (err) {
        console.warn('[PACIENTES/listar] gerar alertas vencidos falhou:', err.message);
      }
    }

    const { busca, nivel_risco, microarea_id, acs_responsavel_id, ativo, comorbidade } = req.query;

    let sql = `
      SELECT
        p.id, p.nome, p.cpf, p.cns, p.data_nascimento, p.sexo,
        p.nivel_risco, p.score_risco_atual,
        p.data_ultima_triagem, p.data_ultima_visita, p.ativo,
        p.acs_responsavel_id, p.idoso_mora_sozinho, p.vulnerabilidade_social,
        p.dificuldade_locomocao, p.beneficio_social,
        d.id   AS domicilio_id,
        d.logradouro, d.numero, d.complemento, d.bairro, d.cep,
        d.microarea_id,
        ma.nome AS microarea_nome,
        COALESCE(ev.total, 0) AS total_encaminhamentos_vencidos,
        COALESCE(al.total, 0) AS alertas_pendentes,
        IF(EXISTS(SELECT 1 FROM paciente_comorbidades pc WHERE pc.paciente_id = p.id AND pc.comorbidade = 'gestante'), 1, 0) AS is_gestante,
        IF(EXISTS(SELECT 1 FROM paciente_comorbidades pc WHERE pc.paciente_id = p.id AND pc.comorbidade != 'gestante'), 1, 0) AS tem_comorbidade
      FROM pacientes p
      LEFT JOIN domicilios d  ON p.domicilio_id = d.id
      LEFT JOIN microareas ma ON d.microarea_id = ma.id
      LEFT JOIN (
        SELECT paciente_id, COUNT(*) AS total
          FROM encaminhamentos
         WHERE status = 'pendente'
           AND data_prevista IS NOT NULL
           AND data_prevista < CURDATE()
         GROUP BY paciente_id
      ) ev ON ev.paciente_id = p.id
      LEFT JOIN (
        SELECT paciente_id, COUNT(*) AS total
          FROM alertas
         WHERE resolvido = 0 AND paciente_id IS NOT NULL
         GROUP BY paciente_id
      ) al ON al.paciente_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (ativo !== undefined) {
      sql += ' AND p.ativo = ?';
      params.push(ativo === 'true' || ativo === '1' ? 1 : 0);
    } else {
      sql += ' AND p.ativo = 1';
    }

    if (nivel_risco) {
      sql += ' AND p.nivel_risco = ?';
      params.push(nivel_risco);
    }
    if (microarea_id) {
      sql += ' AND d.microarea_id = ?';
      params.push(microarea_id);
    }
    if (acs_responsavel_id) {
      sql += ' AND p.acs_responsavel_id = ?';
      params.push(acs_responsavel_id);
    }
    if (busca) {
      sql += ' AND (p.nome LIKE ? OR p.cpf LIKE ? OR p.cns LIKE ?)';
      const like = `%${busca}%`;
      params.push(like, like, like);
    }
    if (comorbidade) {
      sql += ' AND EXISTS (SELECT 1 FROM paciente_comorbidades pc WHERE pc.paciente_id = p.id AND pc.comorbidade = ?)';
      params.push(comorbidade);
    }

    sql += ' ORDER BY p.nome ASC LIMIT 500';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('[PACIENTES/listar] Erro:', err);
    res.status(500).json({ message: 'Erro ao listar pacientes.', error: err.message });
  }
}

// ── GET /api/pacientes/:id ─────────────────────────────────────
async function buscarPorId(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT
         p.*,
         d.id   AS dom_id,
         d.nome_referencia, d.logradouro, d.numero, d.complemento,
         d.bairro, d.cep, d.microarea_id,
         d.latitude AS dom_latitude, d.longitude AS dom_longitude,
         ma.nome AS microarea_nome,
         u.nome AS acs_nome
       FROM pacientes p
       LEFT JOIN domicilios d  ON p.domicilio_id = d.id
       LEFT JOIN microareas ma ON d.microarea_id = ma.id
       LEFT JOIN usuarios u    ON p.acs_responsavel_id = u.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Paciente não encontrado.' });
    }

    const paciente = rows[0];

    const [comorb] = await db.query(
      'SELECT comorbidade, data_registro FROM paciente_comorbidades WHERE paciente_id = ?',
      [paciente.id]
    );

    paciente.comorbidades = comorb.map((c) => c.comorbidade);
    res.json(paciente);
  } catch (err) {
    console.error('[PACIENTES/buscarPorId] Erro:', err);
    res.status(500).json({ message: 'Erro ao buscar paciente.', error: err.message });
  }
}

// ── POST /api/pacientes ────────────────────────────────────────
async function criar(req, res) {
  const conn = await db.getConnection();
  try {
    const {
      nome, cpf, cns, identificador_municipal,
      data_nascimento, sexo,
      responsavel_domicilio = false,
      acs_responsavel_id,
      idoso_mora_sozinho = false,
      vulnerabilidade_social = false,
      dificuldade_locomocao = false,
      beneficio_social = false,
      endereco,          // { logradouro, numero, complemento, bairro, cep, microarea_id, nome_referencia }
      comorbidades = [], // ['hipertenso', 'diabetico']
    } = req.body;

    // Validações
    if (!nome || !data_nascimento || !sexo) {
      return res.status(400).json({
        message: 'Campos obrigatórios: nome, data_nascimento, sexo.',
      });
    }
    if (!['m', 'f'].includes(sexo)) {
      return res.status(400).json({ message: 'Sexo inválido. Use "m" ou "f".' });
    }

    const cpfLimpo = limparDigitos(cpf);
    const cnsLimpo = limparDigitos(cns);

    if (cpfLimpo && cpfLimpo.length !== 11) {
      return res.status(400).json({ message: 'CPF deve ter 11 dígitos.' });
    }

    // Verifica duplicata
    if (cpfLimpo) {
      const [dup] = await conn.query('SELECT id FROM pacientes WHERE cpf = ?', [cpfLimpo]);
      if (dup.length > 0) return res.status(409).json({ message: 'CPF já cadastrado.' });
    }
    if (cnsLimpo) {
      const [dup] = await conn.query('SELECT id FROM pacientes WHERE cns = ?', [cnsLimpo]);
      if (dup.length > 0) return res.status(409).json({ message: 'CNS já cadastrado.' });
    }

    await conn.beginTransaction();

    const domicilioId = await upsertDomicilio(conn, endereco);

    const acsId = acs_responsavel_id ?? req.usuario?.id ?? null;

    const [result] = await conn.query(
      `INSERT INTO pacientes
         (nome, cpf, cns, identificador_municipal, data_nascimento, sexo,
          domicilio_id, responsavel_domicilio, acs_responsavel_id,
          idoso_mora_sozinho, vulnerabilidade_social,
          dificuldade_locomocao, beneficio_social)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nome,
        cpfLimpo || null,
        cnsLimpo || null,
        identificador_municipal || null,
        data_nascimento,
        sexo,
        domicilioId,
        responsavel_domicilio ? 1 : 0,
        acsId,
        idoso_mora_sozinho ? 1 : 0,
        vulnerabilidade_social ? 1 : 0,
        dificuldade_locomocao ? 1 : 0,
        beneficio_social ? 1 : 0,
      ]
    );

    const pacienteId = result.insertId;

    if (comorbidades && comorbidades.length > 0) {
      await substituirComorbidades(conn, pacienteId, comorbidades);
    }

    await conn.commit();

    const [rows] = await conn.query(
      `SELECT p.*, d.logradouro, d.numero, d.bairro, d.cep, d.microarea_id
         FROM pacientes p
         LEFT JOIN domicilios d ON p.domicilio_id = d.id
        WHERE p.id = ?`,
      [pacienteId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('[PACIENTES/criar] Erro:', err);
    res.status(500).json({ message: 'Erro ao criar paciente.', error: err.message });
  } finally {
    conn.release();
  }
}

// ── PUT /api/pacientes/:id ─────────────────────────────────────
async function atualizar(req, res) {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const {
      nome, cpf, cns, identificador_municipal,
      data_nascimento, sexo,
      responsavel_domicilio, acs_responsavel_id,
      idoso_mora_sozinho, vulnerabilidade_social,
      dificuldade_locomocao, beneficio_social,
      endereco, comorbidades, ativo,
    } = req.body;

    const [existe] = await conn.query(
      'SELECT id, domicilio_id FROM pacientes WHERE id = ?', [id]
    );
    if (existe.length === 0) {
      return res.status(404).json({ message: 'Paciente não encontrado.' });
    }

    if (sexo && !['m', 'f'].includes(sexo)) {
      return res.status(400).json({ message: 'Sexo inválido.' });
    }

    await conn.beginTransaction();

    // Atualiza ou cria domicílio
    let domicilioId = existe[0].domicilio_id;
    if (endereco) {
      if (domicilioId) {
        await conn.query(
          `UPDATE domicilios SET
             nome_referencia = ?, logradouro = ?, numero = ?, complemento = ?,
             bairro = ?, cep = ?, microarea_id = ?, latitude = ?, longitude = ?
           WHERE id = ?`,
          [
            endereco.nome_referencia || null,
            endereco.logradouro,
            endereco.numero || null,
            endereco.complemento || null,
            endereco.bairro || null,
            limparDigitos(endereco.cep) || null,
            endereco.microarea_id || null,
            endereco.latitude || null,
            endereco.longitude || null,
            domicilioId,
          ]
        );
      } else {
        domicilioId = await upsertDomicilio(conn, endereco);
      }
    }

    const campos = [];
    const valores = [];
    const set = (col, val) => { campos.push(`${col} = ?`); valores.push(val); };

    if (nome                     !== undefined) set('nome', nome);
    if (cpf                      !== undefined) set('cpf', limparDigitos(cpf) || null);
    if (cns                      !== undefined) set('cns', limparDigitos(cns) || null);
    if (identificador_municipal  !== undefined) set('identificador_municipal', identificador_municipal || null);
    if (data_nascimento          !== undefined) set('data_nascimento', data_nascimento);
    if (sexo                     !== undefined) set('sexo', sexo);
    if (responsavel_domicilio    !== undefined) set('responsavel_domicilio', responsavel_domicilio ? 1 : 0);
    if (acs_responsavel_id       !== undefined) set('acs_responsavel_id', acs_responsavel_id || null);
    if (idoso_mora_sozinho       !== undefined) set('idoso_mora_sozinho', idoso_mora_sozinho ? 1 : 0);
    if (vulnerabilidade_social   !== undefined) set('vulnerabilidade_social', vulnerabilidade_social ? 1 : 0);
    if (dificuldade_locomocao    !== undefined) set('dificuldade_locomocao', dificuldade_locomocao ? 1 : 0);
    if (beneficio_social         !== undefined) set('beneficio_social', beneficio_social ? 1 : 0);
    if (ativo                    !== undefined) set('ativo', ativo ? 1 : 0);
    if (domicilioId && domicilioId !== existe[0].domicilio_id) set('domicilio_id', domicilioId);

    if (campos.length > 0) {
      valores.push(id);
      await conn.query(`UPDATE pacientes SET ${campos.join(', ')} WHERE id = ?`, valores);
    }

    if (comorbidades !== undefined) {
      await substituirComorbidades(conn, id, comorbidades);
    }

    await conn.commit();

    const [rows] = await conn.query('SELECT * FROM pacientes WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error('[PACIENTES/atualizar] Erro:', err);
    res.status(500).json({ message: 'Erro ao atualizar paciente.', error: err.message });
  } finally {
    conn.release();
  }
}

// ── DELETE /api/pacientes/:id (soft delete) ────────────────────
async function desativar(req, res) {
  try {
    const [existe] = await db.query('SELECT id FROM pacientes WHERE id = ?', [req.params.id]);
    if (existe.length === 0) {
      return res.status(404).json({ message: 'Paciente não encontrado.' });
    }
    await db.query('UPDATE pacientes SET ativo = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Paciente desativado com sucesso.' });
  } catch (err) {
    console.error('[PACIENTES/desativar] Erro:', err);
    res.status(500).json({ message: 'Erro ao desativar paciente.', error: err.message });
  }
}

// ── PUT /api/pacientes/:id/comorbidades ────────────────────────
async function atualizarComorbidades(req, res) {
  const conn = await db.getConnection();
  try {
    const { id } = req.params;
    const { comorbidades = [] } = req.body;

    const [existe] = await conn.query('SELECT id FROM pacientes WHERE id = ?', [id]);
    if (existe.length === 0) {
      return res.status(404).json({ message: 'Paciente não encontrado.' });
    }

    await conn.beginTransaction();
    await substituirComorbidades(conn, id, comorbidades);
    await conn.commit();

    res.json({ message: 'Comorbidades atualizadas.', comorbidades });
  } catch (err) {
    await conn.rollback();
    console.error('[PACIENTES/comorbidades] Erro:', err);
    res.status(500).json({ message: 'Erro ao atualizar comorbidades.', error: err.message });
  } finally {
    conn.release();
  }
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  desativar,
  atualizarComorbidades,
};
