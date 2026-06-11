// Logo mark — "Pulso + Território" from the brand
function AcsMark({ size = 32, color = '#0B3A6F', accent = '#E76F4A' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={{ display: 'block' }}>
      {/* Territory pin outline */}
      <path d="M32 4C19.85 4 10 13.85 10 26c0 14 22 34 22 34s22-20 22-34c0-12.15-9.85-22-22-22z"
            stroke={color} strokeWidth="3.5" fill="none"/>
      {/* Pulse line */}
      <path d="M14 28h8l3-6 6 12 4-8h15"
            stroke={accent} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

function AcsWordmark({ size = 22, color = '#0E1726', muted = '#6C7788' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: "'Sora', system-ui, sans-serif",
      fontWeight: 600, fontSize: size, letterSpacing: '-0.02em',
      color, lineHeight: 1,
    }}>
      <AcsMark size={size * 1.25} color={color === '#0E1726' ? '#0B3A6F' : color} />
      <span>ACS <span style={{ fontWeight: 400, color: muted }}>Expert</span></span>
    </div>
  );
}

Object.assign(window, { AcsMark, AcsWordmark });
