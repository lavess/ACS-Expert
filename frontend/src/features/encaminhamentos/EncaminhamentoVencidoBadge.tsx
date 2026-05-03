import { AlarmClock } from 'lucide-react';

interface Props {
  /** Quantidade de encaminhamentos vencidos (1+ ativa o badge). */
  count?: number;
  /** Dias de atraso — se informado, aparece como sufixo. */
  diasAtraso?: number | null;
  /** Compacta (sem texto, só ícone) — útil em listagens densas. */
  compact?: boolean;
  className?: string;
}

/**
 * Sinaliza encaminhamentos com SLA vencido (status='pendente' e
 * data_prevista < hoje). Usado na lista de pacientes, lista de
 * encaminhamentos e perfil do paciente.
 */
export function EncaminhamentoVencidoBadge({
  count, diasAtraso, compact, className = '',
}: Props) {
  const ativo = (count ?? 1) > 0;
  if (!ativo) return null;

  const label = compact
    ? null
    : count && count > 1
      ? `${count} vencidos`
      : diasAtraso != null && diasAtraso > 0
        ? `Vencido — ${diasAtraso}d`
        : 'Vencido';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-acs-vermelho-100 text-acs-vermelho border border-acs-vermelho/30 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[.1em] ${className}`}
      title="Encaminhamento sem desfecho com data prevista anterior a hoje"
    >
      <AlarmClock size={12} strokeWidth={2.2} />
      {label}
    </span>
  );
}
