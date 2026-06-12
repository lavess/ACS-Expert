import {
  ArrowLeft, Search, X, AlertCircle, Check, SlidersHorizontal,
  Trash2, ChevronLeft,
  // Group icons
  Thermometer, Brain, HeadsetIcon, Eye, Ear, HeartPulse,
  Wind, Salad, Droplets, Baby, Bone, Sparkles,
} from 'lucide-react';
import { useNavigate, useParams, Navigate } from 'react-router';
import { useMemo, useState, useCallback } from 'react';
import { useTriagemStore } from '@/store/triagemStore';
import type { SintomaCatalogo } from '@/services/triagensService';

/* ── Constants ─────────────────────────────────────────────── */

const GROUP_ORDER = [
  'Sintomas Gerais',
  'Saúde Mental',
  'Neurológico e Cabeça',
  'Visão e Olhos',
  'Ouvido, Nariz e Garganta (Otorrino)',
  'Cardiovascular',
  'Respiratório',
  'Digestivo e Abdominal',
  'Urinário e Renal',
  'Genital e Reprodutivo',
  'Músculos e Articulações',
  'Pele e Cabelos',
];

const GROUP_ICONS: Record<string, React.ElementType> = {
  'Sintomas Gerais':                       Thermometer,
  'Saúde Mental':                          Brain,
  'Neurológico e Cabeça':                  HeadsetIcon,
  'Visão e Olhos':                         Eye,
  'Ouvido, Nariz e Garganta (Otorrino)':   Ear,
  'Cardiovascular':                        HeartPulse,
  'Respiratório':                          Wind,
  'Digestivo e Abdominal':                 Salad,
  'Urinário e Renal':                      Droplets,
  'Genital e Reprodutivo':                 Baby,
  'Músculos e Articulações':               Bone,
  'Pele e Cabelos':                        Sparkles,
};

const INTENSITY_LEVELS = [
  { key: 'leve',     level: 3,  label: 'Leve',     hint: 'Incomoda, mas segue a rotina',    color: 'var(--acs-verde)' },
  { key: 'moderado', level: 6,  label: 'Moderado', hint: 'Atrapalha atividades diárias',    color: 'var(--acs-amar)' },
  { key: 'forte',    level: 8,  label: 'Forte',    hint: 'Impede tarefas do dia a dia',     color: 'var(--acs-coral)' },
  { key: 'severo',   level: 10, label: 'Severo',   hint: 'Sintoma insuportável',            color: 'var(--acs-vermelho)' },
];

/* ── Helpers ───────────────────────────────────────────────── */

function severityColor(intensity: number): string {
  if (intensity <= 3)  return 'var(--acs-verde)';
  if (intensity <= 6)  return 'var(--acs-amar)';
  if (intensity <= 8)  return 'var(--acs-coral)';
  return 'var(--acs-vermelho)';
}

function intensityLabel(intensity: number): string {
  if (intensity <= 3)  return 'Leve';
  if (intensity <= 6)  return 'Moderado';
  if (intensity <= 8)  return 'Forte';
  return 'Severo';
}

/* ── SintomaRow (outside component to prevent focus loss) ── */

interface SintomaRowProps {
  sintoma: SintomaCatalogo;
  ativo: boolean;
  intensity: number;
  onToggle: () => void;
  onOpenSheet: () => void;
}

function SintomaRow({ sintoma, ativo, intensity, onToggle, onOpenSheet }: SintomaRowProps) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-colors ${
        ativo
          ? 'bg-acs-azul-050 border-acs-azul-100'
          : 'bg-white border-acs-line'
      }`}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-[22px] h-[22px] rounded-[7px] flex items-center justify-center flex-shrink-0 transition-colors ${
          ativo
            ? 'bg-acs-azul'
            : 'bg-white border-2 border-acs-line-strong'
        }`}
      >
        {ativo && <Check size={14} strokeWidth={2.5} className="text-white" />}
      </button>

      {/* Label + severity dot + intensity */}
      <button
        type="button"
        onClick={onOpenSheet}
        className="flex-1 flex items-center gap-2 min-w-0 text-left"
      >
        <span className="text-sm font-medium text-acs-ink truncate">
          {sintoma.label}
        </span>
        {ativo && (
          <>
            <span
              className="w-[5px] h-[5px] rounded-full flex-shrink-0"
              style={{ backgroundColor: severityColor(intensity) }}
            />
            <span className="font-mono text-[11px] text-acs-ink-3 flex-shrink-0">
              {intensityLabel(intensity)}
            </span>
          </>
        )}
      </button>

      {/* Sliders icon when active */}
      {ativo && (
        <button
          type="button"
          onClick={onOpenSheet}
          className="flex-shrink-0 text-acs-azul"
        >
          <SlidersHorizontal size={18} strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}

/* ── Main Component ────────────────────────────────────────── */

export function TriagemPasso2() {
  const navigate = useNavigate();
  const { pacienteId } = useParams();
  const {
    paciente, catalogo, sintomas, qualifiers, triagemConcluida,
    toggleSintoma, setIntensidade, toggleQualifier,
  } = useTriagemStore();

  const [busca, setBusca]             = useState('');
  const [grupoAtivo, setGrupoAtivo]   = useState<string | null>(null);
  const [sheetSintoma, setSheetSintoma] = useState<string | null>(null);

  /* Guard: triagem concluida — redireciona p/ perfil sem flash */
  if (triagemConcluida && pacienteId) {
    return <Navigate to={`/paciente/${pacienteId}`} replace />;
  }

  /* Guard clause */
  if (!paciente || !catalogo) {
    return (
      <div className="h-full flex flex-col p-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-acs-ink mb-6">
          <ArrowLeft size={20} /> Voltar
        </button>
        <div className="flex items-start gap-3 bg-acs-amar-100 border border-acs-amar/20 rounded-xl p-4">
          <AlertCircle size={18} className="text-[#A3740A] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#A3740A]">
            Triagem não iniciada. Volte e inicie pelo passo 1.
          </p>
        </div>
      </div>
    );
  }

  /* Derived data */
  const sintomasVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return catalogo.sintomas.filter((s) => {
      if (s.sexFilter && s.sexFilter !== paciente.sexo) return false;
      if (termo && !s.label.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [catalogo.sintomas, busca, paciente.sexo]);

  const sintomasPorGrupo = useMemo(() => {
    const mapa = new Map<string, SintomaCatalogo[]>();
    for (const s of sintomasVisiveis) {
      const g = s.group ?? 'Outros';
      if (!mapa.has(g)) mapa.set(g, []);
      mapa.get(g)!.push(s);
    }
    return mapa;
  }, [sintomasVisiveis]);

  const idsSelecionados = Object.keys(sintomas);

  const sintomasMarcados = useMemo(() => {
    return catalogo.sintomas.filter((s) => sintomas[s.id]);
  }, [catalogo.sintomas, sintomas]);

  /* Count selections per group */
  const groupSelectionCount = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of catalogo.sintomas) {
      if (sintomas[s.id]) {
        const g = s.group ?? 'Outros';
        counts[g] = (counts[g] ?? 0) + 1;
      }
    }
    return counts;
  }, [catalogo.sintomas, sintomas]);

  /* Sheet sintoma data */
  const sheetSintomaData = sheetSintoma
    ? catalogo.sintomas.find((s) => s.id === sheetSintoma)
    : null;

  const isSearchActive = busca.trim().length > 0;
  const isGroupDrilldown = grupoAtivo !== null && !isSearchActive;

  /* Handlers */
  const handleOpenSheet = useCallback((id: string) => {
    setSheetSintoma(id);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setSheetSintoma(null);
  }, []);

  const handleMarkFromSheet = useCallback(() => {
    if (sheetSintoma && !sintomas[sheetSintoma]) {
      toggleSintoma(sheetSintoma);
    }
  }, [sheetSintoma, sintomas, toggleSintoma]);

  const handleRemoveFromSheet = useCallback(() => {
    if (sheetSintoma && sintomas[sheetSintoma]) {
      toggleSintoma(sheetSintoma);
      setSheetSintoma(null);
    }
  }, [sheetSintoma, sintomas, toggleSintoma]);

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div className="h-full flex flex-col bg-acs-paper">
      {/* Header */}
      <div className="bg-white border-b border-acs-line px-6 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-1.5 bg-acs-azul rounded-full" />
          <div className="flex-1 h-1.5 bg-acs-azul rounded-full" />
          <div className="flex-1 h-1.5 bg-acs-paper-2 rounded-full" />
        </div>
        <p className="eyebrow mb-1">2 de 3</p>
        <h2 className="font-display font-bold text-lg text-acs-ink">Sintomas observados</h2>
        <p className="text-sm text-acs-ink-3 mt-0.5">
          {paciente.nome}
          {idsSelecionados.length > 0 && (
            <span> &middot; {idsSelecionados.length} sintoma{idsSelecionados.length === 1 ? '' : 's'}</span>
          )}
        </p>
      </div>

      {/* Search bar — sticky */}
      <div className="sticky top-0 z-10 bg-white border-b border-acs-line px-6 py-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-acs-ink-3" />
          <input
            type="text"
            placeholder="Buscar sintoma..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setGrupoAtivo(null); }}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-acs-line bg-white text-acs-ink placeholder:text-acs-ink-4 focus:outline-none focus:ring-2 focus:ring-acs-azul text-sm"
          />
          {busca.length > 0 && (
            <button
              type="button"
              onClick={() => setBusca('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-acs-ink-3"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-6 py-4 pb-28 space-y-5">

        {/* Mode A: Search active — flat list */}
        {isSearchActive && (
          <>
            {sintomasVisiveis.length > 0 ? (
              <div className="space-y-2">
                {sintomasVisiveis.map((s) => (
                  <SintomaRow
                    key={s.id}
                    sintoma={s}
                    ativo={Boolean(sintomas[s.id])}
                    intensity={sintomas[s.id]?.intensity ?? 5}
                    onToggle={() => toggleSintoma(s.id)}
                    onOpenSheet={() => handleOpenSheet(s.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-center text-acs-ink-3 text-sm py-8">
                Nenhum sintoma encontrado para &ldquo;{busca}&rdquo;.
              </p>
            )}
          </>
        )}

        {/* Mode C: Group drilldown */}
        {isGroupDrilldown && (
          <>
            <button
              type="button"
              onClick={() => setGrupoAtivo(null)}
              className="flex items-center gap-1 text-sm font-medium text-acs-azul"
            >
              <ChevronLeft size={16} /> Voltar
            </button>
            <h3 className="font-display font-semibold text-acs-ink">{grupoAtivo}</h3>
            <div className="space-y-2">
              {(sintomasPorGrupo.get(grupoAtivo!) ?? []).map((s) => (
                <SintomaRow
                  key={s.id}
                  sintoma={s}
                  ativo={Boolean(sintomas[s.id])}
                  intensity={sintomas[s.id]?.intensity ?? 5}
                  onToggle={() => toggleSintoma(s.id)}
                  onOpenSheet={() => handleOpenSheet(s.id)}
                />
              ))}
            </div>
          </>
        )}

        {/* Mode B: Default view */}
        {!isSearchActive && !isGroupDrilldown && (
          <>
            {/* Marcados section */}
            {sintomasMarcados.length > 0 && (
              <div>
                <p className="eyebrow mb-2">Marcados</p>
                <div className="space-y-2">
                  {sintomasMarcados.map((s) => (
                    <SintomaRow
                      key={s.id}
                      sintoma={s}
                      ativo
                      intensity={sintomas[s.id]?.intensity ?? 5}
                      onToggle={() => toggleSintoma(s.id)}
                      onOpenSheet={() => handleOpenSheet(s.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Por area section */}
            <div>
              <p className="eyebrow mb-2">Por area</p>
              <div className="grid grid-cols-4 gap-2">
                {GROUP_ORDER.filter((g) => sintomasPorGrupo.has(g)).map((grupo) => {
                  const Icon = GROUP_ICONS[grupo] ?? Thermometer;
                  const count = groupSelectionCount[grupo] ?? 0;
                  return (
                    <button
                      key={grupo}
                      type="button"
                      onClick={() => setGrupoAtivo(grupo)}
                      className="relative flex flex-col items-center gap-1.5 bg-white rounded-2xl border border-acs-line p-3 hover:border-acs-azul-300 transition-colors"
                    >
                      <div className="w-[34px] h-[34px] rounded-[10px] bg-acs-paper-2 flex items-center justify-center">
                        <Icon size={17} strokeWidth={2} className="text-acs-ink-2" />
                      </div>
                      <span className="text-[11px] font-semibold leading-tight text-acs-ink-2 text-center line-clamp-2">
                        {grupo.replace(' e ', ' e\u00A0')}
                      </span>
                      {count > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-acs-coral text-white text-[10px] font-mono font-bold px-1 border-2 border-acs-paper">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-acs-line p-4 max-w-[800px] mx-auto flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-11 h-11 flex items-center justify-center rounded-xl border border-acs-line text-acs-ink"
        >
          <ArrowLeft size={20} />
        </button>
        <button
          type="button"
          onClick={() => navigate(`/triagem/${paciente.id}/resultado`)}
          disabled={idsSelecionados.length === 0}
          className="flex-1 py-3 bg-acs-azul text-white rounded-xl font-semibold hover:bg-acs-azul-900 transition-colors disabled:bg-acs-paper-2 disabled:text-acs-ink-3 disabled:cursor-not-allowed text-sm"
        >
          Avaliar triagem{idsSelecionados.length > 0 ? ` \u00B7 ${idsSelecionados.length}` : ''}
        </button>
      </div>

      {/* Bottom Sheet — intensity + qualifiers */}
      {sheetSintoma && sheetSintomaData && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={handleCloseSheet}
          />

          {/* Sheet */}
          <div className="fixed inset-x-0 bottom-0 z-50 max-w-[800px] mx-auto animate-in slide-in-from-bottom duration-300">
            <div className="bg-white rounded-t-[22px] max-h-[85vh] flex flex-col">
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-acs-paper-2" />
              </div>

              {/* Title bar */}
              <div className="flex items-center justify-between px-6 py-2">
                <h3 className="font-display font-semibold text-acs-ink text-base">
                  {sheetSintomaData.label}
                </h3>
                <button type="button" onClick={handleCloseSheet} className="text-acs-ink-3">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-5">

                {/* If not yet selected: Mark button */}
                {!sintomas[sheetSintoma] && (
                  <button
                    type="button"
                    onClick={handleMarkFromSheet}
                    className="w-full py-3 bg-acs-azul text-white rounded-xl font-semibold text-sm"
                  >
                    Marcar este sintoma
                  </button>
                )}

                {/* If selected: intensity buttons */}
                {sintomas[sheetSintoma] && (
                  <>
                    <div>
                      <p className="text-sm font-medium text-acs-ink mb-2">Intensidade</p>
                      <div className="grid grid-cols-2 gap-2">
                        {INTENSITY_LEVELS.map((il) => {
                          const active = sintomas[sheetSintoma]?.intensity === il.level;
                          return (
                            <button
                              key={il.key}
                              type="button"
                              onClick={() => setIntensidade(sheetSintoma, il.level)}
                              className={`flex flex-col items-start gap-0.5 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                                active
                                  ? 'text-white border-transparent'
                                  : 'bg-white border-acs-line text-acs-ink'
                              }`}
                              style={active ? { backgroundColor: il.color } : undefined}
                            >
                              <span className="text-sm font-semibold">{il.label}</span>
                              <span className={`font-mono text-[11px] ${active ? 'text-white/80' : 'text-acs-ink-3'}`}>
                                {il.level}/10
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-xs text-acs-ink-3 mt-2">
                        {INTENSITY_LEVELS.find((il) => il.level === sintomas[sheetSintoma]?.intensity)?.hint ?? 'Selecione a intensidade do sintoma.'}
                      </p>
                    </div>

                    {/* Qualifiers */}
                    {catalogo.qualificadores[sheetSintoma]?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-acs-ink mb-2">Detalhes</p>
                        <div className="space-y-2">
                          {catalogo.qualificadores[sheetSintoma]
                            .filter((q) => !q.sex || q.sex === paciente.sexo)
                            .map((q) => {
                              const checked = qualifiers[sheetSintoma]?.[q.id] ?? false;
                              return (
                                <button
                                  key={q.id}
                                  type="button"
                                  onClick={() => toggleQualifier(sheetSintoma, q.id)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm transition-colors ${
                                    checked
                                      ? 'bg-acs-azul-050 border-acs-azul-100 text-acs-ink'
                                      : 'bg-white border-acs-line text-acs-ink'
                                  }`}
                                >
                                  <div
                                    className={`w-[20px] h-[20px] rounded-[6px] flex items-center justify-center flex-shrink-0 ${
                                      checked ? 'bg-acs-azul' : 'border-2 border-acs-line-strong bg-white'
                                    }`}
                                  >
                                    {checked && <Check size={12} strokeWidth={2.5} className="text-white" />}
                                  </div>
                                  <span>{q.label}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* Remove symptom */}
                    <button
                      type="button"
                      onClick={handleRemoveFromSheet}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-acs-vermelho-100 text-acs-vermelho rounded-xl font-medium text-sm"
                    >
                      <Trash2 size={16} />
                      Remover sintoma
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
