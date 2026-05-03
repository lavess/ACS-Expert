const db = require('../../config/db');

// ============================================================
// Service de alertas — gera alertas automáticos para o ACS
// ============================================================
//
// Convenções:
//   - Todas as funções aceitam um `connection` opcional (transação).
//     Se vier, não abrem nova; senão usam o pool diretamente.
//   - Idempotência: evitamos duplicar alertas "ainda não resolvidos"
//     do mesmo tipo, paciente e ACS — assim a regra pode ser disparada
//     várias vezes sem inflar a caixa de alertas.
//
// Tipos válidos no banco (enum):
//   'alto_risco_sem_visita' | 'encaminhamento_pendente' |
//   'encaminhamento_ausencia' | 'cronico_sem_acompanhamento' |
//   'gestante_sem_prenatal' | 'vacina_atrasada' | 'familia_multiplo_risco'

const TIPOS_VALIDOS = new Set([
  'alto_risco_sem_visita',
  'encaminhamento_pendente',
  'encaminhamento_ausencia',
  'cronico_sem_acompanhamento',
  'gestante_sem_prenatal',
  'vacina_atrasada',
  'familia_multiplo_risco',
]);

const URGENCIAS_VALIDAS = new Set(['informativo', 'atencao', 'urgente']);

function executor(connection) {
  return connection ?? db;
}

// ── criarAlerta ─────────────────────────────────────────────
// Cria um alerta evitando duplicar uma entrada ainda não resolvida
// do mesmo (tipo, paciente, acs).
async function criarAlerta(
  { paciente_id = null, acs_id, tipo, urgencia = 'atencao', titulo, mensagem = null },
  connection = null
) {
  if (!acs_id)  throw new Error('criarAlerta: acs_id é obrigatório.');
  if (!titulo)  throw new Error('criarAlerta: titulo é obrigatório.');
  if (!TIPOS_VALIDOS.has(tipo)) {
    throw new Error(`criarAlerta: tipo inválido "${tipo}".`);
  }
  if (!URGENCIAS_VALIDAS.has(urgencia)) {
    throw new Error(`criarAlerta: urgencia inválida "${urgencia}".`);
  }

  const exec = executor(connection);

  // Deduplica: se já existe um alerta não resolvido idêntico, devolve-o.
  const [dup] = await exec.query(
    `SELECT id FROM alertas
       WHERE tipo = ? AND acs_id = ?
         AND (paciente_id <=> ?)
         AND resolvido = 0
       LIMIT 1`,
    [tipo, acs_id, paciente_id]
  );
  if (dup.length > 0) {
    return { id: dup[0].id, jaExistia: true };
  }

  const [result] = await exec.query(
    `INSERT INTO alertas (paciente_id, acs_id, tipo, urgencia, titulo, mensagem)
       VALUES (?, ?, ?, ?, ?, ?)`,
    [paciente_id, acs_id, tipo, urgencia, titulo, mensagem]
  );
  return { id: result.insertId, jaExistia: false };
}

// ── alertaPorAusenciaEncaminhamento ─────────────────────────
// Disparado quando um encaminhamento é finalizado com status='ausencia'.
// Recebe o encaminhamento já carregado do banco.
async function alertaPorAusenciaEncaminhamento(encaminhamento, connection = null) {
  const exec = executor(connection);

  // Busca nome do paciente para compor a mensagem
  const [rows] = await exec.query(
    'SELECT nome FROM pacientes WHERE id = ?',
    [encaminhamento.paciente_id]
  );
  const nomePaciente = rows[0]?.nome ?? `Paciente #${encaminhamento.paciente_id}`;

  const titulo   = `Ausência em encaminhamento — ${nomePaciente}`;
  const mensagem =
    `Paciente não compareceu ao encaminhamento (${encaminhamento.tipo}) ` +
    `em ${new Date(encaminhamento.data_desfecho ?? Date.now()).toLocaleDateString('pt-BR')}. ` +
    `Agende uma busca ativa.`;

  return criarAlerta(
    {
      paciente_id: encaminhamento.paciente_id,
      acs_id:      encaminhamento.acs_id,
      tipo:        'encaminhamento_ausencia',
      urgencia:    'urgente',
      titulo,
      mensagem,
    },
    connection
  );
}

// ── resolverAlerta ──────────────────────────────────────────
async function resolverAlerta(id, connection = null) {
  const exec = executor(connection);
  await exec.query(
    'UPDATE alertas SET resolvido = 1, data_resolucao = NOW() WHERE id = ?',
    [id]
  );
}

// ── gerarAlertasEncaminhamentosVencidos ─────────────────────
// Regra automática: para todo encaminhamento do ACS com
//   - status = 'pendente'
//   - data_prevista IS NOT NULL
//   - data_prevista < CURDATE()
// gera UM alerta tipo 'encaminhamento_pendente' (urgência 'atencao')
// por paciente, deduplicado via NOT EXISTS contra alertas não-resolvidos.
//
// Chamada de forma oportunista nos GET /encaminhamentos e GET /pacientes
// (operação idempotente — chamar 1 ou 100 vezes resulta no mesmo estado).
async function gerarAlertasEncaminhamentosVencidos(acsId, connection = null) {
  if (!acsId) return { inseridos: 0 };
  const exec = executor(connection);

  const [r] = await exec.query(
    `INSERT INTO alertas (paciente_id, acs_id, tipo, urgencia, titulo, mensagem)
     SELECT DISTINCT
       e.paciente_id,
       e.acs_id,
       'encaminhamento_pendente',
       'atencao',
       CONCAT('Encaminhamento vencido — ', p.nome),
       CONCAT(
         'Encaminhamento sem desfecho com data prevista para ',
         DATE_FORMAT(e.data_prevista, '%d/%m/%Y'),
         ' (', DATEDIFF(CURDATE(), e.data_prevista), ' dia(s) de atraso).'
       )
       FROM encaminhamentos e
       JOIN pacientes p ON p.id = e.paciente_id
      WHERE e.acs_id = ?
        AND e.status = 'pendente'
        AND e.data_prevista IS NOT NULL
        AND e.data_prevista < CURDATE()
        AND NOT EXISTS (
          SELECT 1 FROM alertas a
           WHERE a.tipo = 'encaminhamento_pendente'
             AND a.acs_id      = e.acs_id
             AND a.paciente_id <=> e.paciente_id
             AND a.resolvido   = 0
        )`,
    [acsId]
  );
  return { inseridos: r.affectedRows };
}

module.exports = {
  criarAlerta,
  alertaPorAusenciaEncaminhamento,
  gerarAlertasEncaminhamentosVencidos,
  resolverAlerta,
  TIPOS_VALIDOS,
  URGENCIAS_VALIDAS,
};
