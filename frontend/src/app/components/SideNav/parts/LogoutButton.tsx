import { useState } from 'react'
import { LogOut, AlertTriangle } from 'lucide-react'
import type { Layout } from '../types'

interface Props {
  layout:   Layout
  onLogout: () => void
}

/**
 * Botão de sair com diálogo de confirmação. Texto em vermelho-700.
 */
export function LogoutButton({ layout, onLogout }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const isMobile = layout === 'mobile'

  return (
    <div className={isMobile ? 'px-5 pt-2 pb-4' : 'px-3.5 pt-1.5 pb-3.5'}>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="w-full flex items-center justify-center gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-[13px] font-semibold transition-colors hover:bg-acs-vermelho-100"
        style={{
          borderColor: 'var(--acs-line-strong)',
          color: 'var(--acs-vermelho-700)',
          letterSpacing: '-0.005em',
        }}
      >
        <LogOut size={15} strokeWidth={2.2} />
        Sair da conta
      </button>

      {confirmando && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-confirm-title"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 lg:items-center"
          onClick={() => setConfirmando(false)}
        >
          <div
            className="w-full max-w-[420px] bg-white rounded-t-3xl lg:rounded-3xl lg:mb-0 p-5 shadow-[0_-8px_24px_rgba(10,20,40,.18)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl bg-acs-vermelho-100 flex items-center justify-center flex-shrink-0"
                aria-hidden="true"
              >
                <AlertTriangle size={18} className="text-acs-vermelho" strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  id="logout-confirm-title"
                  className="font-display font-bold text-acs-ink"
                  style={{ fontSize: 16, letterSpacing: '-0.01em' }}
                >
                  Sair da conta?
                </h3>
                <p className="text-sm text-acs-ink-2 mt-1">
                  Você precisará fazer login novamente para retornar.
                </p>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmando(false)}
                className="flex-1 py-2.5 bg-white text-acs-ink rounded-xl font-semibold border border-acs-line-strong hover:bg-acs-paper transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => { setConfirmando(false); onLogout() }}
                className="flex-1 py-2.5 bg-acs-vermelho text-white rounded-xl font-semibold hover:brightness-95 transition-colors text-sm"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
