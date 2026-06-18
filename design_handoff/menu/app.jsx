/* App shell — workshop view com mobile + desktop lado a lado */

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "drawerOpen": true,
  "drawerLayout": "85",
  "showStats": true,
  "currentNav": "inicio"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS);
  const [tweakUIVisible, setTweakUIVisible] = useState(false);

  // Toolbar protocol
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setTweakUIVisible(true);
      else if (e.data?.type === '__deactivate_edit_mode') setTweakUIVisible(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const setTweak = (k, v) => {
    const next = typeof k === 'object' ? { ...tweaks, ...k } : { ...tweaks, [k]: v };
    setTweaks(next);
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: typeof k === 'object' ? k : {[k]: v} }, '*');
  };

  return (
    <div className="workshop">
      <div className="ws-header">
        <div>
          <div className="ws-brand" style={{ marginBottom: 14 }}>
            <div className="mark"><LogoMark size={20} /></div>
            <div>
              <div className="font-display" style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em' }}>ACS Expert</div>
              <div style={{ fontSize: 11, color: 'var(--acs-ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Design handoff</div>
            </div>
          </div>
          <div className="ws-title">
            <h1>Menu lateral <em>— drawer + sidebar</em></h1>
            <p>
              Drawer no mobile (hambúrguer + swipe da borda esquerda) e sidebar persistente no desktop.
              Mesmo conteúdo nos dois — cabeçalho do agente, microárea ativa, atalhos rápidos, navegação,
              status de sincronização e logout. Pronto para o time implementar.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <span className="chip-meta"><span className="dot"></span> v1 · 03 mai 2026</span>
          <span className="chip-meta">Identidade renovada</span>
        </div>
      </div>

      <div className="stage">

        {/* SECTION: MOBILE */}
        <SectionLabel
          n="01"
          title="Drawer mobile"
          desc="Aberto a partir do hambúrguer no topo esquerdo. Overlay escurece a tela; toque fora ou no X fecha."
        />
        <div className="iphone">
          <div className="iphone-screen">
            <IOSStatusBar time="08:14" />
            <DashboardMobile onOpenMenu={() => setTweak('drawerOpen', true)} />
            <MobileDrawer
              open={tweaks.drawerOpen}
              onClose={() => setTweak('drawerOpen', false)}
              current={tweaks.currentNav}
              onPick={(id) => setTweak('currentNav', id)}
              showStats={tweaks.showStats}
              layout={tweaks.drawerLayout}
            />
            <div className="home-indicator" />
          </div>
        </div>

        {/* SECTION: DESKTOP */}
        <SectionLabel
          n="02"
          title="Sidebar desktop"
          desc="Persistente à esquerda. Mesma estrutura visual — só a hierarquia tipográfica é mais compacta."
        />
        <div>
          <div className="desktop-bezel">
            <div className="desktop-top">
              <span className="dot r"></span>
              <span className="dot y"></span>
              <span className="dot g"></span>
              <div style={{ flex: 1, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.5)', fontFamily: 'var(--font-mono)' }}>
                acsexpert.app/inicio
              </div>
            </div>
            <div className="desktop">
              <DesktopSidebar
                current={tweaks.currentNav}
                onPick={(id) => setTweak('currentNav', id)}
                showStats={tweaks.showStats}
              />
              <DashboardDesktop />
            </div>
          </div>
        </div>

        {/* SECTION: ANATOMIA */}
        <SectionLabel
          n="03"
          title="Anatomia"
          desc="Sete blocos do mesmo sistema, na ordem visual de cima para baixo."
        />
        <Anatomia />

        {/* SECTION: ESTADOS */}
        <SectionLabel
          n="04"
          title="Estados — sync, microárea, navegação"
          desc="Variantes do drawer em estados-chave. Use como referência para QA."
        />
        <Estados />

        {/* SECTION: HANDOFF */}
        <SectionLabel
          n="05"
          title="Pacote de handoff"
          desc="Tudo que o Claude Code precisa para implementar."
        />
        <HandoffCards />

      </div>

      {tweakUIVisible && <TweakPanel tweaks={tweaks} setTweak={setTweak} onClose={() => {
        setTweakUIVisible(false);
        window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*');
      }} />}
    </div>
  );
}

function SectionLabel({ n, title, desc }) {
  return (
    <div style={{
      maxWidth: 720, width: '100%', margin: '20px auto 4px',
      textAlign: 'center', padding: '0 20px',
    }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>Seção {n}</div>
      <h2 className="font-display" style={{
        fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em',
        margin: 0, color: 'var(--acs-ink)',
      }}>{title}</h2>
      <p style={{
        fontSize: 14, color: 'var(--acs-ink-2)',
        margin: '8px auto 0', maxWidth: 560, lineHeight: 1.5,
      }}>{desc}</p>
    </div>
  );
}

// === ANATOMIA: lista de blocos com descrição ao lado ===
function Anatomia() {
  const blocos = [
    { num: '01', name: 'AgenteHero',       slot: 'header',    desc: 'Avatar + nome + matrícula + UBS. Fundo azul. Mobile: 130px alto, decoração de pulso. Desktop: 56px alto, compacto.' },
    { num: '02', name: 'MicroareaSwitcher',slot: 'subheader', desc: 'Chip clicável que abre dropdown com microáreas do ACS. Estado ativo destacado em azul-050.' },
    { num: '03', name: 'Atalhos',          slot: 'actions',   desc: '2 cards (Nova triagem coral, Cadastrar paciente azul). Disparam fluxos sem precisar navegar.' },
    { num: '04', name: 'NavList (primária)',slot: 'nav',      desc: '5 itens: Início · Agenda · Pacientes · Triagens · Alertas. Item ativo com fundo azul. Badges quando aplicável.' },
    { num: '05', name: 'StatsCard (opcional)',slot:'metrics', desc: '3 números: visitas, triagens, alertas. Pode ser ocultado pelo gestor (config).' },
    { num: '06', name: 'NavList (secundária)',slot:'nav',     desc: 'Configurações · Ajuda · Sobre. Sem badges.' },
    { num: '07', name: 'SyncStatus',       slot: 'footer',    desc: 'Online/offline + envios pendentes + última sincronização. Crítico para uso em campo.' },
    { num: '08', name: 'LogoutButton',     slot: 'footer',    desc: 'Botão de saída isolado, em vermelho-700, no rodapé. Confirmação antes de sair (não mostrada aqui).' },
  ];
  return (
    <div style={{
      maxWidth: 760, width: '100%',
      background: '#fff',
      border: '1px solid var(--acs-line)',
      borderRadius: 18,
      overflow: 'hidden',
    }}>
      {blocos.map((b, i) => (
        <div key={b.num} style={{
          display: 'grid', gridTemplateColumns: '60px 200px 1fr',
          gap: 16, alignItems: 'center',
          padding: '14px 18px',
          borderTop: i === 0 ? 'none' : '1px solid var(--acs-line)',
        }}>
          <div className="font-mono" style={{
            fontSize: 14, fontWeight: 700, color: 'var(--acs-coral)',
            letterSpacing: '0.02em',
          }}>{b.num}</div>
          <div>
            <div className="font-mono" style={{
              fontSize: 13, fontWeight: 600, color: 'var(--acs-ink)',
              letterSpacing: '0.005em',
            }}>{b.name}</div>
            <div style={{
              fontSize: 10, color: 'var(--acs-ink-3)',
              fontFamily: 'var(--font-mono)', letterSpacing: '.06em',
              textTransform: 'uppercase', marginTop: 2,
            }}>slot · {b.slot}</div>
          </div>
          <div style={{ fontSize: 13, color: 'var(--acs-ink-2)', lineHeight: 1.5 }}>{b.desc}</div>
        </div>
      ))}
    </div>
  );
}

// === ESTADOS ===
function Estados() {
  return (
    <div style={{
      maxWidth: 1100, width: '100%',
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
      gap: 14,
    }}>
      <EstadoCard titulo="Online · sincronizado">
        <SyncStatus sync={{ online: true, pendingSync: 0, lastSync: 'há 1 min' }} layout="mobile" />
      </EstadoCard>
      <EstadoCard titulo="Online · com pendências">
        <SyncStatus sync={{ online: true, pendingSync: 2, lastSync: 'há 4 min' }} layout="mobile" />
      </EstadoCard>
      <EstadoCard titulo="Offline">
        <SyncStatus sync={{ online: false, pendingSync: 5, lastSync: 'há 32 min' }} layout="mobile" />
      </EstadoCard>
      <EstadoCard titulo="Microárea · fechada">
        <MicroareaSwitcher user={ACS_USER} layout="mobile" />
      </EstadoCard>
      <EstadoCard titulo="Item ativo · navegação">
        <NavList items={NAV_ITEMS.slice(0, 3)} current="inicio" layout="mobile" />
      </EstadoCard>
      <EstadoCard titulo="Badge urgente · alertas">
        <NavList items={[NAV_ITEMS[4], NAV_ITEMS[1]]} current={null} layout="mobile" />
      </EstadoCard>
    </div>
  );
}

function EstadoCard({ titulo, children }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--acs-line)',
      borderRadius: 16,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--acs-line)',
        background: 'var(--acs-paper-2)',
      }}>
        <div className="eyebrow">{titulo}</div>
      </div>
      <div style={{ padding: '6px 0' }}>{children}</div>
    </div>
  );
}

// === HANDOFF CARDS ===
function HandoffCards() {
  return (
    <div style={{
      maxWidth: 1100, width: '100%',
      display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
      gap: 14,
    }}>
      <HandoffCard
        eyebrow="Documento"
        title="PROMPT.md"
        desc="Prompt completo para o Claude Code com escopo, arquivos a criar, contratos, comportamentos, acessibilidade e critérios de aceite."
        link="menu-handoff/PROMPT.md"
        cta="Abrir prompt"
        icon="sparkles"
      />
      <HandoffCard
        eyebrow="Documento"
        title="SPEC.md"
        desc="Especificação técnica: árvore de componentes, props, tokens utilizados, estados, breakpoints e edge cases."
        link="menu-handoff/SPEC.md"
        cta="Abrir spec"
        icon="clipboard-check"
      />
      <HandoffCard
        eyebrow="Código"
        title="Componentes JSX"
        desc="Source dos componentes deste protótipo (atoms.jsx · drawer.jsx · dashboards). Use como referência visual."
        link="menu-handoff/"
        cta="Ver pasta"
        icon="settings"
      />
    </div>
  );
}

function HandoffCard({ eyebrow, title, desc, link, cta, icon }) {
  return (
    <a href={link} target="_blank" rel="noopener" style={{
      display: 'block', textDecoration: 'none', color: 'inherit',
      background: '#fff',
      border: '1px solid var(--acs-line)',
      borderRadius: 18,
      padding: '20px 22px 22px',
      transition: 'transform .15s, box-shadow .15s',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 11,
        background: 'var(--acs-azul-050)', color: 'var(--acs-azul)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <Icon name={icon} size={18} strokeWidth={2.2} color="var(--acs-azul)" />
      </div>
      <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>
      <div className="font-display" style={{
        fontSize: 18, fontWeight: 700, letterSpacing: '-0.018em',
        marginBottom: 8,
      }}>{title}</div>
      <p style={{
        fontSize: 13, color: 'var(--acs-ink-2)', lineHeight: 1.5,
        margin: '0 0 14px',
      }}>{desc}</p>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 600, color: 'var(--acs-coral)',
        letterSpacing: '-0.005em',
      }}>
        {cta} <Icon name="arrow-right" size={14} color="var(--acs-coral)" strokeWidth={2.4} />
      </span>
    </a>
  );
}

// === TWEAK PANEL ===
function TweakPanel({ tweaks, setTweak, onClose }) {
  return (
    <div className="tweak-panel">
      <div className="tweak-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="sliders-horizontal" size={14} color="var(--acs-ink-2)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--acs-ink)' }}>Tweaks</span>
        </div>
        <button onClick={onClose} style={{
          width: 24, height: 24, border: 'none', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--acs-ink-3)',
        }}><Icon name="x" size={14} /></button>
      </div>
      <div className="tweak-body">
        <TweakRow label="Drawer mobile">
          <Segmented
            value={tweaks.drawerOpen ? 'open' : 'closed'}
            onChange={v => setTweak('drawerOpen', v === 'open')}
            options={[{value:'open',label:'Aberto'},{value:'closed',label:'Fechado'}]}
          />
        </TweakRow>
        <TweakRow label="Largura do drawer">
          <Segmented
            value={tweaks.drawerLayout}
            onChange={v => setTweak('drawerLayout', v)}
            options={[{value:'85',label:'86%'},{value:'full',label:'Full-screen'}]}
          />
        </TweakRow>
        <TweakRow label="Stats da semana">
          <Segmented
            value={tweaks.showStats ? 'on' : 'off'}
            onChange={v => setTweak('showStats', v === 'on')}
            options={[{value:'on',label:'Mostrar'},{value:'off',label:'Ocultar'}]}
          />
        </TweakRow>
        <TweakRow label="Item ativo">
          <select
            value={tweaks.currentNav}
            onChange={e => setTweak('currentNav', e.target.value)}
            style={{
              width: '100%', padding: '8px 10px',
              border: '1px solid var(--acs-line-strong)',
              borderRadius: 8, fontSize: 13, fontFamily: 'inherit',
              background: '#fff',
            }}
          >
            {NAV_ITEMS.map(it => <option key={it.id} value={it.id}>{it.label}</option>)}
            {SECONDARY_ITEMS.map(it => <option key={it.id} value={it.id}>{it.label}</option>)}
          </select>
        </TweakRow>
      </div>
    </div>
  );
}

function TweakRow({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--acs-ink-3)',
        textTransform: 'uppercase', letterSpacing: '.04em',
        fontFamily: 'var(--font-mono)', marginBottom: 6,
      }}>{label}</div>
      {children}
    </div>
  );
}

// Mount
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
