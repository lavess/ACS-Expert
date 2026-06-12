require('dotenv').config();
const mysql = require('mysql2/promise');

// CEPs reais de Joinville consultados via ViaCEP
const updates = [
  { dom_id: 4,  cep: '89218065' }, // Rua Almirante Jaceguay
  { dom_id: 5,  cep: '89204020' }, // Rua Tijucas
  { dom_id: 6,  cep: '89218055' }, // Rua Blumenau
  { dom_id: 7,  cep: '89201090' }, // Rua Itajaí
  { dom_id: 8,  cep: '89216222' }, // Rua Camboriú
  { dom_id: 9,  cep: '89227220' }, // Rua Pomerode
  { dom_id: 10, cep: '89223660' }, // Rua Brusque
  { dom_id: 11, cep: '89221400' }, // Rua Indaial
  { dom_id: 12, cep: '89211740' }, // Rua Gaspar
];

async function run() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  for (const { dom_id, cep } of updates) {
    await c.query('UPDATE domicilios SET cep = ? WHERE id = ?', [cep, dom_id]);
    console.log(`✓ domicilio ${dom_id} → CEP ${cep.replace(/(\d{5})(\d{3})/, '$1-$2')}`);
  }

  await c.end();
  console.log('\nConcluído.');
}

run().catch(e => { console.error(e.message); process.exit(1); });
