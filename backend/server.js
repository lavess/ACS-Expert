require('dotenv').config();

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const cors    = require('cors');
const db      = require('./config/db');

const app = express();
app.use(express.json());
app.use(cors());

// ── Rotas ──────────────────────────────────────────────────────
app.use('/api/usuarios',         require('./routes/usuarios'));
app.use('/api/microareas',       require('./routes/microareas'));
app.use('/api/unidades-saude',   require('./routes/unidades-saude'));
app.use('/api/pacientes',        require('./routes/pacientes'));
app.use('/api/triagens',         require('./routes/triagens'));
app.use('/api/encaminhamentos',  require('./routes/encaminhamentos'));
app.use('/api/relatorios',       require('./routes/relatorios'));

// ── Auth ───────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { matricula, senha } = req.body;

    if (!matricula || !senha) {
      return res.status(400).json({ message: 'Informe matrícula e senha.' });
    }

    const [rows] = await db.query(
      'SELECT id, nome, matricula, email, perfil, microarea_id, municipio_id, senha_hash, ativo FROM usuarios WHERE matricula = ?',
      [matricula]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Matrícula ou senha incorretos.' });
    }

    const usuario = rows[0];

    if (!usuario.ativo) {
      return res.status(403).json({ message: 'Usuário inativo. Contate o administrador.' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    if (!senhaValida) {
      return res.status(401).json({ message: 'Matrícula ou senha incorretos.' });
    }

    await db.query('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?', [usuario.id]);

    const payload = { id: usuario.id, perfil: usuario.perfil, municipio_id: usuario.municipio_id };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    const { senha_hash, ...usuarioPublico } = usuario;
    res.json({ token, usuario: usuarioPublico });
  } catch (err) {
    console.error('[AUTH/LOGIN] Erro:', err);
    res.status(500).json({ message: 'Erro interno.', error: err.message });
  }
});

// ── Start ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
