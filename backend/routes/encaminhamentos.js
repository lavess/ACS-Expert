const router = require('express').Router();
const { auth } = require('../middlewares/auth');
const ctrl = require('../controllers/encaminhamentosController');

router.use(auth);

// GET    /api/encaminhamentos              → lista (status, paciente_id, acs_id, desde, ate, limit)
// POST   /api/encaminhamentos              → cria encaminhamento (status default = pendente)
// GET    /api/encaminhamentos/:id          → detalhe
// PUT    /api/encaminhamentos/:id/desfecho → registra realizado / ausencia / cancelado
//                                            (gera alerta automático em ausencia)

router.get(  '/',              ctrl.listar);
router.post( '/',              ctrl.criar);
router.get(  '/:id',           ctrl.buscarPorId);
router.put(  '/:id/desfecho',  ctrl.registrarDesfecho);

module.exports = router;
