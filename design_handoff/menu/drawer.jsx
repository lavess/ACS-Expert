/* Drawer mobile + Sidebar desktop — comparte os mesmos blocos */

const NAV_ITEMS = [
  { id: 'inicio',    label: 'Início',     icon: 'home',            badge: null },
  { id: 'agenda',    label: 'Agenda',     icon: 'calendar',        badge: '4 hoje' },
  { id: 'pacientes', label: 'Pacientes',  icon: 'users',           badge: null },
  { id: 'triagens',  label: 'Triagens',   icon: 'clipboard-check', badge: null },
  { id: 'alertas',   label: 'Alertas',    icon: 'badge-alert',     badge: 3, urgent: true },
];

const SECONDARY_ITEMS = [
  { id: 'config',    label: 'Configurações', icon: 'settings' },
  { id: 'ajuda',     label: 'Ajuda',         icon: 'circle-help' },
  { id: 'sobre',     label: 'Sobre o app',   icon: 'info' },
];

// Cabeçalho do agente — formato grande (drawer) e horizontal (sidebar)
function AgenteHero({ user, onLogout, layout = 'mobile' }) {
  if (layout === 'mobile') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #0B3A6F 0%, #104C8F 100%)',
        padding: '20px 22px 24px',
        color: '#fff', position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative pulse */}
        <svg viewBox="0 0 200 80" preserveAspectRatio="none" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          width: '100%', height: 80, opacity: .08,
        }}>
          <path d="M0 40 L40 40 L52 20 L70 60 L88 12 L106 50 L124 40 L200 40"
            stroke="#fff" strokeWidth="2" fill="none" />
        </svg>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 54, height: 54, borderRadius: 16,
            background: 'rgba(255,255,255,.16)',
            border: '2px solid rgba(255,255,255,.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20,
            letterSpacing: '-0.02em',
          }}>
            {user.iniciais}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-display" style={{
              fontSize: 18, fontWeight: 700, letterSpacing: '-0.015em',
            }}>{user.nome}</div>
            <div style={{
              fontSize: 11, opacity: .8, marginTop: 2,
              fontFamily: 'var(--font-mono)', letterSpacing: '.04em',
            }}>{user.matricula}</div>
          </div>
        </div>

        <div style={{
          marginTop: 14, padding: '10px 12px',
          background: 'rgba(0,0,0,.18)', borderRadius: 12,
          display: 'flex', alignItems: 'center', gap: 10,
          position: 'relative',
        }}>
          <Icon name="building-2" size={16} color="rgba(255,255,255,.85)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2 }}>{user.ubs}</div>
            <div style={{
              fontSize: 10, opacity: .7, marginTop: 1,
              fontFamily: 'var(--font-mono)', letterSpacing: '.04em', textTransform: 'uppercase',
            }}>Sua unidade</div>
          </div>
        </div>
      </div>
    );
  }

  // Sidebar (desktop) — compacto
  return (
    <div style={{
      padding: '18px 16px 14px',
      borderBottom: '1px solid var(--acs-line)',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: 'var(--acs-azul)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14,
        flexShrink: 0,
      }}>{user.iniciais}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="font-display" style={{
          fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
          color: 'var(--acs-ink)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{user.nome}</div>
        <div style={{ fontSize: 11, color: 'var(--acs-ink-3)', marginTop: 1 }}>
          {user.ubs}
        </div>
      </div>
    </div>
  );
}

// Microárea — chip selecionável que abre dropdown
function MicroareaSwitcher({ user, layout = 'mobile' }) {
  const [open, setOpen] = useState(false);
  const [atual, setAtual] = useState(user.microareaAtual);
  const isMobile = layout === 'mobile';

  return (
    <div style={{
      padding: isMobile ? '14px 22px 4px' : '14px 14px 4px',
    }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Microárea ativa</div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          background: open ? 'var(--acs-azul-050)' : '#fff',
          border: `1px solid ${open ? 'var(--acs-azul-100)' : 'var(--acs-line)'}`,
          borderRadius: 12,
          padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer', fontFamily: 'inherit',
          textAlign: 'left',
          transition: 'all .15s',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'var(--acs-azul-100)', color: 'var(--acs-azul)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon name="map" size={15} strokeWidth={2.2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="font-mono" style={{
            fontSize: 14, fontWeight: 700, color: 'var(--acs-ink)',
            letterSpacing: '0.01em',
          }}>{atual}</div>
          <div style={{ fontSize: 11, color: 'var(--acs-ink-3)', marginTop: 1 }}>
            142 famílias · trocar
          </div>
        </div>
        <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} color="var(--acs-ink-3)" />
      </button>

      {open && (
        <div className="fade-up" style={{
          marginTop: 6,
          background: '#fff',
          border: '1px solid var(--acs-line)',
          borderRadius: 12, overflow: 'hidden',
        }}>
          {user.microareasPossiveis.map((m, i) => {
            const ativa = m === atual;
            return (
              <button
                key={m}
                onClick={() => { setAtual(m); setOpen(false); }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: ativa ? 'var(--acs-azul-050)' : 'transparent',
                  border: 'none',
                  borderTop: i === 0 ? 'none' : '1px solid var(--acs-line)',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <span className="font-mono" style={{
                  fontSize: 13, fontWeight: 600,
                  color: ativa ? 'var(--acs-azul)' : 'var(--acs-ink)',
                  flex: 1,
                }}>{m}</span>
                {ativa && <Icon name="check" size={15} color="var(--acs-azul)" strokeWidth={2.6} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Atalhos rápidos — 2 colunas
function Atalhos({ layout = 'mobile', onAction }) {
  const isMobile = layout === 'mobile';
  return (
    <div style={{
      padding: isMobile ? '14px 22px 8px' : '12px 14px 6px',
    }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Atalhos</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <ShortcutCard
          icon="clipboard-check" label="Nova triagem"
          tone="coral" onClick={() => onAction?.('triagem')}
        />
        <ShortcutCard
          icon="user-plus" label="Cadastrar paciente"
          tone="azul" onClick={() => onAction?.('cadastro')}
        />
      </div>
    </div>
  );
}

function ShortcutCard({ icon, label, tone = 'azul', onClick }) {
  const tones = {
    azul: { bg: 'var(--acs-azul-050)', icBg: 'var(--acs-azul)', text: 'var(--acs-azul)' },
    coral: { bg: 'var(--acs-coral-100)', icBg: 'var(--acs-coral)', text: 'var(--acs-coral-700)' },
  };
  const t = tones[tone];
  return (
    <button onClick={onClick} style={{
      background: t.bg,
      border: 'none',
      borderRadius: 14,
      padding: '12px 12px 14px',
      cursor: 'pointer', fontFamily: 'inherit',
      display: 'flex', flexDirection: 'column', gap: 8,
      textAlign: 'left',
      transition: 'transform .12s, filter .15s',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: t.icBg, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={16} strokeWidth={2.2} />
      </div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: t.text,
        letterSpacing: '-0.01em', lineHeight: 1.2,
      }}>{label}</div>
    </button>
  );
}

// Lista de navegação principal
function NavList({ items, current, onPick, layout = 'mobile', heading }) {
  const isMobile = layout === 'mobile';
  return (
    <div style={{
      padding: isMobile ? '12px 14px 8px' : '10px 8px 8px',
    }}>
      {heading && (
        <div className="eyebrow" style={{
          padding: isMobile ? '0 8px 8px' : '0 6px 8px',
        }}>{heading}</div>
      )}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => {
          const ativo = current === it.id;
          return (
            <button
              key={it.id}
              onClick={() => onPick?.(it.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: isMobile ? '11px 10px' : '9px 10px',
                background: ativo ? 'var(--acs-azul)' : 'transparent',
                border: 'none', borderRadius: 10,
                cursor: 'pointer', fontFamily: 'inherit',
                color: ativo ? '#fff' : 'var(--acs-ink)',
                textAlign: 'left',
                transition: 'background .12s',
              }}
            >
              <Icon
                name={it.icon}
                size={isMobile ? 18 : 17}
                strokeWidth={2.2}
                color={ativo ? '#fff' : 'var(--acs-ink-2)'}
              />
              <span style={{
                flex: 1, fontSize: isMobile ? 14 : 13,
                fontWeight: ativo ? 600 : 500,
                letterSpacing: '-0.005em',
              }}>{it.label}</span>
              {it.badge != null && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  minWidth: 22, height: 22, padding: '0 6px',
                  borderRadius: 11,
                  background: it.urgent
                    ? 'var(--acs-coral)'
                    : ativo ? 'rgba(255,255,255,.18)' : 'var(--acs-paper-2)',
                  color: it.urgent
                    ? '#fff'
                    : ativo ? '#fff' : 'var(--acs-ink-2)',
                  fontSize: 11, fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.02em',
                }}>{it.badge}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Status de sincronização — pequeno banner no rodapé
function SyncStatus({ sync, layout = 'mobile' }) {
  const isMobile = layout === 'mobile';
  const cor = sync.online ? 'var(--acs-verde)' : 'var(--acs-amar)';
  return (
    <div style={{
      padding: isMobile ? '10px 22px' : '10px 14px',
      borderTop: '1px solid var(--acs-line)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 9,
        background: sync.online ? 'var(--acs-verde-100)' : 'var(--acs-amar-100)',
        color: sync.online ? 'var(--acs-verde-700)' : 'var(--acs-amar-700)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon name={sync.online ? 'wifi' : 'wifi-off'} size={14} strokeWidth={2.2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 12, fontWeight: 600, color: 'var(--acs-ink)',
          letterSpacing: '-0.005em',
        }}>
          {sync.online ? 'Conectado' : 'Sem conexão'}
        </div>
        <div style={{
          fontSize: 10, color: 'var(--acs-ink-3)', marginTop: 1,
          fontFamily: 'var(--font-mono)', letterSpacing: '.04em',
        }}>
          {sync.pendingSync > 0
            ? `${sync.pendingSync} envios pendentes · ${sync.lastSync}`
            : `Sincronizado · ${sync.lastSync}`}
        </div>
      </div>
      {sync.pendingSync > 0 && (
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: cor, flexShrink: 0,
        }} />
      )}
    </div>
  );
}

// Logout button
function LogoutButton({ layout = 'mobile' }) {
  const isMobile = layout === 'mobile';
  return (
    <div style={{
      padding: isMobile ? '8px 22px 18px' : '6px 14px 14px',
    }}>
      <button style={{
        width: '100%',
        padding: '11px 14px',
        background: '#fff',
        border: '1px solid var(--acs-line-strong)',
        borderRadius: 12,
        color: 'var(--acs-vermelho-700)',
        fontFamily: 'inherit',
        fontSize: 13, fontWeight: 600,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 8,
        letterSpacing: '-0.005em',
      }}>
        <Icon name="log-out" size={15} color="currentColor" strokeWidth={2.2} />
        Sair da conta
      </button>
    </div>
  );
}

// === DRAWER MOBILE ===
function MobileDrawer({ open, onClose, current = 'inicio', onPick, showStats = true, layout = '85' }) {
  const widthPct = layout === 'full' ? '100%' : '86%';
  const radius = layout === 'full' ? 0 : 22;

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          onClick={onClose}
          className="overlay"
          style={{
            position: 'absolute', inset: 0, zIndex: 40,
            background: 'rgba(8,15,30,.45)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Drawer */}
      {open && (
        <div
          className="drawer-mobile"
          style={{
            position: 'absolute',
            top: 0, bottom: 0, left: 0,
            width: widthPct,
            background: 'var(--acs-paper)',
            zIndex: 41,
            borderTopRightRadius: radius,
            borderBottomRightRadius: radius,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 0 50px rgba(0,0,0,.3)',
          }}
        >
          {/* Top close button (over hero) */}
          <div style={{ position: 'relative' }}>
            <AgenteHero user={ACS_USER} layout="mobile" />
            <button
              onClick={onClose}
              aria-label="Fechar"
              style={{
                position: 'absolute', top: 14, right: 16,
                width: 34, height: 34, borderRadius: 11,
                background: 'rgba(255,255,255,.16)',
                border: '1px solid rgba(255,255,255,.22)',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              <Icon name="x" size={18} strokeWidth={2.2} />
            </button>
          </div>

          <div className="scroll-thin" style={{ flex: 1, overflowY: 'auto' }}>
            <MicroareaSwitcher user={ACS_USER} layout="mobile" />
            <Atalhos layout="mobile" />
            <NavList items={NAV_ITEMS} current={current} onPick={(id)=>{onPick?.(id); onClose();}} layout="mobile" heading="Navegar" />

            {showStats && (
              <div style={{
                margin: '8px 22px 12px',
                padding: '12px 14px',
                background: '#fff',
                border: '1px solid var(--acs-line)',
                borderRadius: 14,
              }}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>Sua semana</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <Stat n={ACS_USER.visitasSemana} label="Visitas" />
                  <Stat n={ACS_USER.triagensSemana} label="Triagens" />
                  <Stat n={ACS_USER.alertasAbertos} label="Alertas" tone="coral" />
                </div>
              </div>
            )}

            <NavList items={SECONDARY_ITEMS} layout="mobile" heading="Conta" />
          </div>

          <SyncStatus sync={SYNC_STATE} layout="mobile" />
          <LogoutButton layout="mobile" />
        </div>
      )}
    </>
  );
}

function Stat({ n, label, tone }) {
  const c = tone === 'coral' ? 'var(--acs-coral)' : 'var(--acs-ink)';
  return (
    <div>
      <div className="font-display" style={{
        fontSize: 22, fontWeight: 700, color: c,
        letterSpacing: '-0.025em', lineHeight: 1,
      }}>{n}</div>
      <div className="eyebrow" style={{ marginTop: 2 }}>{label}</div>
    </div>
  );
}

// === SIDEBAR DESKTOP ===
function DesktopSidebar({ current = 'inicio', onPick, showStats = true }) {
  return (
    <aside style={{
      width: 252,
      background: '#fff',
      borderRight: '1px solid var(--acs-line)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0,
    }}>
      {/* Brand */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '1px solid var(--acs-line)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 9,
          background: 'var(--acs-azul)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LogoMark size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="font-display" style={{
            fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
            color: 'var(--acs-ink)',
          }}>ACS Expert</div>
        </div>
      </div>

      <AgenteHero user={ACS_USER} layout="desktop" />
      <MicroareaSwitcher user={ACS_USER} layout="desktop" />

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }} className="scroll-thin">
        <NavList items={NAV_ITEMS} current={current} onPick={onPick} layout="desktop" />
        <Atalhos layout="desktop" />
        {showStats && (
          <div style={{
            margin: '6px 14px 10px',
            padding: '12px 14px',
            background: 'var(--acs-paper-2)',
            borderRadius: 12,
          }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>Sua semana</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <Stat n={ACS_USER.visitasSemana} label="Visitas" />
              <Stat n={ACS_USER.triagensSemana} label="Triagens" />
              <Stat n={ACS_USER.alertasAbertos} label="Alertas" tone="coral" />
            </div>
          </div>
        )}
        <NavList items={SECONDARY_ITEMS} layout="desktop" heading="Conta" />
      </div>

      <SyncStatus sync={SYNC_STATE} layout="desktop" />
      <LogoutButton layout="desktop" />
    </aside>
  );
}

Object.assign(window, {
  NAV_ITEMS, SECONDARY_ITEMS,
  AgenteHero, MicroareaSwitcher, Atalhos, NavList, SyncStatus, LogoutButton,
  MobileDrawer, DesktopSidebar, Stat,
});
