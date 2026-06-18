/* global React, ACS, FONTS, Pill, Icon, Phone, RiskColor, AcsMark, AcsWordmark */

// ──────────────────────────────────────────────────────────────
// SCREEN 1 — HOME / DASHBOARD
// ──────────────────────────────────────────────────────────────
function ScreenHome() {
  return (
    <Phone navActive="home" bg={ACS.paper}>
      {/* Custom header — greeting + avatar */}
      <div style={{ paddingTop: 52, padding: '52px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 14,
          background: `linear-gradient(135deg, ${ACS.azul} 0%, ${ACS.verde} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontFamily: FONTS.display, fontWeight: 600, fontSize: 16,
        }}>MS</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: ACS.ink3, letterSpacing: '.02em' }}>Bom dia,</div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 20, color: ACS.ink, letterSpacing: '-0.015em' }}>
            Maria Silva
          </div>
        </div>
        <button style={{
          width: 40, height: 40, borderRadius: 12, border: 'none', background: ACS.white,
          display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
          boxShadow: '0 1px 2px rgba(10,20,40,.06)',
        }}>
          <Icon name="bell" size={20} color={ACS.ink} />
          <div style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 99, background: ACS.coral, border: '1.5px solid #fff' }} />
        </button>
      </div>

      <div style={{ padding: '0 20px 100px', marginTop: 8 }}>
        {/* Offline sync banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: ACS.amar100, color: '#7A5310',
          borderRadius: 12, padding: '10px 14px', marginBottom: 16,
          fontSize: 12, fontWeight: 500,
        }}>
          <Icon name="wifi-off" size={16} color="#7A5310" />
          <span style={{ flex: 1 }}>Modo offline — 3 triagens aguardando sincronização</span>
          <Icon name="sync" size={14} color="#7A5310" />
        </div>

        {/* HERO — Today's route card */}
        <div style={{
          background: ACS.azul,
          borderRadius: 24, padding: '20px 20px 18px', color: '#fff',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Decorative pulse */}
          <svg width="200" height="80" viewBox="0 0 200 80" style={{ position: 'absolute', right: -10, bottom: -8, opacity: .18 }}>
            <path d="M0 40h40l10-20 20 40 15-30 20 20 15-10 20 20h60" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', opacity: .7 }}>
              Hoje · 12 de abril
            </div>
            <div style={{
              fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600, letterSpacing: '.1em',
              background: 'rgba(255,255,255,.14)', padding: '4px 8px', borderRadius: 6,
            }}>MICROÁREA 04</div>
          </div>
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 34, letterSpacing: '-0.03em', lineHeight: 1 }}>
            8 <span style={{ color: ACS.azul300, fontWeight: 400 }}>visitas</span>
          </div>
          <div style={{ fontSize: 13, opacity: .75, marginTop: 4 }}>
            3 realizadas · 2 urgentes · 3 rotina
          </div>
          <div style={{
            marginTop: 16, height: 6, background: 'rgba(255,255,255,.15)', borderRadius: 99, overflow: 'hidden',
            display: 'flex',
          }}>
            <div style={{ width: '38%', background: ACS.verde }} />
            <div style={{ width: '25%', background: ACS.coral }} />
            <div style={{ width: '37%', background: ACS.azul300 }} />
          </div>
          <button style={{
            marginTop: 16, width: '100%', border: 'none',
            background: '#fff', color: ACS.azul,
            padding: '12px 16px', borderRadius: 12, fontFamily: FONTS.ui,
            fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: 'pointer',
          }}>
            <Icon name="route" size={16} color={ACS.azul} weight={2.2} />
            Iniciar agenda do dia
            <Icon name="arrow-r" size={14} color={ACS.azul} weight={2.2} />
          </button>
        </div>

        {/* Quick metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 12 }}>
          <div style={{ background: ACS.white, borderRadius: 16, padding: 14 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: '.12em', color: ACS.ink3, textTransform: 'uppercase' }}>
              Cadastrados
            </div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 26, color: ACS.ink, letterSpacing: '-0.02em', marginTop: 2 }}>
              312 <span style={{ fontSize: 12, color: ACS.ink3, fontWeight: 400 }}>famílias</span>
            </div>
          </div>
          <div style={{ background: ACS.white, borderRadius: 16, padding: 14 }}>
            <div style={{ fontFamily: FONTS.mono, fontSize: 9, letterSpacing: '.12em', color: ACS.ink3, textTransform: 'uppercase' }}>
              Alto risco
            </div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 26, color: ACS.coral, letterSpacing: '-0.02em', marginTop: 2 }}>
              14 <span style={{ fontSize: 12, color: ACS.ink3, fontWeight: 400 }}>pessoas</span>
            </div>
          </div>
        </div>

        {/* Priority alerts */}
        <div style={{
          marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15, color: ACS.ink }}>
            Requer atenção
          </div>
          <span style={{ fontSize: 12, color: ACS.azul, fontWeight: 500 }}>Ver tudo</span>
        </div>

        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AlertRow kind="urgente" name="Carlos Melo, 68" detail="Encaminhamento sem retorno há 7 dias" />
          <AlertRow kind="atencao" name="Família Rocha" detail="2 crônicos sem visita há 30 dias" />
          <AlertRow kind="info" name="Campanha de vacinação" detail="4 pacientes elegíveis na microárea" />
        </div>
      </div>
    </Phone>
  );
}

function AlertRow({ kind, name, detail }) {
  const c = RiskColor[kind];
  return (
    <div style={{
      background: ACS.white, borderRadius: 14,
      padding: '12px 14px',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      borderLeft: `3px solid ${c.dot}`,
    }}>
      <div style={{ flex: 1 }}>
        <Pill kind={kind} style={{ marginBottom: 6 }} />
        <div style={{ fontSize: 14, fontWeight: 600, color: ACS.ink, lineHeight: 1.3 }}>{name}</div>
        <div style={{ fontSize: 12, color: ACS.ink3, marginTop: 2, lineHeight: 1.3 }}>{detail}</div>
      </div>
      <Icon name="chevron" size={16} color={ACS.ink4} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SCREEN 2 — PATIENT LIST
// ──────────────────────────────────────────────────────────────
function ScreenPatients() {
  const patients = [
    { n: 'Ana Beatriz Santos', age: 42, risk: 'baixo',   last: 'há 4 dias',   tag: 'Gestante 2º tri' },
    { n: 'Carlos Eduardo Melo', age: 68, risk: 'urgente', last: 'há 12 dias',  tag: 'HAS · DM2' },
    { n: 'Dona Rita Ferreira',  age: 74, risk: 'atencao', last: 'há 22 dias',  tag: 'HAS · Idoso' },
    { n: 'João Pedro Rocha',    age: 8,  risk: 'info',    last: 'há 8 dias',   tag: 'Vacina pendente' },
    { n: 'Lúcia Albuquerque',   age: 55, risk: 'atencao', last: 'há 15 dias',  tag: 'DM2' },
    { n: 'Marcos Antônio Lima', age: 31, risk: 'baixo',   last: 'há 2 dias',   tag: 'Puericultura filho' },
  ];
  return (
    <Phone title="Pacientes" subtitle="312 cadastrados na sua microárea" navActive="users" bg={ACS.paper}>
      {/* Search */}
      <div style={{
        marginTop: 6, background: ACS.white, borderRadius: 14,
        display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
      }}>
        <Icon name="search" size={18} color={ACS.ink3} />
        <input placeholder="Buscar nome, CPF ou endereço" readOnly
          style={{ border: 'none', outline: 'none', flex: 1, fontSize: 14, fontFamily: FONTS.ui, color: ACS.ink3, background: 'transparent' }} />
        <button style={{ border: 'none', background: ACS.paper2, borderRadius: 8, padding: 6, display: 'flex' }}>
          <Icon name="filter" size={16} color={ACS.ink2} />
        </button>
      </div>

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, overflow: 'hidden', flexWrap: 'wrap' }}>
        {['Todos · 312', 'Alto risco · 14', 'Gestantes · 9', 'Crônicos · 87', 'Crianças · 44'].map((t, i) => (
          <div key={t} style={{
            padding: '6px 12px', borderRadius: 99,
            background: i === 0 ? ACS.ink : ACS.white,
            color:      i === 0 ? ACS.paper : ACS.ink2,
            fontSize: 12, fontWeight: 500,
            border: `1px solid ${i === 0 ? ACS.ink : ACS.lineStrong}`,
          }}>{t}</div>
        ))}
      </div>

      {/* Group label */}
      <div style={{
        marginTop: 18, marginBottom: 6,
        fontFamily: FONTS.mono, fontSize: 10, letterSpacing: '.14em',
        color: ACS.ink3, textTransform: 'uppercase',
      }}>
        Ordenado por prioridade
      </div>

      {/* List */}
      <div style={{ background: ACS.white, borderRadius: 18, overflow: 'hidden' }}>
        {patients.map((p, i) => (
          <div key={p.n} style={{
            padding: '14px 14px',
            display: 'flex', gap: 12, alignItems: 'center',
            borderBottom: i < patients.length - 1 ? `1px solid ${ACS.line}` : 'none',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 14,
              background: ACS.paper2, color: ACS.ink2,
              fontFamily: FONTS.display, fontWeight: 600, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>{p.n.split(' ').map(s => s[0]).slice(0, 2).join('')}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: ACS.ink, lineHeight: 1.2 }}>
                {p.n}<span style={{ color: ACS.ink3, fontWeight: 400 }}>, {p.age}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <Pill kind={p.risk} />
                <span style={{ fontSize: 11, color: ACS.ink3 }}>{p.tag}</span>
              </div>
              <div style={{ fontSize: 11, color: ACS.ink3, marginTop: 3 }}>Última visita {p.last}</div>
            </div>
            <Icon name="chevron" size={16} color={ACS.ink4} />
          </div>
        ))}
      </div>

      {/* FAB */}
      <div style={{
        position: 'absolute', bottom: 96, right: 24,
        width: 56, height: 56, borderRadius: 18,
        background: ACS.coral, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 20px rgba(231,111,74,.45)',
      }}>
        <Icon name="plus" size={24} color="#fff" weight={2.2} />
      </div>
    </Phone>
  );
}

Object.assign(window, { ScreenHome, ScreenPatients });
