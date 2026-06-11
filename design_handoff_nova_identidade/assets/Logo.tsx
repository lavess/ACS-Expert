import React from 'react';

type Variant = 'mark' | 'full';

interface LogoProps {
  variant?: Variant;
  size?: number;
  color?: string;   // cor do pino
  accent?: string;  // cor do pulso
  muted?: string;   // cor do "Expert"
  className?: string;
}

/**
 * Logo ACS Expert — "Pulso + Território"
 * mark: apenas o símbolo (pino com pulso dentro)
 * full: símbolo + wordmark "ACS Expert"
 */
export function Logo({
  variant = 'full',
  size = 32,
  color = '#0B3A6F',
  accent = '#E76F4A',
  muted = '#6C7788',
  className = '',
}: LogoProps) {
  const Mark = (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        d="M32 4C19.85 4 10 13.85 10 26c0 14 22 34 22 34s22-20 22-34c0-12.15-9.85-22-22-22z"
        stroke={color}
        strokeWidth="3.5"
        fill="none"
      />
      <path
        d="M14 28h8l3-6 6 12 4-8h15"
        stroke={accent}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  if (variant === 'mark') {
    return <span className={className} role="img" aria-label="ACS Expert">{Mark}</span>;
  }

  return (
    <span
      className={`inline-flex items-center gap-2.5 ${className}`}
      role="img"
      aria-label="ACS Expert"
    >
      {Mark}
      <span
        className="font-display font-semibold leading-none tracking-tight"
        style={{ fontSize: size * 0.7, color }}
      >
        ACS <span style={{ fontWeight: 400, color: muted }}>Expert</span>
      </span>
    </span>
  );
}

export default Logo;
