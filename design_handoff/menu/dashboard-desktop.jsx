/* Dashboard desktop — usado para mostrar a sidebar persistente */

function DashboardDesktop() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--acs-paper)',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      {/* Top bar */}
      <div style={{
        padding: '12px 24px',
        background: '#fff',
        borderBottom: '1px solid var(--acs-line)',
        display: 'flex', alignItems: 'center', gap: 16,
        flexShrink: 0,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11, color: 'var(--acs-ink-3)',
            fontFamily: 'var(--font-mono)', letterSpacing: '.04em',
            textTransform: 'uppercase', fontWeight: 600,
          }}>Início · Microárea MA-03</div>
          <div className="font-display" style={{
            fontSize: 19, fontWeight: 700, letterSpacing: '-0.02em',
            marginTop: 2, color: 'var(--acs-ink)',
          }}>Bom dia, Joana</div>
        </div>
        <div style={{ position: 'relative' }}>
          <Icon name="search" size={15} style={{
            position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--acs-ink-3)',
          }} />
          <input
            placeholder="Buscar paciente, alerta, visita…"
            style={{
              width: 280, padding: '9px 12px 9px 34px',
              border: '1px solid var(--acs-line)',
              borderRadius: 10, fontSize: 13,
              fontFamily: 'inherit',
              background: 'var(--acs-paper)',
            }}
          />
        </div>
        <button style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'var(--acs-paper-2)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--acs-ink)', position: 'relative',
        }}>
          <Icon name="bell" size={16} strokeWidth={2.2} />
          <span style={{
            position: 'absolute', top: 7, right: 8,
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--acs-coral)',
            border: '2px solid var(--acs-paper-2)',
          }} />
        </button>
      </div>

      <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
          <DashCard n="18" label="Visitas / 7d" tone="azul" icon="users" />
          <DashCard n="11" label="Triagens / 7d" tone="azul" icon="clipboard-check" />
          <DashCard n="3" label="Alertas pendentes" tone="coral" icon="badge-alert" />
          <DashCard n="142" label="Famílias na área" tone="azul" icon="building-2" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, alignItems: 'start' }}>
          {/* Próximas visitas */}
          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid var(--acs-line)',
            padding: '14px 16px',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 12,
            }}>
              <div>
                <div className="eyebrow">Hoje</div>
                <div className="font-display" style={{
                  fontSize: 15, fontWeight: 700, letterSpacing: '-0.015em',
                  color: 'var(--acs-ink)', marginTop: 2,
                }}>Próximas visitas</div>
              </div>
              <button className="btn btn-ghost" style={{ padding: '6px 10px', fontSize: 12 }}>Ver todas</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <VisitaRow nome="Maria Barbosa" hora="10:30" addr="Rua das Flores, 142 · 850m" badge="urgente" tone="coral" />
              <VisitaRow nome="João Almeida"  hora="11:15" addr="Travessa do Sol, 33 · 1,2km" />
              <VisitaRow nome="Cleusa Rocha"  hora="14:00" addr="Av. Boa Vista, 1024 · 2km" />
              <VisitaRow nome="Antônio Lima"  hora="15:30" addr="Rua dos Ipês, 88 · 600m" />
            </div>
          </div>

          {/* Alertas list */}
          <div style={{
            background: '#fff', borderRadius: 14,
            border: '1px solid var(--acs-line)',
            padding: '14px 16px',
          }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>Alertas abertos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AlertRow nome="Maria Barbosa" desc="Pressão alta há 2 dias" tone="coral" />
              <AlertRow nome="João Almeida"  desc="Visita atrasada" tone="amar" />
              <AlertRow nome="Cleusa Rocha"  desc="Triagem pendente" tone="amar" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisitaRow({ nome, hora, addr, badge, tone }) {
  const cor = tone === 'coral' ? 'var(--acs-coral)' : 'var(--acs-azul)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '8px 10px',
      borderRadius: 12,
      background: 'var(--acs-paper)',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: '#fff', border: '1px solid var(--acs-line)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div className="font-display" style={{ fontSize: 14, fontWeight: 700, color: 'var(--acs-ink)', letterSpacing: '-0.01em', lineHeight: 1 }}>{hora.split(':')[0]}</div>
        <div style={{ fontSize: 9, color: 'var(--acs-ink-3)', fontFamily: 'var(--font-mono)' }}>:{hora.split(':')[1]}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--acs-ink)', letterSpacing: '-0.005em' }}>{nome}</div>
          {badge && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 6px',
              borderRadius: 999, background: 'var(--acs-coral-100)',
              color: 'var(--acs-coral-700)',
              letterSpacing: '.06em', textTransform: 'uppercase',
              fontFamily: 'var(--font-mono)',
            }}>{badge}</span>
          )}
        </div>
        <div style={{ fontSize: 11, color: 'var(--acs-ink-3)', marginTop: 2 }}>{addr}</div>
      </div>
      <Icon name="chevron-right" size={16} color="var(--acs-ink-3)" />
    </div>
  );
}

Object.assign(window, { DashboardDesktop });
