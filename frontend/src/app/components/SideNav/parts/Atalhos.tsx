import { ClipboardCheck, UserPlus } from 'lucide-react'
import type { Layout } from '../types'

interface Props {
  layout:    Layout
  onAction:  (a: 'triagem' | 'cadastro') => void
}

const TONES = {
  coral: {
    bg:   'bg-acs-coral-100',
    icBg: 'bg-acs-coral',
    text: 'text-acs-coral-700',
  },
  azul: {
    bg:   'bg-acs-azul-050',
    icBg: 'bg-acs-azul',
    text: 'text-acs-azul',
  },
} as const

interface CardProps {
  icon:    React.ElementType
  label:   string
  tone:    keyof typeof TONES
  onClick: () => void
}

function ShortcutCard({ icon: Icon, label, tone, onClick }: CardProps) {
  const t = TONES[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-2 text-left rounded-2xl px-3 pt-3 pb-3.5 transition-transform active:scale-[.98] ${t.bg}`}
    >
      <div
        className={`w-8 h-8 rounded-[10px] text-white flex items-center justify-center ${t.icBg}`}
        aria-hidden="true"
      >
        <Icon size={16} strokeWidth={2.2} />
      </div>
      <div
        className={`text-[13px] font-bold leading-tight ${t.text}`}
        style={{ letterSpacing: '-0.01em' }}
      >
        {label}
      </div>
    </button>
  )
}

export function Atalhos({ layout, onAction }: Props) {
  const isMobile = layout === 'mobile'
  return (
    <div className={isMobile ? 'px-5 pt-3.5 pb-2' : 'px-3.5 pt-3 pb-1.5'}>
      <div className="eyebrow mb-2">Atalhos</div>
      <div className="grid grid-cols-2 gap-2">
        <ShortcutCard
          icon={ClipboardCheck}
          label="Nova triagem"
          tone="coral"
          onClick={() => onAction('triagem')}
        />
        <ShortcutCard
          icon={UserPlus}
          label="Cadastrar paciente"
          tone="azul"
          onClick={() => onAction('cadastro')}
        />
      </div>
    </div>
  )
}
