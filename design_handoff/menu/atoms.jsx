/* Átomos compartilhados */
const { useState, useEffect, useRef, useMemo } = React;

const _iconAliases = {
  'stethoscope': 'Stethoscope', 'menu': 'Menu', 'x': 'X',
  'home': 'Home', 'calendar': 'Calendar', 'users': 'Users',
  'clipboard-check': 'ClipboardCheck', 'user': 'User',
  'log-out': 'LogOut', 'settings': 'Settings', 'help-circle': 'HelpCircle',
  'bell': 'Bell', 'plus': 'Plus', 'user-plus': 'UserPlus',
  'map-pin': 'MapPin', 'map': 'Map', 'chevron-down': 'ChevronDown',
  'chevron-right': 'ChevronRight', 'chevron-up': 'ChevronUp',
  'wifi': 'Wifi', 'wifi-off': 'WifiOff', 'cloud-upload': 'CloudUpload',
  'check': 'Check', 'circle-help': 'CircleHelp', 'info': 'Info',
  'sliders-horizontal': 'SlidersHorizontal', 'arrow-left': 'ArrowLeft',
  'arrow-right': 'ArrowRight', 'search': 'Search', 'badge-alert': 'BadgeAlert',
  'alert-circle': 'AlertCircle', 'shield-check': 'ShieldCheck',
  'building-2': 'Building2', 'phone': 'Phone', 'message-circle': 'MessageCircle',
  'sparkles': 'Sparkles', 'trending-up': 'TrendingUp',
  'log-in': 'LogIn', 'circle-user': 'CircleUser',
};

function _lucideKey(name) {
  return String(name).split('-').map(p => p[0].toUpperCase() + p.slice(1)).join('');
}

function Icon({ name, size = 18, strokeWidth = 2, className = '', style, color }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.lucide?.icons) return;
    ref.current.innerHTML = '';
    const key = _iconAliases[name] || _lucideKey(name);
    const node = window.lucide.icons[key] || window.lucide.icons[name] || window.lucide.icons.Circle;
    if (!node) return;
    try {
      const svg = window.lucide.createElement(node);
      svg.setAttribute('width', String(size));
      svg.setAttribute('height', String(size));
      svg.setAttribute('stroke-width', String(strokeWidth));
      if (color) svg.setAttribute('stroke', color);
      ref.current.appendChild(svg);
    } catch {}
  }, [name, size, strokeWidth, color]);
  return <span ref={ref} className={className} style={{
    display: 'inline-flex', lineHeight: 0, width: size, height: size,
    flexShrink: 0, ...(style||{})
  }} />;
}

// Logo mark — pulso que vira pin
function LogoMark({ size = 28, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path
        d="M2 18 L7 18 L9 14 L12 22 L15 10 L18 18 L23 18 C25 18 26 17 26 14 C26 10 22 8 18 12 L16 14 L14 12 C10 8 6 10 6 14"
        stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
        fill="none"
      />
      <circle cx="16" cy="22" r="3" fill={color} />
    </svg>
  );
}

function IOSStatusBar({ time = '14:32' }) {
  return (
    <div className="status-bar">
      <div className="font-display" style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>{time}</div>
      <div className="icons">
        <svg viewBox="0 0 16 12" fill="currentColor"><path d="M0 8h2v4H0zM4 6h2v6H4zM8 4h2v8H8zM12 2h2v10h-2z"/></svg>
        <svg viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M1 4.2c1.8-1.9 4.3-3 7-3s5.2 1.1 7 3"/>
          <path d="M3.5 6.5c1.2-1.2 2.8-1.9 4.5-1.9s3.3.7 4.5 1.9"/>
          <circle cx="8" cy="9.2" r="1" fill="currentColor"/>
        </svg>
        <svg viewBox="0 0 26 12" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x=".5" y=".5" width="22" height="11" rx="3"/>
          <rect x="2" y="2" width="17" height="8" rx="1.5" fill="currentColor"/>
          <path d="M24 4v4" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

// Segmented (used in tweak panel)
function Segmented({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value}
          className={o.value === value ? 'active' : ''}
          onClick={() => onChange(o.value)}
        >{o.label}</button>
      ))}
    </div>
  );
}

// Mock data
const ACS_USER = {
  nome: 'Joana Cardoso',
  iniciais: 'JC',
  matricula: 'ACS-04812',
  ubs: 'UBS Dona Ruth',
  microareaAtual: 'MA-03',
  microareasPossiveis: ['MA-03', 'MA-04', 'MA-05'],
  visitasSemana: 18,
  triagensSemana: 11,
  alertasAbertos: 3,
};

const SYNC_STATE = {
  online: true,
  pendingSync: 2,
  lastSync: 'há 4 min',
};

Object.assign(window, { Icon, LogoMark, IOSStatusBar, Segmented, ACS_USER, SYNC_STATE });
