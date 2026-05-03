import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'
import type { MobileDrawerProps } from './types'
import { SideNav } from './SideNav'

/**
 * Drawer mobile com overlay, animação, trap de foco, lock de scroll e
 * fechamento por Esc / overlay / botão X / item de navegação clicado.
 *
 * Conteúdo idêntico ao <SideNav layout="mobile" />.
 */
export function MobileDrawer(props: MobileDrawerProps) {
  const {
    open, onClose, variant = '85',
    onNavigate, onShortcut,
    ...rest
  } = props

  const titleId = useId()
  const drawerRef = useRef<HTMLDivElement>(null)
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = original }
  }, [open])

  // Foca botão de fechar ao abrir
  useEffect(() => {
    if (open) closeBtnRef.current?.focus()
  }, [open])

  // Esc fecha + trap de foco
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Tab') {
        const root = drawerRef.current
        if (!root) return
        const focusables = root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last  = focusables[focusables.length - 1]
        const ativo = document.activeElement as HTMLElement | null
        if (e.shiftKey) {
          if (ativo === first || !root.contains(ativo)) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (ativo === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  if (!open) return null

  const widthClass = variant === 'full' ? 'w-full' : 'w-[86%]'
  const radius     = variant === 'full' ? '0' : '22px'

  // Wrappers que disparam o handler do shell e em seguida fecham o drawer.
  const handleNavigate: typeof onNavigate = (id) => { onNavigate(id); onClose() }
  const handleShortcut: typeof onShortcut = (a)  => { onShortcut(a);  onClose() }

  return (
    <>
      <style>{`
        @keyframes acs-drawer-slide {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0); }
        }
        @keyframes acs-drawer-fade {
          from { opacity: 0; } to { opacity: 1; }
        }
      `}</style>

      {/* Overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="fixed inset-0 z-[55] bg-[rgba(8,15,30,.45)] lg:hidden"
        style={{
          backdropFilter: 'blur(2px)',
          animation: 'acs-drawer-fade 200ms ease-out',
        }}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        id="side-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`fixed top-0 bottom-0 left-0 z-[56] ${widthClass} max-w-[420px] lg:hidden flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,.3)]`}
        style={{
          background: 'var(--acs-paper)',
          borderTopRightRadius: radius,
          borderBottomRightRadius: radius,
          animation: 'acs-drawer-slide 250ms cubic-bezier(.32,.72,.22,1)',
        }}
      >
        {/* Botão fechar sobreposto ao hero */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="absolute top-3.5 right-4 z-10 w-9 h-9 rounded-xl flex items-center justify-center text-white border"
          style={{
            background: 'rgba(255,255,255,.16)',
            borderColor: 'rgba(255,255,255,.22)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        <SideNav
          {...rest}
          onNavigate={handleNavigate}
          onShortcut={handleShortcut}
          layout="mobile"
          titleId={titleId}
        />
      </div>
    </>
  )
}
