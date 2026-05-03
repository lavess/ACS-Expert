import type { Layout } from '../types'

interface Props {
  layout: Layout
  data: {
    visitas:  number
    triagens: number
    alertas:  number
  }
}

interface StatProps {
  n:     number
  label: string
  tone?: 'coral' | 'ink'
}

function Stat({ n, label, tone = 'ink' }: StatProps) {
  return (
    <div>
      <div
        className={`font-display font-bold leading-none ${
          tone === 'coral' ? 'text-acs-coral' : 'text-acs-ink'
        }`}
        style={{ fontSize: 22, letterSpacing: '-0.025em' }}
      >
        {n}
      </div>
      <div className="eyebrow mt-0.5">{label}</div>
    </div>
  )
}

export function StatsBlock({ layout, data }: Props) {
  const isMobile = layout === 'mobile'
  return (
    <div
      className={
        isMobile
          ? 'mx-5 my-3 p-3.5 bg-white border border-acs-line rounded-2xl'
          : 'mx-3.5 my-2.5 p-3.5 bg-acs-paper-2 rounded-xl'
      }
    >
      <div className="eyebrow mb-2">Sua semana</div>
      <div className="grid grid-cols-3 gap-2.5">
        <Stat n={data.visitas}  label="Visitas"  />
        <Stat n={data.triagens} label="Triagens" />
        <Stat n={data.alertas}  label="Alertas"  tone="coral" />
      </div>
    </div>
  )
}
