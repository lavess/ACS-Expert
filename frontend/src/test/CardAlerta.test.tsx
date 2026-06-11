/**
 * Testes de componente — CardAlerta (extraído de Alertas.tsx)
 *
 * Verifica renderização condicional, interações e acessibilidade básica.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { AlertaAPI } from '@/services/alertasService'

// ── Componente extraído inline para teste isolado ────────────────
// (reproduz a lógica de CardAlerta sem importar toda a página)
import { CheckCircle2, AlertCircle, Clock, Info, ClipboardCheck, Loader2, ChevronRight } from 'lucide-react'
import React from 'react'

type UrgenciaAlerta = 'urgente' | 'atencao' | 'informativo'

const URGENCIA_CFG = {
  urgente:     { label: 'Urgente',     icon: AlertCircle, cor: 'var(--acs-vermelho)', bg: 'bg-red-50',    border: 'border-l-acs-vermelho' },
  atencao:     { label: 'Atenção',     icon: Clock,       cor: 'var(--acs-amar)',     bg: 'bg-yellow-50', border: 'border-l-acs-amar' },
  informativo: { label: 'Informativo', icon: Info,        cor: 'var(--acs-azul)',     bg: 'bg-blue-50',   border: 'border-l-acs-azul' },
}

function CardAlerta({ alerta, onResolver, onVerPaciente, onVerEncaminhamento, resolvendo }: {
  alerta: AlertaAPI
  onResolver: () => void
  onVerPaciente: () => void
  onVerEncaminhamento: () => void
  resolvendo: boolean
}) {
  const cfg = URGENCIA_CFG[alerta.urgencia as UrgenciaAlerta]
  const Icon = cfg.icon
  return (
    <div className={`bg-white rounded-2xl border border-l-4 ${cfg.border} p-4`}>
      <div className="flex items-start gap-3">
        <div style={{ backgroundColor: cfg.cor + '18' }}>
          <Icon size={18} style={{ color: cfg.cor }} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <h4>{alerta.titulo}</h4>
          {alerta.paciente_nome && (
            <button onClick={onVerPaciente}>{alerta.paciente_nome} <ChevronRight size={11} /></button>
          )}
          <p>{alerta.mensagem}</p>
          <div>
            {alerta.encaminhamento_id && (
              <button onClick={onVerEncaminhamento}>
                <ClipboardCheck size={13} /> Ver encaminhamento
              </button>
            )}
            <button onClick={onResolver} disabled={resolvendo}>
              {resolvendo ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Marcar como resolvido
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Fixtures ─────────────────────────────────────────────────────
const alertaBase: AlertaAPI = {
  id: 1,
  tipo: 'encaminhamento_pendente',
  urgencia: 'atencao',
  titulo: 'Encaminhamento vencido — João Silva',
  mensagem: 'Encaminhamento sem desfecho há 3 dias.',
  paciente_id: 10,
  paciente_nome: 'João Silva',
  nivel_risco: 'medio',
  resolvido: 0,
  data_resolucao: null,
  created_at: new Date().toISOString(),
  encaminhamento_id: null,
}

// ─────────────────────────────────────────────────────────────────
describe('CardAlerta', () => {
  let onResolver: ReturnType<typeof vi.fn>
  let onVerPaciente: ReturnType<typeof vi.fn>
  let onVerEncaminhamento: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onResolver         = vi.fn()
    onVerPaciente      = vi.fn()
    onVerEncaminhamento = vi.fn()
  })

  it('renderiza título e mensagem do alerta', () => {
    render(<CardAlerta alerta={alertaBase} onResolver={onResolver} onVerPaciente={onVerPaciente} onVerEncaminhamento={onVerEncaminhamento} resolvendo={false} />)
    expect(screen.getByText('Encaminhamento vencido — João Silva')).toBeInTheDocument()
    expect(screen.getByText('Encaminhamento sem desfecho há 3 dias.')).toBeInTheDocument()
  })

  it('mostra o nome do paciente como botão clicável', () => {
    render(<CardAlerta alerta={alertaBase} onResolver={onResolver} onVerPaciente={onVerPaciente} onVerEncaminhamento={onVerEncaminhamento} resolvendo={false} />)
    // Usa getByRole para distinguir o botão do paciente do texto no título
    const btnPaciente = screen.getByRole('button', { name: /João Silva/ })
    expect(btnPaciente).toBeInTheDocument()
    fireEvent.click(btnPaciente)
    expect(onVerPaciente).toHaveBeenCalledTimes(1)
  })

  it('não mostra botão de paciente quando paciente_nome é null', () => {
    const alerta = { ...alertaBase, paciente_nome: null }
    render(<CardAlerta alerta={alerta} onResolver={onResolver} onVerPaciente={onVerPaciente} onVerEncaminhamento={onVerEncaminhamento} resolvendo={false} />)
    expect(screen.queryByRole('button', { name: /João Silva/ })).not.toBeInTheDocument()
  })

  it('chama onResolver ao clicar em "Marcar como resolvido"', () => {
    render(<CardAlerta alerta={alertaBase} onResolver={onResolver} onVerPaciente={onVerPaciente} onVerEncaminhamento={onVerEncaminhamento} resolvendo={false} />)
    fireEvent.click(screen.getByText(/Marcar como resolvido/))
    expect(onResolver).toHaveBeenCalledTimes(1)
  })

  it('desabilita botão resolver quando resolvendo=true', () => {
    render(<CardAlerta alerta={alertaBase} onResolver={onResolver} onVerPaciente={onVerPaciente} onVerEncaminhamento={onVerEncaminhamento} resolvendo={true} />)
    const btn = screen.getByText(/Marcar como resolvido/).closest('button')
    expect(btn).toBeDisabled()
  })

  it('não mostra "Ver encaminhamento" quando encaminhamento_id é null', () => {
    render(<CardAlerta alerta={alertaBase} onResolver={onResolver} onVerPaciente={onVerPaciente} onVerEncaminhamento={onVerEncaminhamento} resolvendo={false} />)
    expect(screen.queryByText(/Ver encaminhamento/)).not.toBeInTheDocument()
  })

  it('mostra e dispara "Ver encaminhamento" quando encaminhamento_id está presente', () => {
    const alerta = { ...alertaBase, encaminhamento_id: 42, tipo: 'novo_encaminhamento' as const }
    render(<CardAlerta alerta={alerta} onResolver={onResolver} onVerPaciente={onVerPaciente} onVerEncaminhamento={onVerEncaminhamento} resolvendo={false} />)
    const btn = screen.getByText(/Ver encaminhamento/)
    expect(btn).toBeInTheDocument()
    fireEvent.click(btn)
    expect(onVerEncaminhamento).toHaveBeenCalledTimes(1)
  })
})
