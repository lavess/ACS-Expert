# Menu Lateral — SPEC

> Drawer mobile + sidebar desktop responsivos para o ACS Expert.
> Versão: 1.0 — 03 mai 2026.

---

## 1. Objetivo

Substituir o atual menu (se existente) por uma estrutura única de navegação secundária que funcione em ambos os layouts:

- **Mobile (`< 1024px`)** → drawer overlay aberto via hambúrguer ou swipe da borda esquerda.
- **Desktop (`≥ 1024px`)** → sidebar persistente à esquerda, sempre visível.

O conteúdo é **idêntico**; apenas a hierarquia tipográfica e densidade mudam.

---

## 2. Árvore de componentes

```
<AppShell>
├── <SideNav layout="mobile" | "desktop">      ← componente raiz
│   ├── <AgenteHero user layout />              ← cabeçalho com avatar + UBS
│   ├── <MicroareaSwitcher user layout />       ← chip dropdown da microárea
│   ├── <Atalhos layout onAction />             ← 2 cards (triagem · cadastro)
│   ├── <NavList items current onPick layout /> ← navegação principal
│   ├── <StatsBlock weekData layout />          ← (opcional) números da semana
│   ├── <NavList items layout heading="Conta">  ← navegação secundária
│   ├── <SyncStatus sync layout />              ← rodapé · banner de sync
│   └── <LogoutButton layout />                 ← rodapé · sair
└── <main>{children}</main>
```

No mobile, `<SideNav>` é montado dentro de `<MobileDrawer>`, que envelopa overlay + animação. No desktop é montado direto no shell.

---

## 3. Props (TypeScript)

```ts
type Layout = 'mobile' | 'desktop';

interface SideNavProps {
  user: AcsUser;
  sync: SyncState;
  current: NavId;
  onNavigate: (id: NavId) => void;
  onMicroareaChange: (ma: string) => void;
  onShortcut: (action: 'triagem' | 'cadastro') => void;
  onLogout: () => void;
  layout: Layout;
  showStats?: boolean;        // default: true
}

interface MobileDrawerProps extends SideNavProps {
  open: boolean;
  onClose: () => void;
  variant?: '85' | 'full';    // default: '85'  (largura)
}

interface AcsUser {
  id: string;
  nome: string;
  iniciais: string;           // 2 chars, derivados em runtime
  matricula: string;          // ex.: 'ACS-04812'
  ubs: { id: string; nome: string };
  microareaAtual: string;
  microareasPossiveis: string[];
  semana?: { visitas: number; triagens: number; alertas: number };
}

interface SyncState {
  online: boolean;
  pendingSync: number;        // 0 = sincronizado
  lastSyncAt: string;         // ISO; formatar relativo no UI ("há 4 min")
}

type NavId =
  | 'inicio' | 'agenda' | 'pacientes' | 'triagens' | 'alertas'
  | 'config' | 'ajuda'   | 'sobre';

interface NavItem {
  id: NavId;
  label: string;
  icon: LucideIcon;
  badge?: number | string;
  urgent?: boolean;           // pinta badge em coral
}
```

---

## 4. Tokens utilizados

Lê de `tokens/theme.css` (já existe no projeto):

| Uso | Token |
|-----|-------|
| Hero do agente, botões primários | `--acs-azul`, `--acs-azul-900` |
| Item ativo da nav | `--acs-azul` (bg) + `#fff` (texto) |
| Dropdown microárea | `--acs-azul-050` (selecionado), `--acs-azul-100` (border) |
| Atalho coral (Nova triagem) | `--acs-coral`, `--acs-coral-100`, `--acs-coral-700` |
| Atalho azul (Cadastrar paciente) | `--acs-azul`, `--acs-azul-050` |
| Badge urgente (alertas) | `--acs-coral` |
| Sync online | `--acs-verde`, `--acs-verde-100` |
| Sync offline | `--acs-amar`, `--acs-amar-100` |
| Logout | `--acs-vermelho-700` |
| Background do drawer/sidebar | `--acs-paper` (mobile), `#fff` (desktop) |
| Bordas, divisores | `--acs-line`, `--acs-line-strong` |
| Texto | `--acs-ink`, `--acs-ink-2` (secundário), `--acs-ink-3` (legenda) |

Tipografia:
- **Display** (nomes, números) → `Sora`, peso 700, `letter-spacing: -0.02em`.
- **UI sans** (labels, body) → `Inter`, peso 500/600.
- **Mono** (matrícula, microárea, eyebrows, badges numéricos) → `IBM Plex Mono`, `font-feature-settings: "tnum"`.

---

## 5. Dimensões

### Mobile drawer
- Largura: `86%` da viewport (variant `'85'`) ou `100%` (variant `'full'`).
- Border-radius: `22px` à direita (variant 85), `0` (variant full).
- Animação de entrada: `transform: translateX(-100%) → 0`, `0.25s cubic-bezier(.32,.72,.22,1)`.
- Overlay: `rgba(8,15,30,.45)` + `backdrop-filter: blur(2px)`, fade `0.2s`.
- Hero: 130px de altura.

### Desktop sidebar
- Largura: `252px` (fixa).
- Sempre visível em `≥ 1024px`. Não colapsa.
- Brand bar no topo: 56px com logo + "ACS Expert".
- Hero compacto: 56px.

---

## 6. Comportamentos

### Abertura do drawer (mobile)
1. **Hambúrguer** (botão 40×40 no canto superior esquerdo do app bar).
2. **Swipe da borda esquerda** — área de gesto de 16px da borda; arrastar para a direita abre.
3. Recebe foco no botão de fechar quando aberto (a11y).
4. Trap de foco enquanto aberto. Tab/Shift+Tab cicla apenas dentro do drawer.
5. `Esc` fecha. Toque no overlay fecha. Botão X fecha.
6. Body bloqueia scroll (`overflow: hidden`) enquanto aberto.

### Microárea switcher
- Click no chip → expande dropdown com `microareasPossiveis`.
- Selecionar uma microárea → fecha dropdown + chama `onMicroareaChange`.
- Item atualmente ativo fica com fundo `--acs-azul-050` e check à direita.
- Mostra contagem de famílias ao lado (`'142 famílias · trocar'`).

### Atalhos
- **Nova triagem** (coral) → `onShortcut('triagem')` → fecha drawer + navega para `/triagem/nova`.
- **Cadastrar paciente** (azul) → `onShortcut('cadastro')` → fecha drawer + navega para `/pacientes/novo`.

### Item de navegação
- Click → `onNavigate(id)` → fecha drawer (mobile) + navega.
- Estado ativo: fundo `--acs-azul`, texto branco.
- Badge: pílula 22px à direita. Se `urgent: true`, coral; se `active`, branco translúcido; senão, `paper-2`.

### Sync status
- Online + 0 pendentes: verde, "Sincronizado · há X".
- Online + N pendentes: amarelo no ícone + dot, "N envios pendentes · há X".
- Offline: amarelo full, "Sem conexão", lista pendentes.
- Click no banner (futuro) → abre detalhe de sync.

### Logout
- Click → abre confirmação `<Dialog>` ("Sair da conta?").
- Confirmar → limpa tokens + redireciona para login.
- Texto em vermelho-700, ícone de log-out.

---

## 7. Acessibilidade

- Drawer = `role="dialog" aria-modal="true" aria-labelledby="drawer-title"`.
- Hambúrguer = `aria-label="Abrir menu"` + `aria-expanded={open}` + `aria-controls="side-drawer"`.
- Botão fechar = `aria-label="Fechar menu"`.
- Sidebar desktop = `role="navigation" aria-label="Navegação principal"`.
- Cada item de nav: `aria-current="page"` quando ativo.
- Badge urgente: include `aria-label="3 alertas pendentes"` (não só visual).
- Contraste mínimo: AA nos atalhos coral/branco, AA+ no item ativo azul.
- Focus ring visível: 2px outline `--acs-azul` com 2px offset.

---

## 8. Responsividade

| Breakpoint | Comportamento |
|-----------|--------------|
| `< 1024px` | Drawer mobile + bottom nav. Sidebar **não** renderiza. |
| `≥ 1024px` | Sidebar persistente + top bar (sem hambúrguer). Drawer **não** renderiza. |

Implementação: `useMediaQuery('(min-width: 1024px)')` ou Tailwind `lg:` prefix.

---

## 9. Estados a cobrir em testes

- [ ] Drawer abre/fecha por hambúrguer
- [ ] Drawer abre por swipe (gesture)
- [ ] Drawer fecha por overlay click, Esc, X, item de nav
- [ ] Trap de foco funciona
- [ ] Microárea: dropdown abre/fecha + seleção dispara handler
- [ ] Atalho: navega + fecha drawer (mobile)
- [ ] Item ativo destaca corretamente em ambos layouts
- [ ] SyncStatus reflete: online-zero · online-pending · offline
- [ ] Logout abre confirmação
- [ ] Sidebar não renderiza < 1024px
- [ ] Drawer não renderiza ≥ 1024px

---

## 10. Edge cases

- **Nome longo do agente** → truncar com ellipsis (`white-space: nowrap; overflow: hidden; text-overflow: ellipsis`).
- **Apenas 1 microárea** → chip sem dropdown (não-clicável visualmente, ou esconde a seta).
- **Sem dados de semana** → omite o `<StatsBlock>` por completo.
- **Nome de UBS muito longo** → 2 linhas máx + ellipsis.
- **Badge muito grande (`> 99`)** → renderizar como `99+`.
- **Slow network** → `lastSyncAt` mostra "sincronizando…" enquanto a request está em voo.
