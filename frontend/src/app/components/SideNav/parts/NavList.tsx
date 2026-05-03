import type { Layout, NavId, NavItem } from '../types'

interface Props {
  items:    NavItem[]
  layout:   Layout
  current?: NavId
  onPick:   (id: NavId) => void
  heading?: string
}

function formatBadge(b: number | string) {
  if (typeof b === 'number') return b > 99 ? '99+' : String(b)
  return b
}

export function NavList({ items, layout, current, onPick, heading }: Props) {
  const isMobile = layout === 'mobile'

  return (
    <div className={isMobile ? 'px-3.5 pt-3 pb-2' : 'px-2 pt-2.5 pb-2'}>
      {heading && (
        <div className={`eyebrow ${isMobile ? 'px-2 pb-2' : 'px-1.5 pb-2'}`}>{heading}</div>
      )}
      <nav className="flex flex-col gap-0.5">
        {items.map((it) => {
          const ativo = current === it.id
          const Icon  = it.icon
          return (
            <button
              type="button"
              key={it.id}
              onClick={() => onPick(it.id)}
              aria-current={ativo ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-[10px] border-0 text-left transition-colors ${
                isMobile ? 'px-2.5 py-2.5' : 'px-2.5 py-2'
              } ${ativo ? 'bg-acs-azul text-white' : 'bg-transparent text-acs-ink hover:bg-acs-paper'}`}
            >
              <Icon
                size={isMobile ? 18 : 17}
                strokeWidth={2.2}
                className={ativo ? 'text-white' : 'text-acs-ink-2'}
              />
              <span
                className={`flex-1 ${
                  isMobile ? 'text-sm' : 'text-[13px]'
                } ${ativo ? 'font-semibold' : 'font-medium'}`}
                style={{ letterSpacing: '-0.005em' }}
              >
                {it.label}
              </span>
              {it.badge != null && (
                <span
                  aria-label={
                    it.urgent && typeof it.badge === 'number'
                      ? `${it.badge} ${it.id === 'alertas' ? 'alertas pendentes' : 'pendentes'}`
                      : undefined
                  }
                  className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full font-mono text-[11px] font-bold ${
                    it.urgent
                      ? 'bg-acs-coral text-white'
                      : ativo
                        ? 'bg-white/20 text-white'
                        : 'bg-acs-paper-2 text-acs-ink-2'
                  }`}
                  style={{ letterSpacing: '0.02em' }}
                >
                  {formatBadge(it.badge)}
                </span>
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
