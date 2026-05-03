import { useEffect, useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, XCircle, Ban } from 'lucide-react';
import {
  encaminhamentosService,
  TIPO_ENCAMINHAMENTO_LABEL,
  type EncaminhamentoAPI,
  type StatusDesfecho,
} from '@/services/encaminhamentosService';

const OPCOES: { id: StatusDesfecho; label: string; icon: React.ElementType; color: string; help: string }[] = [
  {
    id: 'realizado',
    label: 'Realizado',
    icon: CheckCircle2,
    color: 'var(--acs-verde)',
    help: 'Paciente compareceu e o encaminhamento foi concluído.',
  },
  {
    id: 'ausencia',
    label: 'Ausência',
    icon: XCircle,
    color: 'var(--acs-vermelho)',
    help: 'Paciente não compareceu — um alerta será gerado para busca ativa.',
  },
  {
    id: 'cancelado',
    label: 'Cancelado',
    icon: Ban,
    color: 'var(--acs-ink-3)',
    help: 'Encaminhamento não é mais necessário ou foi remarcado fora do app.',
  },
];

interface Props {
  encaminhamento: EncaminhamentoAPI | null;
  onClose:        () => void;
  onSuccess?:     (atualizado: EncaminhamentoAPI) => void;
}

export function RegistrarDesfechoSheet({ encaminhamento, onClose, onSuccess }: Props) {
  const open = !!encaminhamento;

  const [status, setStatus]       = useState<StatusDesfecho>('realizado');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando]   = useState(false);
  const [erro, setErro]           = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStatus('realizado');
    setObservacao('');
    setErro(null);
  }, [open, encaminhamento?.id]);

  if (!open || !encaminhamento) return null;

  async function handleSalvar() {
    if (!encaminhamento) return;
    setSalvando(true);
    setErro(null);
    try {
      const { data } = await encaminhamentosService.registrarDesfecho(encaminhamento.id, {
        status,
        observacao_desfecho: observacao.trim() || undefined,
      });
      onSuccess?.(data);
    } catch (err: any) {
      setErro(err?.response?.data?.message ?? 'Erro ao registrar desfecho.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[800px] bg-white rounded-t-3xl lg:rounded-3xl lg:mb-8 max-h-[90vh] overflow-y-auto shadow-[0_-8px_24px_rgba(10,20,40,.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <span className="w-10 h-1 rounded-full bg-acs-paper-2" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-3 pb-4 border-b border-acs-line">
          <div className="min-w-0 pr-4">
            <p className="eyebrow">Registrar desfecho</p>
            <h3 className="font-display font-bold text-acs-ink truncate">
              {encaminhamento.paciente_nome ?? `Paciente #${encaminhamento.paciente_id}`}
            </h3>
            <p className="text-xs text-acs-ink-3 mt-0.5">
              {TIPO_ENCAMINHAMENTO_LABEL[encaminhamento.tipo]}
              {encaminhamento.unidade_saude_nome ? ` · ${encaminhamento.unidade_saude_nome}` : ''}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fechar" className="p-1 -mr-1">
            <X size={22} className="text-acs-ink-3" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Opções */}
          <div className="space-y-2">
            {OPCOES.map((op) => {
              const ativo = status === op.id;
              const Icon = op.icon;
              return (
                <button
                  key={op.id}
                  onClick={() => setStatus(op.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-colors ${
                    ativo ? 'border-acs-azul bg-acs-azul-050' : 'border-acs-line bg-white hover:border-acs-azul-300'
                  }`}
                >
                  <Icon size={20} strokeWidth={ativo ? 2.2 : 1.8} style={{ color: op.color }} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${ativo ? 'font-semibold text-acs-ink' : 'font-medium text-acs-ink-2'}`}>
                      {op.label}
                    </p>
                    <p className="text-xs text-acs-ink-3 mt-0.5">{op.help}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Observação */}
          <div>
            <label className="eyebrow mb-2 block" htmlFor="desf-obs">
              Observação (opcional)
            </label>
            <textarea
              id="desf-obs"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              placeholder="Ex.: Paciente foi reagendado para a próxima semana."
              className="w-full px-3 py-2.5 rounded-xl border border-acs-line text-sm text-acs-ink placeholder:text-acs-ink-4 focus:outline-none focus:border-acs-azul resize-none"
            />
          </div>

          {erro && (
            <div className="flex items-start gap-2 bg-acs-vermelho-100 border border-acs-vermelho/30 rounded-xl p-3">
              <AlertCircle size={16} className="text-acs-vermelho flex-shrink-0 mt-0.5" />
              <p className="text-sm text-acs-vermelho">{erro}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={salvando}
              className="flex-1 py-3 bg-white text-acs-azul rounded-xl font-semibold border border-acs-azul hover:bg-acs-azul-050 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando}
              className="flex-1 py-3 bg-acs-coral text-white rounded-xl font-semibold hover:brightness-95 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(231,111,74,.3)]"
            >
              {salvando ? <Loader2 size={18} className="animate-spin" /> : null}
              {salvando ? 'Registrando…' : 'Registrar desfecho'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
