/* Dashboard mobile — usado como background atrás do drawer */

function DashboardMobile({ onOpenMenu }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--acs-paper)',
      overflow: 'hidden',
    }}>
      {/* Top bar with hamburger */}
      <div style={{
        padding: '8px 16px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff',
        borderBottom: '1px solid var(--acs-line)',
        flexShrink: 0,
      }}>
        <button
          onClick={onOpenMenu}
          aria-label="Abrir menu"
          style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--acs-paper-2)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--acs-ink)',
            flexShrink: 0,
          }}
        >
          <Icon name="menu" size={20} strokeWidth={2.2} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 11, color: 'var(--acs-ink-3)',
            fontFamily: 'var(--font-mono)', letterSpacing: '.04em',
            textTransform: 'uppercase', fontWeight: 600,
          }}>Bom dia, Joana</div>
          <div className="font-display" style={{
            fontSize: 17, fontWeight: 700, letterSpacing: '-0.018em',
            color: 'var(--acs-ink)', lineHeight: 1.1, marginTop: 1,
          }}>Início</div>
        </div>
        <button style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'var(--acs-paper-2)', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--acs-ink)', position: 'relative',
        }}>
          <Icon name="bell" size={18} strokeWidth={2.2} />
          <span style={{
            position: 'absolute', top: 8, right: 9,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--acs-coral)',
            border: '2px solid var(--acs-paper-2)',
          }} />
        </button>
      </div>

      <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto', padding: '14px 16px 20px' }}>
        {/* Hero coral CTA */}
        <div style={{
          background: 'linear-gradient(135deg, #E76F4A 0%, #C95231 100%)',
          borderRadius: 18, padding: '16px 18px 18px',
          color: '#fff', marginBottom: 14,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 10,
            letterSpacing: '.14em', textTransform: 'uppercase',
            fontWeight: 700, opacity: .9,
          }}>Próxima visita</div>
          <div className="font-display" style={{
            fontSize: 22, fontWeight: 700, marginTop: 4,
            letterSpacing: '-0.025em', lineHeight: 1.1,
          }}>Maria Barbosa</div>
          <div style={{ fontSize: 12, opacity: .85, marginTop: 4 }}>
            Rua das Flores, 142 · 850m
          </div>
          <div style={{
            marginTop: 12, padding: '8px 12px',
            background: 'rgba(0,0,0,.22)', borderRadius: 10,
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12, fontWeight: 600,
          }}>
            <Icon name="calendar" size={13} color="#fff" strokeWidth={2.2} />
            Hoje · 10:30
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <DashCard n="18" label="Visitas / 7d" tone="azul" icon="users" />
          <DashCard n="11" label="Triagens / 7d" tone="azul" icon="clipboard-check" />
        </div>

        {/* Alertas */}
        <div style={{
          background: '#fff', borderRadius: 14,
          border: '1px solid var(--acs-line)',
          padding: '12px 14px', marginBottom: 14,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <div className="font-display" style={{
              fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
            }}>Alertas abertos</div>
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: 'var(--acs-coral)', fontWeight: 700,
              letterSpacing: '.02em',
            }}>3 pendentes</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <AlertRow nome="Maria Barbosa" desc="Pressão alta há 2 dias" tone="coral" />
            <AlertRow nome="João Almeida" desc="Visita atrasada" tone="amar" />
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{
        flexShrink: 0,
        padding: '8px 8px 18px',
        background: '#fff',
        borderTop: '1px solid var(--acs-line)',
        display: 'flex',
      }}>
        {[
          { id: 'inicio',    label: 'Início',    icon: 'home',    active: true },
          { id: 'agenda',    label: 'Agenda',    icon: 'calendar' },
          { id: 'pacientes', label: 'Pacientes', icon: 'users' },
          { id: 'alertas',   label: 'Alertas',   icon: 'badge-alert' },
          { id: 'perfil',    label: 'Perfil',    icon: 'user' },
        ].map(t => (
          <div key={t.id} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 3,
            padding: '6px 0',
            color: t.active ? 'var(--acs-azul)' : 'var(--acs-ink-3)',
          }}>
            <Icon name={t.icon} size={20} strokeWidth={t.active ? 2.4 : 2} color={t.active ? 'var(--acs-azul)' : 'var(--acs-ink-3)'} />
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.01em',
            }}>{t.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DashCard({ n, label, tone, icon }) {
  const tones = {
    azul:  { bg: '#fff', border: 'var(--acs-line)', text: 'var(--acs-ink)', icBg: 'var(--acs-azul-050)', icCol: 'var(--acs-azul)' },
    coral: { bg: 'var(--acs-coral-100)', border: 'var(--acs-coral-100)', text: 'var(--acs-coral-700)', icBg: '#fff', icCol: 'var(--acs-coral)' },
  };
  const t = tones[tone] || tones.azul;
  return (
    <div style={{
      background: t.bg,
      border: `1px solid ${t.border}`,
      borderRadius: 14,
      padding: '12px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: t.icBg, color: t.icCol,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={14} strokeWidth={2.2} color={t.icCol} />
        </div>
        <span className="eyebrow">{label}</span>
      </div>
      <div className="font-display" style={{
        fontSize: 26, fontWeight: 700, color: t.text,
        letterSpacing: '-0.025em', lineHeight: 1,
      }}>{n}</div>
    </div>
  );
}

function AlertRow({ nome, desc, tone }) {
  const cor = tone === 'coral' ? 'var(--acs-coral)' : 'var(--acs-amar)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%', background: cor, flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--acs-ink)', letterSpacing: '-0.005em' }}>{nome}</div>
        <div style={{ fontSize: 11, color: 'var(--acs-ink-3)', marginTop: 1 }}>{desc}</div>
      </div>
      <Icon name="chevron-right" size={15} color="var(--acs-ink-3)" />
    </div>
  );
}

Object.assign(window, { DashboardMobile });
