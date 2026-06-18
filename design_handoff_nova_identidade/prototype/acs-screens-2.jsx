/* global React, ACS, FONTS, Pill, Icon, Phone, RiskColor */

// ──────────────────────────────────────────────────────────────
// SCREEN 3 — SYMPTOM TRIAGE (step 2/3)
// ──────────────────────────────────────────────────────────────
function ScreenTriage() {
  const selected = [
    { name: 'Dor no peito', intensity: 8, detail: 'Opressiva · irradia p/ braço' },
    { name: 'Falta de ar', intensity: 6 },
    { name: 'Tontura', intensity: 4 },
  ];

  return (
    <Phone title="Triagem" subtitle="Carlos E. Melo, 68 · Passo 2 de 3" showBack navActive={null} bg={ACS.paper}>
      {/* Progress */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {[1, 2, 3].map(i => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 99,
            background: i <= 2 ? ACS.azul : ACS.paper2,
          }} />
        ))}
      </div>
      <div style={{
        marginTop: 6, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '.12em',
        textTransform: 'uppercase', color: ACS.ink3,
      }}>
        Contexto · <span style={{ color: ACS.ink2 }}>Sintomas</span> · Resultado
      </div>

      {/* Search */}
      <div style={{
        marginTop: 14, background: ACS.white, borderRadius: 14,
        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
      }}>
        <Icon name="search" size={18} color={ACS.ink3} />
        <input placeholder="Buscar sintoma" readOnly
          style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, fontFamily: FONTS.ui, color: ACS.ink3, background: 'transparent' }} />
      </div>

      {/* Selected summary */}
      <div style={{
        marginTop: 14, background: ACS.azul050, borderRadius: 16,
        padding: 14, border: `1px solid ${ACS.azul100}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '.14em', color: ACS.azul, textTransform: 'uppercase', fontWeight: 600 }}>
            3 sintomas selecionados
          </div>
          <span style={{ fontSize: 11, color: ACS.azul, fontWeight: 500 }}>Limpar</span>
        </div>
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {selected.map(s => (
            <SymptomChip key={s.name} {...s} />
          ))}
        </div>
      </div>

      {/* Group accordion */}
      <div style={{
        marginTop: 18, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '.14em',
        color: ACS.ink3, textTransform: 'uppercase',
      }}>Grupos de sintomas</div>

      <div style={{ marginTop: 8, background: ACS.white, borderRadius: 16, overflow: 'hidden' }}>
        {[
          { label: 'Cardiovascular', count: '3 sel.', open: true },
          { label: 'Respiratório', count: '1 sel.' },
          { label: 'Neurológico e Cabeça', count: null },
          { label: 'Digestivo e Abdominal', count: null },
        ].map((g, i, arr) => (
          <div key={g.label} style={{
            padding: '14px 14px', borderBottom: i < arr.length - 1 ? `1px solid ${ACS.line}` : 'none',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: ACS.ink }}>{g.label}</div>
            {g.count && (
              <span style={{
                fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600,
                background: ACS.azul100, color: ACS.azul, padding: '3px 7px', borderRadius: 6,
                letterSpacing: '.05em',
              }}>{g.count}</span>
            )}
            <Icon name="chevron" size={14} color={ACS.ink4} />
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px 30px', background: ACS.paper,
        borderTop: `1px solid ${ACS.line}`,
        display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <div style={{ flex: 1, fontSize: 12, color: ACS.ink3 }}>
          <span style={{ color: ACS.ink, fontWeight: 600 }}>3</span> sintomas · auto-salvo
        </div>
        <button style={{
          background: ACS.azul, color: '#fff', border: 'none',
          padding: '13px 24px', borderRadius: 14, fontFamily: FONTS.ui,
          fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          Avaliar <Icon name="sparkle" size={15} color="#fff" weight={2} />
        </button>
      </div>
    </Phone>
  );
}

function SymptomChip({ name, intensity, detail }) {
  const gradient = `linear-gradient(90deg, ${ACS.verde} 0%, ${ACS.amar} 50%, ${ACS.coral} 100%)`;
  return (
    <div style={{ background: ACS.white, borderRadius: 12, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: ACS.ink }}>{name}</div>
        <span style={{
          fontFamily: FONTS.mono, fontSize: 11, fontWeight: 600,
          color: intensity >= 7 ? ACS.coral : intensity >= 4 ? '#A3740A' : ACS.verde,
        }}>{intensity}/10</span>
        <Icon name="x" size={14} color={ACS.ink4} />
      </div>
      <div style={{ marginTop: 8, position: 'relative', height: 6, borderRadius: 99, background: ACS.paper2 }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${intensity * 10}%`, borderRadius: 99, background: gradient,
        }} />
      </div>
      {detail && <div style={{ marginTop: 6, fontSize: 11, color: ACS.ink3 }}>{detail}</div>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SCREEN 4 — TRIAGE RESULT
// ──────────────────────────────────────────────────────────────
function ScreenResult() {
  const conditions = [
    { name: 'Angina instável',          pct: 82, level: 'urgente' },
    { name: 'Infarto Agudo do Miocárdio', pct: 71, level: 'urgente' },
    { name: 'Crise hipertensiva',       pct: 58, level: 'atencao' },
    { name: 'Ansiedade aguda',          pct: 34, level: 'info' },
  ];
  return (
    <Phone title="Resultado" subtitle="Carlos E. Melo · 12/04 · 09:42" showBack navActive={null} bg={ACS.paper}>
      {/* Priority card — HIGH */}
      <div style={{
        marginTop: 10, borderRadius: 22, padding: 20,
        background: ACS.vermelho, color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', right: -20, top: -20, width: 140, height: 140,
          borderRadius: 99, background: 'rgba(255,255,255,.09)',
        }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,0,0,.18)', padding: '4px 9px', borderRadius: 6,
          fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600, letterSpacing: '.14em',
        }}>
          <Icon name="alert" size={12} color="#fff" weight={2.4} /> URGENTE
        </div>
        <div style={{
          marginTop: 12, fontFamily: FONTS.display, fontWeight: 600,
          fontSize: 30, letterSpacing: '-0.025em', lineHeight: 1.05,
        }}>
          Alta prioridade
        </div>
        <div style={{ marginTop: 8, fontSize: 14, opacity: .92, lineHeight: 1.4, maxWidth: 280 }}>
          Encaminhar imediatamente à UBS. Sintomas e perfil indicam risco cardiovascular elevado.
        </div>
      </div>

      {/* Conditions */}
      <div style={{
        marginTop: 18, fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '.14em',
        color: ACS.ink3, textTransform: 'uppercase',
      }}>Condições mais prováveis</div>

      <div style={{ marginTop: 8, background: ACS.white, borderRadius: 18, padding: 4 }}>
        {conditions.map((c, i) => (
          <div key={c.name} style={{
            padding: '12px 14px',
            borderBottom: i < conditions.length - 1 ? `1px solid ${ACS.line}` : 'none',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: ACS.ink, lineHeight: 1.2 }}>
                {c.name}
              </div>
              <span style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 600, color: RiskColor[c.level].fg }}>
                {c.pct}%
              </span>
            </div>
            <div style={{ position: 'relative', height: 5, borderRadius: 99, background: ACS.paper2 }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 99,
                width: `${c.pct}%`, background: RiskColor[c.level].dot,
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Recommended action */}
      <div style={{
        marginTop: 14, background: ACS.white, borderRadius: 16,
        padding: 14, borderLeft: `4px solid ${ACS.azul}`,
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: ACS.azul100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="heart" size={20} color={ACS.azul} weight={2} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: '.14em', color: ACS.ink3, textTransform: 'uppercase' }}>
            Ação recomendada
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: ACS.ink, lineHeight: 1.25, marginTop: 2 }}>
            Encaminhar p/ consulta médica na UBS Central
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '14px 20px 30px', background: ACS.paper,
        borderTop: `1px solid ${ACS.line}`, display: 'flex', gap: 10,
      }}>
        <button style={{
          flex: 1, background: 'transparent', border: `1.5px solid ${ACS.azul}`,
          color: ACS.azul, padding: '12px 14px', borderRadius: 14,
          fontWeight: 600, fontSize: 13,
        }}>Exportar</button>
        <button style={{
          flex: 1.5, background: ACS.coral, color: '#fff', border: 'none',
          padding: '12px 14px', borderRadius: 14, fontWeight: 600, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          Registrar encaminhamento <Icon name="arrow-r" size={14} color="#fff" weight={2.2} />
        </button>
      </div>
    </Phone>
  );
}

// ──────────────────────────────────────────────────────────────
// SCREEN 5 — AGENDA / ROUTE
// ──────────────────────────────────────────────────────────────
function ScreenAgenda() {
  const stops = [
    { ord: 1, name: 'Carlos E. Melo',     addr: 'R. das Flores, 124',   dist: '180m',  risk: 'urgente', why: 'Alto risco · encaminhado 05/04', status: 'next' },
    { ord: 2, name: 'Dona Rita Ferreira', addr: 'R. das Flores, 201',   dist: '350m',  risk: 'atencao', why: 'Sem visita há 22 dias', status: 'pending' },
    { ord: 3, name: 'Família Rocha',      addr: 'Av. Central, 45',      dist: '520m',  risk: 'atencao', why: '2 crônicos · renovar receita', status: 'pending' },
    { ord: 4, name: 'João P. Rocha',      addr: 'Av. Central, 45',      dist: '0m',    risk: 'info',    why: 'Vacina tríplice pendente', status: 'pending' },
    { ord: 5, name: 'Ana B. Santos',      addr: 'R. São João, 78',      dist: '780m',  risk: 'baixo',   why: 'Pré-natal · rotina', status: 'done' },
  ];
  return (
    <Phone title="Agenda do dia" subtitle="Sábado, 12 de abril" navActive="route" bg={ACS.paper}>
      {/* List/Map toggle */}
      <div style={{
        marginTop: 6, display: 'flex', background: ACS.paper2, borderRadius: 12, padding: 3,
      }}>
        {[{ k: 'list', l: 'Lista' }, { k: 'map', l: 'Mapa' }].map((t, i) => (
          <div key={t.k} style={{
            flex: 1, textAlign: 'center', padding: '8px 0',
            borderRadius: 9, fontSize: 13, fontWeight: 600,
            background: i === 0 ? ACS.white : 'transparent',
            color: i === 0 ? ACS.ink : ACS.ink3,
            boxShadow: i === 0 ? '0 1px 2px rgba(10,20,40,.06)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icon name={t.k === 'list' ? 'list' : 'pin'} size={14} color={i === 0 ? ACS.ink : ACS.ink3} weight={2} />
            {t.l}
          </div>
        ))}
      </div>

      {/* Metrics */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        {[
          { n: 8, l: 'Total',       c: ACS.ink },
          { n: 3, l: 'Realizadas',  c: ACS.verde },
          { n: 2, l: 'Urgentes',    c: ACS.coral },
        ].map(m => (
          <div key={m.l} style={{
            flex: 1, background: ACS.white, borderRadius: 12, padding: '10px 12px',
          }}>
            <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 22, color: m.c, lineHeight: 1 }}>{m.n}</div>
            <div style={{ fontSize: 11, color: ACS.ink3, marginTop: 2 }}>{m.l}</div>
          </div>
        ))}
      </div>

      {/* Route list */}
      <div style={{
        marginTop: 16, background: ACS.white, borderRadius: 18, padding: '2px 0', position: 'relative',
      }}>
        {/* Thread */}
        <div style={{
          position: 'absolute', left: 34, top: 22, bottom: 22,
          width: 2, background: `linear-gradient(${ACS.line}, ${ACS.line})`,
        }} />
        {stops.map((s, i) => (
          <RouteStop key={s.ord} {...s} isLast={i === stops.length - 1} />
        ))}
      </div>

      {/* FAB */}
      <div style={{
        position: 'absolute', bottom: 96, right: 24,
        padding: '12px 18px', borderRadius: 16,
        background: ACS.ink, color: ACS.paper,
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 8px 20px rgba(10,20,40,.3)',
        fontWeight: 600, fontSize: 13,
      }}>
        <Icon name="route" size={16} color={ACS.paper} weight={2.2} />
        Otimizar rota
      </div>
    </Phone>
  );
}

function RouteStop({ ord, name, addr, dist, risk, why, status, isLast }) {
  const c = RiskColor[risk];
  const dotColor = status === 'done' ? ACS.verde : status === 'next' ? c.dot : ACS.paper2;
  const dotFg = status === 'done' || status === 'next' ? '#fff' : ACS.ink3;
  return (
    <div style={{
      padding: '14px 14px', display: 'flex', gap: 14, alignItems: 'flex-start',
      borderBottom: isLast ? 'none' : `1px solid ${ACS.line}`,
      position: 'relative',
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 99,
        background: dotColor, color: dotFg,
        fontFamily: FONTS.mono, fontSize: 12, fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, zIndex: 1,
        border: `3px solid ${ACS.white}`,
        boxShadow: `0 0 0 1px ${status === 'done' ? ACS.verde : status === 'next' ? c.dot : ACS.line}`,
      }}>
        {status === 'done' ? <Icon name="check" size={14} color="#fff" weight={2.5} /> : ord}
      </div>
      <div style={{ flex: 1, minWidth: 0, opacity: status === 'done' ? .55 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: ACS.ink, textDecoration: status === 'done' ? 'line-through' : 'none' }}>
            {name}
          </div>
          <Pill kind={risk} />
        </div>
        <div style={{ fontSize: 12, color: ACS.ink3, marginTop: 3, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="pin" size={12} color={ACS.ink4} weight={1.8} /> {addr}
          <span style={{ fontFamily: FONTS.mono, color: ACS.ink2 }}>· {dist}</span>
        </div>
        <div style={{ fontSize: 11, color: ACS.ink3, marginTop: 5, fontStyle: 'italic' }}>{why}</div>
      </div>
      {status === 'next' && (
        <button style={{
          background: ACS.azul, color: '#fff', border: 'none',
          padding: '7px 11px', borderRadius: 9, fontSize: 11, fontWeight: 600,
        }}>Iniciar</button>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SCREEN 6 — LOGIN
// ──────────────────────────────────────────────────────────────
function ScreenLogin() {
  return (
    <Phone navActive={null} bg={ACS.paper} statusDark={false}>
      <div style={{ padding: '0 20px 40px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ height: 70 }} />
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 60 }}>
          <AcsMark size={36} />
          <div style={{
            fontFamily: FONTS.display, fontWeight: 600, fontSize: 22,
            letterSpacing: '-0.02em', color: ACS.ink,
          }}>
            ACS <span style={{ fontWeight: 400, color: ACS.ink3 }}>Expert</span>
          </div>
        </div>

        <div style={{
          fontFamily: FONTS.display, fontWeight: 600, fontSize: 40,
          letterSpacing: '-0.03em', lineHeight: 1.05, color: ACS.ink,
        }}>
          Cuidado<br/>
          <span style={{ color: ACS.coral, fontStyle: 'italic', fontWeight: 500 }}>que anda junto.</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 15, color: ACS.ink2, lineHeight: 1.4, maxWidth: 300 }}>
          Triagem, agenda e encaminhamento para a agente comunitária de saúde.
        </div>

        <div style={{ marginTop: 40 }}>
          <label style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '.14em', color: ACS.ink3, textTransform: 'uppercase' }}>
            CPF ou matrícula
          </label>
          <div style={{
            marginTop: 8, background: ACS.white, borderRadius: 14,
            border: `1.5px solid ${ACS.azul}`,
            padding: '14px 14px', fontSize: 15, color: ACS.ink, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            123.456.789<span style={{ color: ACS.ink4 }}>-00</span>
            <div style={{ marginLeft: 'auto', width: 2, height: 18, background: ACS.azul, animation: 'blink 1s step-end infinite' }} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '.14em', color: ACS.ink3, textTransform: 'uppercase' }}>
            Senha
          </label>
          <div style={{
            marginTop: 8, background: ACS.white, borderRadius: 14,
            border: `1px solid ${ACS.lineStrong}`,
            padding: '14px 14px', fontSize: 15, color: ACS.ink3, fontWeight: 500,
          }}>
            ••••••••
          </div>
        </div>

        <button style={{
          marginTop: 24, background: ACS.azul, color: '#fff', border: 'none',
          padding: '15px', borderRadius: 14, fontFamily: FONTS.ui,
          fontWeight: 600, fontSize: 15,
        }}>Entrar</button>

        <div style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: ACS.azul, fontWeight: 500 }}>
          Esqueci minha senha
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 40, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderRadius: 99,
            background: ACS.paper2, fontSize: 11, color: ACS.ink3,
          }}>
            <Icon name="wifi-off" size={12} color={ACS.ink3} /> funciona offline
          </div>
          <div style={{ marginTop: 12, fontFamily: FONTS.mono, fontSize: 10, color: ACS.ink4, letterSpacing: '.1em' }}>
            v 2.4 · SECRETARIA MUNICIPAL DE SAÚDE
          </div>
        </div>
      </div>
    </Phone>
  );
}

Object.assign(window, { ScreenTriage, ScreenResult, ScreenAgenda, ScreenLogin });
