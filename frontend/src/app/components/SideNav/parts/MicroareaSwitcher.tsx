import { useEffect, useRef, useState } from 'react'
import { Map, ChevronDown, ChevronUp, Check } from 'lucide-react'
import type { AcsUser, Layout } from '../types'

interface Props {
  user:    AcsUser
  layout:  Layout
  onChange: (microarea: string) => void
}

/**
 * Chip + dropdown inline com a microárea ativa do ACS. Lista todas as
 * microáreas em `user.microareasPossiveis`. Se houver apenas uma, o chip
 * fica não clicável (sem chevron).
 */
export function MicroareaSwitcher({ user, layout, onChange }: Props) {
  const [open, setOpen]   = useState(false)
  const [atual, setAtual] = useState(user.microareaAtual)
  const wrapperRef        = useRef<HTMLDivElement>(null)
  const isMobile = layout === 'mobile'
  const podeTrocar = user.microareasPossiveis.length > 1

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  // Sincroniza estado externo se prop mudar
  useEffect(() => { setAtual(user.microareaAtual) }, [user.microareaAtual])

  function selecionar(m: string) {
    setAtual(m)
    setOpen(false)
    onChange(m)
  }

  return (
    <div
      ref={wrapperRef}
      className={isMobile ? 'px-5 pt-3.5 pb-1' : 'px-3.5 pt-3.5 pb-1'}
    >
      <div className="eyebrow mb-2">Microárea ativa</div>

      <button
        type="button"
        disabled={!podeTrocar}
        aria-haspopup={podeTrocar ? 'listbox' : undefined}
        aria-expanded={podeTrocar ? open : undefined}
        onClick={() => podeTrocar && setOpen((v) => !v)}
        className={`w-full rounded-xl px-3 py-2.5 flex items-center gap-2.5 text-left transition-colors border ${
          open
            ? 'bg-acs-azul-050 border-acs-azul-100'
            : 'bg-white border-acs-line'
        } ${podeTrocar ? '' : 'cursor-default'}`}
      >
        <div
          className="w-8 h-8 rounded-[9px] bg-acs-azul-100 text-acs-azul flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <Map size={15} strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="font-mono font-bold text-acs-ink truncate"
            style={{ fontSize: 14, letterSpacing: '0.01em' }}
          >
            {atual}
          </div>
          {podeTrocar && (
            <div className="text-[11px] text-acs-ink-3 mt-0.5">
              {user.microareasPossiveis.length} microáreas · trocar
            </div>
          )}
        </div>
        {podeTrocar && (
          open
            ? <ChevronUp size={16} className="text-acs-ink-3 flex-shrink-0" />
            : <ChevronDown size={16} className="text-acs-ink-3 flex-shrink-0" />
        )}
      </button>

      {open && podeTrocar && (
        <ul
          role="listbox"
          aria-label="Selecionar microárea"
          className="mt-1.5 bg-white border border-acs-line rounded-xl overflow-hidden max-h-64 overflow-y-auto"
        >
          {user.microareasPossiveis.map((m, i) => {
            const ativa = m === atual
            return (
              <li key={m} role="option" aria-selected={ativa}>
                <button
                  type="button"
                  onClick={() => selecionar(m)}
                  className={`w-full px-3 py-2.5 flex items-center gap-2.5 text-left ${
                    ativa ? 'bg-acs-azul-050' : 'bg-transparent hover:bg-acs-paper'
                  } ${i === 0 ? '' : 'border-t border-acs-line'}`}
                >
                  <span
                    className={`font-mono text-[13px] font-semibold flex-1 truncate ${
                      ativa ? 'text-acs-azul' : 'text-acs-ink'
                    }`}
                  >
                    {m}
                  </span>
                  {ativa && (
                    <Check size={15} className="text-acs-azul flex-shrink-0" strokeWidth={2.6} />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
