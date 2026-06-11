import { ArrowLeft, Loader2, AlertCircle, Check, User, Home, Heart, Stethoscope, ArrowRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { pacientesService, type CriarPacientePayload, type PacienteListagem } from '@/services/pacientesService';
import { microareasService, type MicroareaAPI } from '@/services/usuariosService';
import type { Comorbidade, Sexo } from '@/types';

const COMORBIDADES: { id: Comorbidade; label: string }[] = [
  { id: 'hipertenso',     label: 'Hipertenso(a)' },
  { id: 'diabetico',      label: 'Diabético(a)' },
  { id: 'obeso',          label: 'Obeso(a)' },
  { id: 'fumante',        label: 'Fumante' },
  { id: 'asmatico',       label: 'Asmático(a)' },
  { id: 'cardiopata',     label: 'Cardiopata' },
  { id: 'dpoc',           label: 'DPOC' },
  { id: 'gestante',       label: 'Gestante' },
  { id: 'imunossuprimido',label: 'Imunossuprimido(a)' },
];

const STEPS = [
  { title: 'Identificacao', label: 'Identificacao', desc: 'Dados pessoais do paciente', icon: User },
  { title: 'Endereco', label: 'Endereco', desc: 'Endereco e localizacao', icon: Home },
  { title: 'Contexto social', label: 'Contexto social', desc: 'Situacao social e vulnerabilidades', icon: Heart },
  { title: 'Saude', label: 'Saude', desc: 'Comorbidades e condicoes de saude', icon: Stethoscope },
];

const SOCIAL_FLAGS = [
  { key: 'idosoMoraSozinho',      title: 'Idoso que mora sozinho',               desc: 'Paciente idoso sem companhia no domicilio' },
  { key: 'vulnerabilidadeSocial',  title: 'Vulnerabilidade social',               desc: 'Familia em situacao de vulnerabilidade' },
  { key: 'dificuldadeLocomocao',   title: 'Dificuldade de locomocao',             desc: 'Mobilidade reduzida ou acamado' },
  { key: 'beneficioSocial',        title: 'Beneficiario de programa social',      desc: 'Bolsa Familia, BPC ou similar' },
] as const;

const INPUT_CLS = 'w-full bg-white border border-acs-line rounded-[10px] px-4 py-3 text-[15px] text-acs-ink placeholder:text-acs-ink-4 focus:outline-none focus:ring-2 focus:ring-acs-azul-050 focus:border-acs-azul-300 transition-colors';

function FormField({ label, hint, required, error, children }: { label: string; hint?: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1.5">
        <label className="text-[13px] font-semibold text-acs-ink-2">{label}</label>
        {required && <span className="text-acs-vermelho text-[13px]">*</span>}
        {hint && <span className="text-[11px] text-acs-ink-4 ml-auto">{hint}</span>}
      </div>
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-acs-vermelho text-[12px]">
          <AlertCircle size={12} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function FormSectionHeader({ icon: Icon, title, desc }: { icon: typeof User; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-8 h-8 rounded-lg bg-acs-azul-050 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-acs-azul" strokeWidth={2} />
      </div>
      <div>
        <h2 className="font-display font-semibold text-acs-ink text-[16px] leading-tight">{title}</h2>
        <p className="text-[13px] text-acs-ink-3 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function FormToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-10 flex-shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-acs-azul' : 'bg-acs-ink-4'}`}
    >
      <span className={`pointer-events-none inline-block h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 mt-[3px] ${checked ? 'translate-x-[19px] ml-[1px]' : 'translate-x-[3px]'}`} />
    </button>
  );
}

export function NovoPaciente() {
  const navigate = useNavigate();
  const usuarioAuth = useAuthStore((s) => s.usuario);

  const [step, setStep] = useState(0);

  // Identificacao
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [cns, setCns] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [sexo, setSexo] = useState<Sexo>('f');

  // Localizacao
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cep, setCep] = useState('');
  const [microareaId, setMicroareaId] = useState<string>('');
  const [nomeReferencia, setNomeReferencia] = useState('');

  // Contexto social
  const [idosoMoraSozinho, setIdosoMoraSozinho]           = useState(false);
  const [vulnerabilidadeSocial, setVulnerabilidadeSocial] = useState(false);
  const [dificuldadeLocomocao, setDificuldadeLocomocao]   = useState(false);
  const [beneficioSocial, setBeneficioSocial]             = useState(false);

  // Comorbidades
  const [comorbidadesSel, setComorbidadesSel] = useState<Set<Comorbidade>>(new Set());

  // Microareas
  const [microareas, setMicroareas] = useState<MicroareaAPI[]>([]);

  // Busca por CPF já cadastrado
  const [pacienteExistente, setPacienteExistente] = useState<PacienteListagem | null>(null);
  const [buscandoCpf, setBuscandoCpf] = useState(false);

  // Submit
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function carregarMicroareas() {
      try {
        const { data } = await microareasService.listar(usuarioAuth?.municipioId);
        setMicroareas(data);
      } catch {
        // se falhar, deixa vazio — o campo ainda sera opcional
      }
    }
    carregarMicroareas();
  }, [usuarioAuth?.municipioId]);

  // Busca paciente existente pelo CPF
  useEffect(() => {
    const digits = cpf.replace(/\D/g, '');
    setPacienteExistente(null);
    if (digits.length !== 11) return;
    let cancelado = false;
    setBuscandoCpf(true);
    pacientesService.listar({ busca: digits, ativo: undefined })
      .then(({ data: res }) => {
        if (cancelado) return;
        const encontrado = res.data.find(p => p.cpf && p.cpf.replace(/\D/g, '') === digits);
        setPacienteExistente(encontrado ?? null);
        if (encontrado) setNome(encontrado.nome);
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) setBuscandoCpf(false); });
    return () => { cancelado = true; };
  }, [cpf]);

  // Preenchimento automático pelo CEP via ViaCEP
  useEffect(() => {
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) return;
    let cancelado = false;
    fetch(`https://viacep.com.br/ws/${digits}/json/`)
      .then(r => r.json())
      .then(d => {
        if (cancelado || d.erro) return;
        if (d.logradouro) setLogradouro(d.logradouro);
        if (d.bairro)     setBairro(d.bairro);
      })
      .catch(() => {});
    return () => { cancelado = true; };
  }, [cep]);

  // Seleção automática de microárea pelo bairro
  useEffect(() => {
    if (!bairro || microareaId) return;
    const bairroNorm = bairro.toLowerCase().trim();
    const match = microareas.find(m => m.nome.toLowerCase().includes(bairroNorm));
    if (match) setMicroareaId(String(match.id));
  }, [bairro, microareas]);

  const toggleComorbidade = (c: Comorbidade) => {
    setComorbidadesSel((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c); else next.add(c);
      return next;
    });
  };

  const socialSetters: Record<string, (v: boolean) => void> = {
    idosoMoraSozinho: setIdosoMoraSozinho,
    vulnerabilidadeSocial: setVulnerabilidadeSocial,
    dificuldadeLocomocao: setDificuldadeLocomocao,
    beneficioSocial: setBeneficioSocial,
  };

  const socialValues: Record<string, boolean> = {
    idosoMoraSozinho,
    vulnerabilidadeSocial,
    dificuldadeLocomocao,
    beneficioSocial,
  };

  const handleSalvar = async () => {
    setErro(null);

    if (!nome.trim() || !dataNascimento || !sexo) {
      setErro('Preencha nome, data de nascimento e sexo.');
      return;
    }

    const payload: CriarPacientePayload = {
      nome: nome.trim(),
      cpf: cpf || undefined,
      cns: cns || undefined,
      data_nascimento: dataNascimento,
      sexo,
      idoso_mora_sozinho:     idosoMoraSozinho,
      vulnerabilidade_social: vulnerabilidadeSocial,
      dificuldade_locomocao:  dificuldadeLocomocao,
      beneficio_social:       beneficioSocial,
      comorbidades: Array.from(comorbidadesSel),
    };

    if (logradouro.trim()) {
      payload.endereco = {
        logradouro: logradouro.trim(),
        numero: numero || undefined,
        complemento: complemento || undefined,
        bairro: bairro || undefined,
        cep: cep || undefined,
        microarea_id: microareaId ? Number(microareaId) : undefined,
        nome_referencia: nomeReferencia || undefined,
      };
    }

    setSalvando(true);
    try {
      await pacientesService.criar(payload);
      navigate('/pacientes');
    } catch (err: any) {
      setErro(err?.response?.data?.message ?? 'Erro ao salvar paciente.');
    } finally {
      setSalvando(false);
    }
  };

  /* ── Progress calculation ──────────────────────────────────── */
  const pct = useMemo(() => {
    let total = 0;
    if (nome.trim()) total += 20;
    if (dataNascimento) total += 20;
    if (logradouro.trim()) total += 20;
    if (microareaId) total += 15;
    if (comorbidadesSel.size > 0) total += 15;
    if (idosoMoraSozinho || vulnerabilidadeSocial || dificuldadeLocomocao || beneficioSocial) total += 10;
    return total;
  }, [nome, dataNascimento, logradouro, microareaId, comorbidadesSel, idosoMoraSozinho, vulnerabilidadeSocial, dificuldadeLocomocao, beneficioSocial]);

  /* ── ProgressRing SVG ──────────────────────────────────────── */
  const ringSize = 44;
  const ringStroke = 4;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (pct / 100) * ringCircumference;

  const ProgressRing = (
    <div className="relative flex items-center justify-center" style={{ width: ringSize, height: ringSize }}>
      <svg width={ringSize} height={ringSize} className="-rotate-90">
        <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="var(--acs-paper-2)" strokeWidth={ringStroke} />
        <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} fill="none" stroke="var(--acs-azul)" strokeWidth={ringStroke} strokeDasharray={ringCircumference} strokeDashoffset={ringOffset} strokeLinecap="round" className="transition-all duration-500" />
      </svg>
      <span className="absolute font-mono text-[10px] font-semibold text-acs-ink-2">{pct}%</span>
    </div>
  );

  /* ── Stepper Header ────────────────────────────────────────── */
  const StepperHeader = (
    <div className="flex items-center justify-between px-2 py-4">
      {STEPS.map((s, i) => {
        const isDone = i < step;
        const isActive = i === step;
        return (
          <div key={s.title} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              onClick={() => { if (isDone) setStep(i); }}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-colors ${
                isDone
                  ? 'bg-acs-verde text-white cursor-pointer'
                  : isActive
                    ? 'bg-acs-azul text-white'
                    : 'bg-acs-paper-2 text-acs-ink-3'
              }`}
            >
              {isDone ? <Check size={14} strokeWidth={2.5} /> : i + 1}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-2 rounded transition-colors ${isDone ? 'bg-acs-verde' : 'bg-acs-paper-2'}`} />
            )}
          </div>
        );
      })}
    </div>
  );

  /* ── Step Title ────────────────────────────────────────────── */
  const StepTitle = (
    <div className="mb-6">
      <p className="eyebrow mb-1">Passo {step + 1} de 4</p>
      <h2 className="font-display font-bold text-acs-ink text-[20px] leading-tight">{STEPS[step].label}</h2>
      <p className="text-[14px] text-acs-ink-3 mt-1">{STEPS[step].desc}</p>
    </div>
  );

  /* ── Step content ──────────────────────────────────────────── */
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div>
            <FormSectionHeader icon={User} title="Identificacao" desc="Informacoes basicas do paciente" />
            <div className="space-y-4">
              <FormField label="Nome completo" required>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Digite o nome completo" className={INPUT_CLS} />
              </FormField>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField label="CPF" hint="Opcional">
                  <div className="relative">
                    <input type="text" value={cpf} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 11); const m = d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); setCpf(m); }} placeholder="000.000.000-00" maxLength={14} inputMode="numeric" className={INPUT_CLS + (pacienteExistente ? ' border-acs-amar' : '')} />
                    {buscandoCpf && (
                      <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-acs-ink-3" />
                    )}
                  </div>
                  {pacienteExistente && (
                    <div className="mt-2 flex items-start gap-2 bg-acs-amar-100 border border-[#F2B134] rounded-xl p-3">
                      <UserCheck size={16} className="text-[#A3740A] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#A3740A]">Paciente ja cadastrado</p>
                        <p className="text-xs text-[#A3740A] truncate">{pacienteExistente.nome}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/paciente/${pacienteExistente.id}`)}
                        className="text-xs font-semibold text-acs-azul underline whitespace-nowrap"
                      >
                        Ver perfil
                      </button>
                    </div>
                  )}
                </FormField>
                <FormField label="CNS" hint="Cartao Nacional de Saude">
                  <input type="text" value={cns} onChange={(e) => setCns(e.target.value)} placeholder="000 0000 0000 0000" className={INPUT_CLS} />
                </FormField>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField label="Data de nascimento" required>
                  <input type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} className={INPUT_CLS} />
                </FormField>
                <FormField label="Sexo" required>
                  <div className="grid grid-cols-2 gap-3">
                    {(['m', 'f'] as Sexo[]).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSexo(val)}
                        className={`py-3 rounded-[10px] text-[15px] font-medium transition-colors ${
                          sexo === val
                            ? 'bg-acs-azul text-white'
                            : 'bg-white border border-acs-line text-acs-ink hover:border-acs-azul-300'
                        }`}
                      >
                        {val === 'm' ? 'Masculino' : 'Feminino'}
                      </button>
                    ))}
                  </div>
                </FormField>
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div>
            <FormSectionHeader icon={Home} title="Endereco" desc="Localizacao e referencia do domicilio" />
            <div className="space-y-4">
              <FormField label="Logradouro">
                <input type="text" value={logradouro} onChange={(e) => setLogradouro(e.target.value)} placeholder="Ex: Rua das Flores" className={INPUT_CLS} />
              </FormField>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField label="Numero">
                  <input type="text" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="123" className={INPUT_CLS} />
                </FormField>
                <FormField label="Complemento">
                  <input type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} placeholder="Apto, bloco, etc." className={INPUT_CLS} />
                </FormField>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField label="Bairro">
                  <input type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} placeholder="Ex: Centro" className={INPUT_CLS} />
                </FormField>
                <FormField label="CEP">
                  <input type="text" value={cep} onChange={(e) => { const d = e.target.value.replace(/\D/g, '').slice(0, 8); const m = d.replace(/(\d{5})(\d)/, '$1-$2'); setCep(m); }} placeholder="00000-000" maxLength={9} inputMode="numeric" className={INPUT_CLS} />
                </FormField>
              </div>

              <FormField label="Microarea">
                <select value={microareaId} onChange={(e) => setMicroareaId(e.target.value)} className={INPUT_CLS}>
                  <option value="">Selecione...</option>
                  {microareas.map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Referencia de localizacao">
                <textarea value={nomeReferencia} onChange={(e) => setNomeReferencia(e.target.value)} placeholder="Ex: Proximo ao mercado, casa azul..." className={`${INPUT_CLS} resize-none`} rows={3} />
              </FormField>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <FormSectionHeader icon={Heart} title="Contexto social" desc="Informacoes sobre vulnerabilidades e condicoes sociais" />
            <div className="space-y-3">
              {SOCIAL_FLAGS.map((flag) => (
                <div key={flag.key} className="flex items-center gap-3 bg-white rounded-xl border border-acs-line p-4">
                  <div className="w-9 h-9 rounded-[10px] bg-acs-azul-050 flex items-center justify-center flex-shrink-0">
                    <Heart size={16} className="text-acs-azul" strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-acs-ink leading-tight">{flag.title}</p>
                    <p className="text-[12px] text-acs-ink-3 mt-0.5">{flag.desc}</p>
                  </div>
                  <FormToggle checked={socialValues[flag.key]} onChange={(v) => socialSetters[flag.key](v)} />
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <FormSectionHeader icon={Stethoscope} title="Saude" desc="Selecione as comorbidades do paciente" />
            <div className="flex flex-wrap gap-2">
              {COMORBIDADES.map((c) => {
                const sel = comorbidadesSel.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleComorbidade(c.id)}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-semibold transition-colors ${
                      sel
                        ? 'bg-acs-azul text-white'
                        : 'bg-white border border-acs-line text-acs-ink hover:border-acs-azul-300'
                    }`}
                  >
                    {sel && <Check size={14} strokeWidth={2.5} />}
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-acs-paper">
      {/* ── Desktop header ──────────────────────────────────────── */}
      <div className="bg-white border-b border-acs-line">
        <div className="max-w-[760px] mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-acs-ink-3 hover:text-acs-ink transition-colors text-[14px]">
                <ArrowLeft size={18} strokeWidth={2} />
                <span className="hidden lg:inline">Pacientes</span>
              </button>
              <span className="hidden lg:block w-px h-5 bg-acs-line" />
              <h1 className="font-display font-bold text-acs-ink text-[18px] lg:text-[22px]">Novo paciente</h1>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <span className="text-[13px] text-acs-ink-3 font-medium">{pct}% preenchido</span>
              {ProgressRing}
            </div>
          </div>
        </div>
      </div>

      {/* ── Stepper header ──────────────────────────────────────── */}
      <div className="bg-white border-b border-acs-line">
        <div className="max-w-[760px] mx-auto px-4 lg:px-6">
          {StepperHeader}
        </div>
      </div>

      {/* ── Error banner ────────────────────────────────────────── */}
      {erro && (
        <div className="max-w-[760px] mx-auto w-full px-4 lg:px-6 mt-4">
          <div className="flex items-center gap-2.5 bg-acs-vermelho-100 border border-acs-vermelho/20 text-acs-vermelho rounded-xl px-4 py-3 text-[14px]">
            <AlertCircle size={16} className="flex-shrink-0" />
            {erro}
          </div>
        </div>
      )}

      {/* ── Form body ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-[760px] mx-auto px-4 lg:px-6 py-6">
          {StepTitle}
          <div className="card-acs p-5 lg:p-8">
            {renderStep()}
          </div>
        </div>
      </div>

      {/* ── Sticky footer ───────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-acs-line z-20">
        <div className="max-w-[760px] mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 lg:hidden">
            <span className="font-mono text-[11px] font-semibold text-acs-ink-3 tracking-wide">{pct}% preenchido</span>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-5 py-3 text-[14px] font-semibold text-acs-ink-2 hover:text-acs-ink transition-colors"
              >
                Voltar
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-acs-azul text-white rounded-xl text-[14px] font-semibold hover:bg-acs-azul-700 transition-colors"
              >
                Proximo
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSalvar}
                disabled={salvando}
                className="inline-flex items-center gap-2 px-6 py-3 bg-acs-azul text-white rounded-xl text-[14px] font-semibold hover:bg-acs-azul-700 transition-colors disabled:opacity-70"
              >
                {salvando && <Loader2 size={16} className="animate-spin" />}
                {salvando ? 'Salvando...' : 'Cadastrar paciente'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
