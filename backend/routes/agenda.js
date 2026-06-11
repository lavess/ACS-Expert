const router = require('express').Router();
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/agendaController');

router.use(auth);

// GET   /api/agenda/hoje            → agenda do dia (auto-gera se vazia)
// POST  /api/agenda/gerar           → recalcula agenda do ACS autenticado
// PUT   /api/agenda/:id/status      → realizada / adiada / cancelada / pendente

router.get( '/hoje',         ctrl.listarHoje);
router.post('/gerar',        ctrl.gerar);
router.put( '/:id/status',   ctrl.atualizarStatus);

module.exports = router;
