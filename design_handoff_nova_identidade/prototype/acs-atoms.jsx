/* global React, ACS, FONTS, AcsMark, AcsWordmark */

// ─────────────────────────────────────────────────────────────
// Shared atoms
// ─────────────────────────────────────────────────────────────

const RiskColor = {
  urgente: { bg: ACS.vermelho100, fg: ACS.vermelho, dot: ACS.vermelho, label: 'URGENTE' },
  atencao: { bg: ACS.amar100,     fg: '#A3740A',      dot: ACS.amar,     label: 'ATENÇÃO' },
  info:    { bg: ACS.azul100,     fg: ACS.azul,       dot: ACS.azul700,  label: 'INFO' },
  baixo:   { bg: ACS.verde100,    fg: '#1E6B48',      dot: ACS.verde,    label: 'ROTINA' },
};

function Pill({ kind = 'info', children, style = {} }) {
  const c = RiskColor[kind];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: c.bg, color: c.fg,
      fontFamily: FONTS.mono, fontSize: 10, fontWeight: 600,
      letterSpacing: '.1em', textTransform: 'uppercase',
      padding: '4px 8px 3px', borderRadius: 6,
      ...style,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: 99, background: c.dot }} />
      {children || c.label}
    </span>
  );
}

function Icon({ name, size = 20, color = 'currentColor', weight = 1.8 }) {
  const s = { width: size, height: size, display: 'block', flexShrink: 0 };
  const stroke = { stroke: color, strokeWidth: weight, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const P = ({ children, viewBox = '0 0 24 24' }) => (
    <svg viewBox={viewBox} style={s}>{children}</svg>
  );
  switch (name) {
    case 'home':      return <P><path d="M3 11l9-7 9 7v10a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1V11z" {...stroke}/></P>;
    case 'users':     return <P><circle cx="9" cy="8" r="3.5" {...stroke}/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" {...stroke}/><path d="M16 9.5a3 3 0 000-5.5M22 20c0-2.5-1.5-4.5-4-5.5" {...stroke}/></P>;
    case 'route':     return <P><circle cx="6" cy="5" r="2.5" {...stroke}/><circle cx="18" cy="19" r="2.5" {...stroke}/><path d="M6 7.5v2a4 4 0 004 4h4a4 4 0 014 4v.5" {...stroke}/></P>;
    case 'bell':      return <P><path d="M6 16V10a6 6 0 1112 0v6l1.5 2H4.5L6 16z" {...stroke}/><path d="M10 21h4" {...stroke}/></P>;
    case 'menu':      return <P><path d="M4 7h16M4 12h16M4 17h16" {...stroke}/></P>;
    case 'search':    return <P><circle cx="11" cy="11" r="6" {...stroke}/><path d="M20 20l-4.5-4.5" {...stroke}/></P>;
    case 'plus':      return <P><path d="M12 5v14M5 12h14" {...stroke}/></P>;
    case 'chevron':   return <P><path d="M9 6l6 6-6 6" {...stroke}/></P>;
    case 'back':      return <P><path d="M15 6l-6 6 6 6" {...stroke}/></P>;
    case 'check':     return <P><path d="M5 12.5l4.5 4.5L19 7.5" {...stroke}/></P>;
    case 'alert':     return <P><path d="M12 3l10 18H2L12 3z" {...stroke}/><path d="M12 10v5M12 18v.5" {...stroke}/></P>;
    case 'clock':     return <P><circle cx="12" cy="12" r="9" {...stroke}/><path d="M12 7v5l3.5 2" {...stroke}/></P>;
    case 'pin':       return <P><path d="M12 22s8-8 8-13a8 8 0 10-16 0c0 5 8 13 8 13z" {...stroke}/><circle cx="12" cy="9" r="3" {...stroke}/></P>;
    case 'phone':     return <P><path d="M5 4h3l2 5-2.5 1.5a12 12 0 006 6L15 14l5 2v3a2 2 0 01-2 2A15 15 0 013 6a2 2 0 012-2z" {...stroke}/></P>;
    case 'heart':     return <P><path d="M12 20s-7-4.5-7-10a4.5 4.5 0 018-3 4.5 4.5 0 018 3c0 5.5-7 10-7 10h-2z" {...stroke}/></P>;
    case 'calendar':  return <P><rect x="3.5" y="5" width="17" height="16" rx="2" {...stroke}/><path d="M3.5 10h17M8 3v4M16 3v4" {...stroke}/></P>;
    case 'send':      return <P><path d="M21 3L3 11l7 2 2 7 9-17z" {...stroke}/></P>;
    case 'list':      return <P><path d="M8 6h13M8 12h13M8 18h13" {...stroke}/><circle cx="4" cy="6" r="1" fill={color}/><circle cx="4" cy="12" r="1" fill={color}/><circle cx="4" cy="18" r="1" fill={color}/></P>;
    case 'wifi-off': return <P><path d="M2 8.5a15 15 0 015-3M19 5.5a15 15 0 013 3M7 12a8 8 0 013-2M14 10a8 8 0 013 2M11 15.5a3 3 0 012 0M3 3l18 18" {...stroke}/></P>;
    case 'sync':      return <P><path d="M20 12a8 8 0 01-14 5.5M4 12a8 8 0 0114-5.5M20 4v4h-4M4 20v-4h4" {...stroke}/></P>;
    case 'x':         return <P><path d="M6 6l12 12M18 6L6 18" {...stroke}/></P>;
    case 'arrow-r':   return <P><path d="M5 12h14M13 6l6 6-6 6" {...stroke}/></P>;
    case 'filter':    return <P><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" {...stroke}/></P>;
    case 'sparkle':   return <P><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" {...stroke}/></P>;
    default: return <P><circle cx="12" cy="12" r="9" {...stroke}/></P>;
  }
}

// Phone chrome — 390x844
function Phone({ title, subtitle, children, navActive = 'home', showBack = false, bg = ACS.paper, statusDark = false, scrollable = true }) {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 44, overflow: 'hidden',
      position: 'relative', background: '#1c2a3d',
      padding: 6, boxShadow: '0 40px 80px rgba(10,20,40,.22), 0 0 0 1.5px rgba(0,0,0,.25)',
      fontFamily: FONTS.ui,
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 38, overflow: 'hidden',
        background: bg, position: 'relative', display: 'flex', flexDirection: 'column',
      }}>
        {/* Status bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 44,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 28px 0', fontSize: 14, fontWeight: 600, zIndex: 20,
          color: statusDark ? '#fff' : ACS.ink, fontFamily: FONTS.ui,
        }}>
          <span>9:41</span>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <svg width="17" height="11" viewBox="0 0 17 11"><path fill={statusDark ? '#fff' : ACS.ink} d="M1 7h2v4H1zm4-2h2v6H5zm4-2h2v8H9zm4-3h2v11h-2z"/></svg>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none"><path d="M1 5l6.5-4L14 5m-11 2l4.5-2.5L12 7m-6 2l1.5-1L9 9" stroke={statusDark ? '#fff' : ACS.ink} strokeWidth="1.3" strokeLinecap="round"/></svg>
            <svg width="25" height="12" viewBox="0 0 25 12"><rect x=".5" y=".5" width="22" height="11" rx="2.5" fill="none" stroke={statusDark ? '#fff' : ACS.ink} opacity=".5"/><rect x="2" y="2" width="17" height="8" rx="1.5" fill={statusDark ? '#fff' : ACS.ink}/><rect x="23" y="3.5" width="1.5" height="5" rx=".5" fill={statusDark ? '#fff' : ACS.ink} opacity=".5"/></svg>
          </div>
        </div>
        {/* Notch */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          width: 118, height: 32, background: '#0E1726', borderRadius: 99, zIndex: 30,
        }} />

        {/* Header */}
        {title !== undefined && (
          <div style={{
            paddingTop: 52, padding: '52px 20px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            {showBack && (
              <button style={{
                width: 36, height: 36, borderRadius: 12, border: 'none',
                background: ACS.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 2px rgba(10,20,40,.06)', cursor: 'pointer',
              }}><Icon name="back" size={18} color={ACS.ink} /></button>
            )}
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: FONTS.display, fontWeight: 600, fontSize: 24,
                letterSpacing: '-0.02em', color: ACS.ink, lineHeight: 1.1,
              }}>{title}</div>
              {subtitle && (
                <div style={{ fontSize: 13, color: ACS.ink3, marginTop: 2 }}>{subtitle}</div>
              )}
            </div>
          </div>
        )}

        {/* Body */}
        <div style={{
          flex: 1, overflow: scrollable ? 'hidden' : 'visible',
          padding: '4px 20px 100px',
        }}>{children}</div>

        {/* Bottom nav */}
        {navActive && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: ACS.white, borderTop: `1px solid ${ACS.line}`,
            padding: '10px 8px 22px', display: 'flex', justifyContent: 'space-around',
          }}>
            {[
              { k: 'home', label: 'Início' },
              { k: 'users', label: 'Pacientes' },
              { k: 'route', label: 'Agenda' },
              { k: 'send', label: 'Encaminhar' },
              { k: 'bell', label: 'Alertas' },
            ].map(i => {
              const on = i.k === navActive;
              return (
                <div key={i.k} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '6px 10px', color: on ? ACS.azul : ACS.ink3,
                  fontSize: 10, fontWeight: on ? 600 : 500,
                  position: 'relative',
                }}>
                  {on && (
                    <div style={{
                      position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                      width: 28, height: 3, borderRadius: 99, background: ACS.azul,
                    }} />
                  )}
                  <Icon name={i.k} size={22} color={on ? ACS.azul : ACS.ink3} weight={on ? 2 : 1.7} />
                  <span>{i.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Home indicator */}
        <div style={{
          position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
          width: 134, height: 5, borderRadius: 99, background: ACS.ink, opacity: .9, zIndex: 40,
        }} />
      </div>
    </div>
  );
}

Object.assign(window, { Pill, Icon, Phone, RiskColor });
