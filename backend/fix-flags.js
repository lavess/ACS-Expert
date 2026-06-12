require('dotenv').config();
const mysql = require('mysql2/promise');

mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}).then(c =>
  c.query('ALTER TABLE visitas ADD COLUMN flags JSON')
   .then(() => { console.log('Coluna flags adicionada com sucesso.'); c.end(); })
).catch(e => { console.error('Erro:', e.message); process.exit(1); });
