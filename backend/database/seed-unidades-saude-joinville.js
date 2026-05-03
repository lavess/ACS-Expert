require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const mysql = require('mysql2/promise');

// ──────────────────────────────────────────────────────────────
// Município: Joinville / SC  (código IBGE 4209102)
// Unidades de saúde de referência usadas como destino de encaminhamentos.
// Lista enxuta com mistura realista de UBS, CAPS, hospitais e laboratório
// para alimentar o seletor da feature de encaminhamentos.
// ──────────────────────────────────────────────────────────────

const MUNICIPIO = {
  nome:        'Joinville',
  uf:          'SC',
  codigo_ibge: '4209102',
};

const UNIDADES = [
  { nome: 'UBSF Adhemar Garcia',       tipo: 'ubs',         endereco: 'R. Otto Pfuetzenreuter, 1010 — Adhemar Garcia' },
  { nome: 'UBSF Aventureiro III',      tipo: 'ubs',         endereco: 'R. Carlos Reichow, 220 — Aventureiro' },
  { nome: 'UBSF Boa Vista',            tipo: 'ubs',         endereco: 'R. Eugênio Moreira, 1700 — Boa Vista' },
  { nome: 'UBSF Comasa',               tipo: 'ubs',         endereco: 'R. Itororó, 90 — Comasa' },
  { nome: 'UBSF Costa e Silva',        tipo: 'ubs',         endereco: 'R. Albano Schmidt, 3000 — Costa e Silva' },
  { nome: 'UBSF Floresta',             tipo: 'ubs',         endereco: 'R. Dona Francisca, 9050 — Floresta' },
  { nome: 'UBSF Iririú',               tipo: 'ubs',         endereco: 'R. Plácido Olímpio de Oliveira, 555 — Iririú' },
  { nome: 'UBSF Jardim Paraíso',       tipo: 'ubs',         endereco: 'R. Tenente Antônio João, 401 — Jardim Paraíso' },
  { nome: 'UBSF Morro do Meio',        tipo: 'ubs',         endereco: 'R. Eng. Niemeyer, 1820 — Morro do Meio' },
  { nome: 'UBSF Paranaguamirim',       tipo: 'ubs',         endereco: 'R. Anaburgo, 990 — Paranaguamirim' },
  { nome: 'UBSF Petrópolis',           tipo: 'ubs',         endereco: 'R. dos Imigrantes, 612 — Petrópolis' },
  { nome: 'UBSF Pirabeiraba Central',  tipo: 'ubs',         endereco: 'R. XV de Novembro, 4150 — Pirabeiraba' },
  { nome: 'UBSF Vila Nova',            tipo: 'ubs',         endereco: 'R. Inácio Bastos, 1080 — Vila Nova' },
  { nome: 'CAPS II Norte',             tipo: 'caps',        endereco: 'R. Ministro Calógeras, 220 — Centro' },
  { nome: 'CAPS AD III',               tipo: 'caps',        endereco: 'R. Visconde de Taunay, 1500 — Anita Garibaldi' },
  { nome: 'Hospital São José',         tipo: 'hospital',    endereco: 'R. Plácido Gomes, 370 — Anita Garibaldi' },
  { nome: 'Hospital Municipal São José',tipo: 'hospital',   endereco: 'R. Petrônio Albano, 245 — Saguaçu' },
  { nome: 'Hospital Regional Hans Dieter Schmidt', tipo: 'hospital', endereco: 'R. Xavier Arp, s/n — Boa Vista' },
  { nome: 'Laboratório Municipal Central', tipo: 'laboratorio', endereco: 'R. Visconde de Taunay, 1700 — América' },
];

async function seed() {
  const connection = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log(`Conectado ao MySQL em ${process.env.DB_HOST}:${process.env.DB_PORT}\n`);

  try {
    // ── 1. Garante o município ──────────────────────────────
    let municipioId;
    const [existe] = await connection.query(
      'SELECT id FROM municipios WHERE codigo_ibge = ? OR (nome = ? AND uf = ?) LIMIT 1',
      [MUNICIPIO.codigo_ibge, MUNICIPIO.nome, MUNICIPIO.uf]
    );

    if (existe.length > 0) {
      municipioId = existe[0].id;
      console.log(`→ Município "${MUNICIPIO.nome}/${MUNICIPIO.uf}" já existe (id=${municipioId}).`);
    } else {
      const [result] = await connection.query(
        'INSERT INTO municipios (nome, uf, codigo_ibge) VALUES (?, ?, ?)',
        [MUNICIPIO.nome, MUNICIPIO.uf, MUNICIPIO.codigo_ibge]
      );
      municipioId = result.insertId;
      console.log(`→ Município "${MUNICIPIO.nome}/${MUNICIPIO.uf}" criado (id=${municipioId}).`);
    }

    // ── 2. Carrega unidades já existentes p/ não duplicar ───
    const [jaExistentes] = await connection.query(
      'SELECT nome FROM unidades_saude WHERE municipio_id = ?',
      [municipioId]
    );
    const nomesExistentes = new Set(jaExistentes.map((r) => r.nome));

    // ── 3. Insere unidades novas ────────────────────────────
    const novas = UNIDADES.filter((u) => !nomesExistentes.has(u.nome));

    if (novas.length === 0) {
      console.log('\n✓ Todas as unidades de Joinville já estão cadastradas. Nada a fazer.');
      return;
    }

    const valores = novas.map((u) => [u.nome, u.tipo, u.endereco, municipioId]);
    await connection.query(
      'INSERT INTO unidades_saude (nome, tipo, endereco, municipio_id) VALUES ?',
      [valores]
    );

    console.log(`\n✓ ${novas.length} unidade(s) de saúde inserida(s) em Joinville/SC.`);
    console.log('─────────────────────────────────────────────');
    novas.forEach((u) => console.log(`  • [${u.tipo.padEnd(11)}] ${u.nome}`));
    console.log('─────────────────────────────────────────────');
    console.log(`Total no município: ${nomesExistentes.size + novas.length}`);
  } finally {
    await connection.end();
  }
}

seed().catch((err) => {
  console.error('Falha no seed:', err.message);
  process.exit(1);
});
