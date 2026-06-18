const cron = require('node-cron');
const agendaService = require('./agenda');

// Cron string: 0 6 * * *  → todos os dias às 06:00 (hora do servidor)
const AGENDA_CRON = process.env.AGENDA_CRON || '0 6 * * *';
const AGENDA_TZ   = process.env.AGENDA_TZ   || 'America/Sao_Paulo';
// Permite desligar o scheduler em testes / dev
const SCHEDULER_DISABLED =
  String(process.env.AGENDA_SCHEDULER_DISABLED || '').toLowerCase() === 'true';

function hojeISO() {
  const d   = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ── Job: gera agenda do dia para todos os ACS ativos ────────
async function rodarJobGerarAgendas() {
  const data = hojeISO();
  console.log(`[AGENDA/cron] gerando agendas do dia ${data}…`);

  let acsIds = [];
  try {
    acsIds = await agendaService.listarAcsAtivos();
  } catch (err) {
    console.error('[AGENDA/cron] Falha ao listar ACS:', err.message);
    return;
  }

  let ok = 0, falhas = 0;
  for (const acsId of acsIds) {
    try {
      await agendaService.gerarAgendaParaACS(acsId, data);
      ok++;
    } catch (err) {
      falhas++;
      console.error(`[AGENDA/cron] ACS ${acsId} falhou:`, err.message);
    }
  }
  console.log(`[AGENDA/cron] concluído. sucesso=${ok} falhas=${falhas}`);
}

let task = null;

function start() {
  if (SCHEDULER_DISABLED) {
    console.log('[AGENDA/cron] scheduler desligado (AGENDA_SCHEDULER_DISABLED=true).');
    return null;
  }
  if (task) return task;

  if (!cron.validate(AGENDA_CRON)) {
    console.warn(`[AGENDA/cron] expressão inválida "${AGENDA_CRON}", usando default 0 6 * * *.`);
  }
  task = cron.schedule(AGENDA_CRON, () => {
    rodarJobGerarAgendas().catch((err) =>
      console.error('[AGENDA/cron] erro não tratado:', err)
    );
  }, { timezone: AGENDA_TZ });

  console.log(`[AGENDA/cron] agendado em "${AGENDA_CRON}" (${AGENDA_TZ}).`);
  return task;
}

function stop() {
  if (task) { task.stop(); task = null; }
}

module.exports = { start, stop, rodarJobGerarAgendas };
