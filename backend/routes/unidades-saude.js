const router  = require('express').Router();
const { auth } = require('../middlewares/auth');
const db       = require('../config/db');

// GET /api/unidades-saude?municipio_id=1&tipo=ubs
router.get('/', auth, async (req, res) => {
  try {
    const { municipio_id, tipo } = req.query;
    let sql = `
      SELECT id, nome, tipo, endereco, municipio_id, latitude, longitude
        FROM unidades_saude
       WHERE 1=1
    `;
    const params = [];
    if (municipio_id) { sql += ' AND municipio_id = ?'; params.push(municipio_id); }
    if (tipo)         { sql += ' AND tipo = ?';         params.push(tipo); }
    sql += ' ORDER BY tipo ASC, nome ASC';
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erro ao listar unidades de saúde.', error: err.message });
  }
});

module.exports = router;
