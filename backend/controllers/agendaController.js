const agendaService = require('../services/agenda');

function hojeISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ── GET /api/agenda/hoje ────────────────────────────────────
// Retorna a agenda do dia atual (ou da data passada em ?data=).
// Se a agenda ainda não foi gerada, gera automaticamente.
async function listarHoje(req, res) {
  try {
    const acsId = req.usuario.id;
    const data  = (req.query.data && /^\d{4}-\d{2}-\d{2}$/.test(req.query.data))
      ? req.query.data
      : hojeISO();

    let itens = await agendaService.listarAgendaDoACS(acsId, data);

    // Auto-geração na primeira visita do dia
    if (itens.length === 0 && data === hojeISO()) {
      try {
        await agendaService.gerarAgendaParaACS(acsId, data);
        itens = await agendaService.listarAgendaDoACS(acsId, data);
      } catch (err) {
        console.warn('[AGENDA/listarHoje] auto-gerar falhou:', err.message);
      }
    }

    // Métricas para o header da UI
    const total      = itens.length;
    const realizadas = itens.filter((i) => i.status === 'realizada').length;
    const urgentes   = itens.filter((i) => i.paciente_nivel_risco === 'alto').length;

    res.json({
      data,
      total,
      realizadas,
      urgentes,
      itens,
    });
  } catch (err) {
    console.error('[AGENDA/listarHoje] Erro:', err);
    res.status(500).json({ message: 'Erro ao listar agenda.', error: err.message });
  }
}

// ── POST /api/agenda/gerar ──────────────────────────────────
// Recalcula a agenda do dia para o ACS autenticado.
// Body opcional: { data: 'YYYY-MM-DD', limite: 12 }
async function gerar(req, res) {
  try {
    const acsId = req.usuario.id;
    const data  = (req.body?.data && /^\d{4}-\d{2}-\d{2}$/.test(req.body.data))
      ? req.body.data
      : hojeISO();
    const limite = Number(req.body?.limite) > 0 ? Number(req.body.limite) : 12;

    const resumo = await agendaService.gerarAgendaParaACS(acsId, data, { limite });
    const itens  = await agendaService.listarAgendaDoACS(acsId, data);

    res.json({ ...resumo, itens });
  } catch (err) {
    console.error('[AGENDA/gerar] Erro:', err);
    res.status(500).json({ message: 'Erro ao gerar agenda.', error: err.message });
  }
}

// ── PUT /api/agenda/:id/status ──────────────────────────────
// Body: { status: 'realizada'|'adiada'|'cancelada', visita_id?: number }
async function atualizarStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, visita_id } = req.body ?? {};

    if (!['realizada', 'adiada', 'cancelada', 'pendente'].includes(status)) {
      return res.status(400).json({
        message: 'status inválido. Use: realizada | adiada | cancelada | pendente.',
      });
    }

    await agendaService.atualizarStatusAgenda(id, status, { visitaId: visita_id });
    res.json({ id: Number(id), status, visita_id: visita_id ?? null });
  } catch (err) {
    console.error('[AGENDA/atualizarStatus] Erro:', err);
    res.status(500).json({ message: 'Erro ao atualizar status.', error: err.message });
  }
}

module.exports = {
  listarHoje,
  gerar,
  atualizarStatus,
};
