// ============================================================
//  Algoritmo de priorização da agenda do ACS
// ============================================================
//
//  Score = score_clinico
//        + peso_dias_sem_visita
//        + peso_cronico
//        + peso_evento_recente
//        + peso_vulnerabilidade
//
//  Após pontuar todos os pacientes do ACS, aplicamos um agrupamento
//  geográfico simples (microárea → logradouro) para que visitas
//  próximas sejam feitas em sequência, reduzindo deslocamento.
//
//  Tudo é calculado em JS depois de UMA query SQL agregada para
//  evitar N+1 no banco.

const COMORBIDADES_CRONICAS = [
  'hipertenso', 'diabetico', 'cardiopata', 'dpoc', 'asmatico', 'imunossuprimido',
];

// ── Pesos (max teórico ~120) ────────────────────────────────
const PESOS = {
  // score_clinico: 0–50 (deriva de pacientes.score_risco_atual 0–100)
  CLINICO_DIVISOR:        2,

  // peso_dias_sem_visita: 0.5 ponto por dia, cap 20
  DIAS_SEM_VISITA_FATOR:  0.5,
  DIAS_SEM_VISITA_CAP:    20,
  DIAS_SEM_VISITA_DEFAULT_NUNCA: 45,  // se nunca visitado, considera 45 dias

  // peso_cronico: 10 base se tem qualquer crônico; +5 se tem >=2 crônicos
  CRONICO_BASE:           10,
  CRONICO_MULTIPLO_BONUS: 5,
  CRONICO_SEM_ACOMP_DIAS: 60,
  CRONICO_SEM_ACOMP_BONUS: 8,

  // peso_evento_recente (cap 25)
  ALERTA_URGENTE:         15,
  ALERTA_ATENCAO:         8,
  TRIAGEM_ALTA_RECENTE:   10,
  EVENTO_RECENTE_CAP:     25,

  // peso_vulnerabilidade (cap 15)
  VULN_SOCIAL:            8,
  IDOSO_SOZINHO:          6,
  DIFICULDADE_LOCOMOCAO:  4,
  VULNERABILIDADE_CAP:    15,
};

// ── Helpers ─────────────────────────────────────────────────

function diasDesde(iso) {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function clamp(v, max) {
  return Math.min(v, max);
}

// ── calcularScorePaciente ───────────────────────────────────
// Recebe a linha agregada do paciente e devolve { score, breakdown, motivos }
function calcularScorePaciente(p) {
  // 1) Clínico
  const scoreClinico = (Number(p.score_risco_atual) || 0) / PESOS.CLINICO_DIVISOR;

  // 2) Dias sem visita
  const dias = diasDesde(p.data_ultima_visita) ?? PESOS.DIAS_SEM_VISITA_DEFAULT_NUNCA;
  const pesoDiasSemVisita = clamp(dias * PESOS.DIAS_SEM_VISITA_FATOR, PESOS.DIAS_SEM_VISITA_CAP);

  // 3) Crônico
  const totalCronicos = Number(p.total_cronicos) || 0;
  let pesoCronico = 0;
  if (totalCronicos > 0) pesoCronico += PESOS.CRONICO_BASE;
  if (totalCronicos >= 2) pesoCronico += PESOS.CRONICO_MULTIPLO_BONUS;
  if (totalCronicos > 0 && dias > PESOS.CRONICO_SEM_ACOMP_DIAS) {
    pesoCronico += PESOS.CRONICO_SEM_ACOMP_BONUS;
  }

  // 4) Evento recente
  const alertasUrgentes = Number(p.alertas_urgentes) || 0;
  const alertasAtencao  = Number(p.alertas_atencao)  || 0;
  const triagensAltas   = Number(p.triagens_altas_recentes) || 0;
  let pesoEvento = 0;
  if (alertasUrgentes > 0) pesoEvento += PESOS.ALERTA_URGENTE;
  if (alertasAtencao  > 0) pesoEvento += PESOS.ALERTA_ATENCAO;
  if (triagensAltas   > 0) pesoEvento += PESOS.TRIAGEM_ALTA_RECENTE;
  pesoEvento = clamp(pesoEvento, PESOS.EVENTO_RECENTE_CAP);

  // 5) Vulnerabilidade
  let pesoVuln = 0;
  if (p.vulnerabilidade_social) pesoVuln += PESOS.VULN_SOCIAL;
  if (p.idoso_mora_sozinho)     pesoVuln += PESOS.IDOSO_SOZINHO;
  if (p.dificuldade_locomocao)  pesoVuln += PESOS.DIFICULDADE_LOCOMOCAO;
  pesoVuln = clamp(pesoVuln, PESOS.VULNERABILIDADE_CAP);

  // Score final
  const score = Number(
    (scoreClinico + pesoDiasSemVisita + pesoCronico + pesoEvento + pesoVuln).toFixed(2)
  );

  // Motivos legíveis (até 3) — alimentam a UI da agenda
  const motivos = [];
  if (p.nivel_risco === 'alto') motivos.push('Paciente de alto risco');
  if (alertasUrgentes > 0)      motivos.push(`${alertasUrgentes} alerta(s) urgente(s)`);
  if (alertasAtencao  > 0)      motivos.push(`${alertasAtencao} alerta(s) de atenção`);
  if (totalCronicos >= 2)       motivos.push(`${totalCronicos} crônicos sem acompanhamento`);
  else if (totalCronicos > 0 && dias > PESOS.CRONICO_SEM_ACOMP_DIAS) {
    motivos.push('Crônico sem acompanhamento');
  }
  if (dias != null && dias > 14)   motivos.push(`Sem visita há ${dias} dia(s)`);
  if (p.vulnerabilidade_social) motivos.push('Vulnerabilidade social');
  if (p.idoso_mora_sozinho)     motivos.push('Idoso(a) mora sozinho(a)');

  return {
    paciente_id: p.id,
    score,
    breakdown: {
      score_clinico:        Number(scoreClinico.toFixed(2)),
      dias_sem_visita:      dias,
      peso_dias_sem_visita: Number(pesoDiasSemVisita.toFixed(2)),
      peso_cronico:         pesoCronico,
      peso_evento_recente:  pesoEvento,
      peso_vulnerabilidade: pesoVuln,
      total_cronicos:       totalCronicos,
      alertas_urgentes:     alertasUrgentes,
      alertas_atencao:      alertasAtencao,
      triagens_altas_recentes: triagensAltas,
    },
    motivos: motivos.slice(0, 3),
    flags: {
      familia_multiplo_risco: totalCronicos >= 2 && (
        p.vulnerabilidade_social || p.idoso_mora_sozinho || alertasUrgentes > 0
      ),
      cronico_sem_acompanhamento: totalCronicos > 0 && (dias ?? 0) > PESOS.CRONICO_SEM_ACOMP_DIAS,
    },
  };
}

// ── agruparGeograficamente ──────────────────────────────────
// Recebe lista já scored e aplica agrupamento por microárea > rua,
// preservando a prioridade dentro de cada cluster e ordenando clusters
// pelo seu maior score. Resultado: visitas próximas em sequência sem
// "saltar" microáreas no meio.
function agruparGeograficamente(items) {
  const clusters = new Map();   // key: microarea_id||0 → array
  for (const it of items) {
    const key = it.microarea_id ?? 0;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(it);
  }

  // Ordena clusters por max-score desc (microárea com paciente mais
  // urgente vem primeiro)
  const ordenados = [...clusters.values()].sort((a, b) => {
    const ma = Math.max(...a.map((x) => x.score));
    const mb = Math.max(...b.map((x) => x.score));
    return mb - ma;
  });

  // Dentro de cada cluster: agrupa por logradouro e ordena por score desc
  const final = [];
  for (const cluster of ordenados) {
    const porRua = new Map();
    for (const it of cluster) {
      const key = (it.logradouro || '').trim().toLowerCase();
      if (!porRua.has(key)) porRua.set(key, []);
      porRua.get(key).push(it);
    }
    // Ruas dentro do cluster: ordenadas por max-score desc
    const ruas = [...porRua.values()].sort((a, b) => {
      const ma = Math.max(...a.map((x) => x.score));
      const mb = Math.max(...b.map((x) => x.score));
      return mb - ma;
    });
    for (const rua of ruas) {
      rua.sort((a, b) => b.score - a.score);
      final.push(...rua);
    }
  }
  return final;
}

module.exports = {
  PESOS,
  COMORBIDADES_CRONICAS,
  calcularScorePaciente,
  agruparGeograficamente,
  diasDesde,
};
