import { Building2 } from 'lucide-react'
import type { AcsUser, Layout } from '../types'

interface Props {
  user:   AcsUser
  layout: Layout
  /** id usado por `aria-labelledby` no <dialog> do drawer (apenas mobile). */
  titleId?: string
}

/**
 * Cabeçalho do agente.
 * - mobile: hero alto (gradient azul, avatar grande, UBS embaixo)
 * - desktop: linha horizontal compacta (avatar + nome + UBS)
 */
export function AgenteHero({ user, layout, titleId }: Props) {
  if (layout === 'mobile') {
    return (
      <div
        className="relative overflow-hidden text-white px-5 pt-5 pb-6"
        style={{
          background: 'linear-gradient(135deg, var(--acs-azul) 0%, var(--acs-azul-700) 100%)',
        }}
      >
        {/* Onda decorativa */}
        <svg
          aria-hidden="true"
          viewBox="0 0 200 80"
          preserveAspectRatio="none"
          className="absolute inset-x-0 bottom-0 w-full h-20 opacity-[.08]"
        >
          <path
            d="M0 40 L40 40 L52 20 L70 60 L88 12 L106 50 L124 40 L200 40"
            stroke="#fff" strokeWidth="2" fill="none"
          />
        </svg>

        <div className="relative flex items-center gap-3.5">
          {/* Avatar */}
          <div
            className="w-[54px] h-[54px] rounded-2xl flex items-center justify-center font-display font-bold text-[20px] flex-shrink-0"
            style={{
              background: 'rgba(255,255,255,.16)',
              border: '2px solid rgba(255,255,255,.22)',
              letterSpacing: '-0.02em',
            }}
            aria-hidden="true"
          >
            {user.iniciais}
          </div>

          <div className="flex-1 min-w-0">
            <div
              id={titleId}
              className="font-display font-bold truncate"
              style={{ fontSize: 18, letterSpacing: '-0.015em' }}
            >
              {user.nome}
            </div>
            <div className="font-mono text-[11px] opacity-80 mt-0.5 tracking-[.04em]">
              {user.matricula}
            </div>
          </div>
        </div>

        {/* UBS */}
        <div
          className="relative mt-3.5 flex items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{ background: 'rgba(0,0,0,.18)' }}
        >
          <Building2 size={16} strokeWidth={2} style={{ color: 'rgba(255,255,255,.85)' }} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold leading-tight line-clamp-2">{user.ubs.nome}</div>
            <div className="font-mono text-[10px] opacity-70 mt-0.5 uppercase tracking-[.04em]">
              Sua unidade
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Desktop: compacto
  return (
    <div className="px-4 py-3.5 border-b border-acs-line flex items-center gap-3">
      <div
        className="w-[38px] h-[38px] rounded-xl bg-acs-azul text-white flex items-center justify-center font-display font-bold text-sm flex-shrink-0"
        aria-hidden="true"
      >
        {user.iniciais}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="font-display font-bold text-acs-ink truncate"
          style={{ fontSize: 14, letterSpacing: '-0.01em' }}
        >
          {user.nome}
        </div>
        <div className="text-[11px] text-acs-ink-3 mt-0.5 truncate">{user.ubs.nome}</div>
      </div>
    </div>
  )
}
